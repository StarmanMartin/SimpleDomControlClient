import {uuidv4} from "./sdc_utils.js";
import {getModel} from "./sdc_socket.js"
import {app} from "./sdc_main.js";
import {trigger} from "./sdc_events.js";

const MAX_FILE_UPLOAD = 25000;
const CONNECTING_REQUEST_ID = "_connecting_process";

/**
 * Parse hidden input values back into the closest JavaScript primitive.
 *
 * Hidden inputs are often used to preserve values that were originally booleans,
 * numbers or quoted strings. This keeps form-to-model sync from turning
 * everything into plain strings.
 *
 * @param {string} value
 * @returns {*}
 */
function parseHiddenInputs(value) {
  let isFloatReg = /^-?\d+\.?\d+$/;
  let isIntReg = /^-?\d+$/;
  let isBoolReg = /^(true|false)$/;
  let isStringReg = /^(['][^']*['])|(["][^"]*["])$/;

  if (value.toLowerCase().match(isBoolReg)) {
    return value.toLowerCase() === "true";
  } else if (value === "undefined") {
    return undefined;
  } else if (value.toLowerCase() === "none") {
    return null;
  } else if (value.match(isIntReg)) {
    return parseInt(value, 10);
  } else if (value.match(isFloatReg)) {
    return parseFloat(value);
  } else if (value.match(isStringReg)) {
    return value.substring(1, value.length - 1);
  }
  return value;
}

/**
 * Normalize an incoming primary key value.
 *
 * `-1` is used throughout this module as the sentinel for "new object / no pk".
 *
 * @param {*} pk
 * @returns {number}
 */
function normalizePk(pk) {
  const normalizedPk = parseInt(pk ?? -1, 10);
  return Number.isNaN(normalizedPk) ? -1 : normalizedPk;
}

export class SdcQuerySet {
  /**
   * Lightweight client-side collection wrapper around the SDC model websocket.
   *
   * The queryset exposes array-like access through a proxy while also keeping
   * track of socket state and outstanding requests for that model.
   *
   * @param {string} modelName
   * @param {object} modelQuery
   */
  constructor(modelName, modelQuery = {}) {
    this.valuesList = [];
    this.loaded = false;
    this.modelName = modelName;
    this.modelQuery = modelQuery ?? {};
    this._onNoOpenRequests = [];
    this.valuesList = [];
    this._isConnected = false;
    this._isConnectingProcess = false;
    this._autoReconnect = true;
    this.socket = null;
    // Request resolvers are stored by websocket event id until the server responds.
    this.openRequest = {};
    this.modelId = 0;
    this.onUpdate = () => {
    };
    this.onCreate = () => {
    };

    return new Proxy(this, {
      get(target, prop) {
        if (!isNaN(prop)) {
          return target.valuesList[prop];
        }
        return target[prop];
      },

      set(target, prop, value) {
        if (!isNaN(prop)) {
          target.valuesList[prop] = value;
          return true;
        }
        target[prop] = value;
        return true;
      }
    });
  }

  [Symbol.iterator]() {
    let idx = -1;
    return {
      next: () => {
        ++idx;
        if (idx < this.valuesList.length) {
          return {value: this.valuesList[idx], done: false};
        }
        return {value: null, done: true};
      },
    };
  }

  /**
   *
   *
   * @param {Array<integr>|integer|SdcModel|SdcQuerySet} ids
   */
  setIds(ids) {
    if( ids instanceof SdcQuerySet) {
      this.valuesList = structuredClone(ids.valuesList);
      this.valuesList.forEach(value => value._setQuerySet(this, true));
    } else if (ids instanceof SdcModel) {
      this.valuesList = [structuredClone(ids)];
      this.valuesList.forEach(value => value._setQuerySet(this, true));
    } else if (Number.isInteger(ids)) {
      const newModel = this.new();
      newModel.id = ids;
    } else {
      this.valuesList = this.valuesList.filter(item => ids.includes(item.id));
      const valueIds = this.getIds();
      ids.filter(x => !valueIds.includes(x)).forEach((id) => {
        this.valuesList.push(new (getModel(this.modelName)({id})));
      });
    }
    return this.valuesList;
  }

  getIds() {
    return this.valuesList.map(x => x.id);
  }

  /**
   * Number of model instances currently present in the queryset cache.
   *
   * @returns {number}
   */
  get length() {
    return this.valuesList.length;
  }

  /**
   * Resolve a model instance by id, loading the queryset first if needed.
   *
   * @param {*} id
   * @returns {SdcModel|null}
   */
  byId(id) {
    if (id !== null) {
      const normalizedId = normalizePk(id);
      return this.valuesList.find((elm) => elm.id === normalizedId) ?? null;
    }

    return null;
  }

  /**
   * Merge additional query constraints into the current queryset.
   *
   * @param {object} modelQuery
   * @returns {SdcQuerySet}
   */
  setFilter(modelQuery) {
    this.modelQuery = modelQuery;
    return this;
  }

  addFilter(modelQuery) {
    this.modelQuery = Object.assign({}, this.modelQuery, modelQuery);
    return this;
  }

  /**
   * @returns {SdcModel}
   */
  new() {
    const newModel = new (getModel(this.modelName))();
    newModel._setQuerySet(this, false);
    this.valuesList.push(newModel);
    return newModel;
  }

  /**
   * Load model instances matching the current query into the queryset cache.
   *
   * @param {?object} modelQuery
   * @returns {Promise<SdcQuerySet>}
   */
  async load(modelQuery = null) {
    if (this.loaded) {
      return this;
    }
    this.modelQuery = modelQuery ?? this.modelQuery;
    return this._sendLoad();
  }

  /**
   * Load model instances matching the current query into the queryset cache.
   *
   * @param {?object} modelQuery
   * @returns {Promise<SdcQuerySet>}
   */
  async update(modelQuery = null) {
    if (!this.loaded) {
      return this.load(modelQuery);
    }
    this.modelQuery = modelQuery ?? this.modelQuery;
    const results = await this._sendLoad();
    for (const x of results) {
      const newModel = new (getModel(this.modelName)(x));
      const currentModel = this.byId(newModel.id);
      if (currentModel) {
        currentModel.setValues(newModel);
      } else {
        this.valuesList.push(newModel);
        newModel._setQuerySet(this, true);
      }
    }
    return this;
  }

  /**
   * Request the server-side queryset data over the model websocket.
   *
   * @returns {Promise<*>}
   */
  _sendLoad() {
    return this.isConnected().then(() => {
      const id = uuidv4();
      return new Promise((resolve, reject) => {
        this.socket.send(
          JSON.stringify({
            event: "model",
            event_type: "load",
            event_id: id,
            args: {
              model_name: this.modelName,
              model_query: this.modelQuery,
            },
          }),
        );

        this.openRequest[id] = [resolve, reject];
      });
    });
  }

  /**
   * Render the list-view endpoint for the current model.
   *
   * @param {object} options
   * @returns {*}
   */
  _sendListView({
                  modelQuery = {},
                  cbResolve = null,
                  cbReject = null,
                  templateContext = {},
                }) {
    return this.view({
      modelQuery,
      cbResolve,
      cbReject,
      templateContext,
      eventType: "list_view",
    });
  }

  /**
   * Render a named model view and append its HTML to a container element.
   *
   * @param {object} options
   * @returns {*}
   */
  view({
         viewName = "html_list_template",
         modelQuery = {},
         cbResolve = null,
         cbReject = null,
         templateContext = {},
         eventType = "named_view",
       }) {
    let $divList = $('<div class="container-fluid">');
    this.isConnected().then(() => {
      const id = uuidv4();
      this.socket.send(
        JSON.stringify({
          event: "model",
          event_type: eventType,
          event_id: id,
          args: {
            view_name: viewName,
            model_name: this.modelName,
            model_query: modelQuery,
            template_context: templateContext,
          },
        }),
      );

      this.openRequest[id] = [
        (data) => {
          $divList.append(data.html);
          app.refresh($divList);
          cbResolve && cbResolve(data);
        },
        (res) => {
          cbReject && cbReject(res);
        },
      ];
    });

    return $divList;
  }

  /**
   * Render the detail-view endpoint for a single model instance.
   *
   * @param {object} options
   * @returns {*}
   */
  _sendDetailView({
                    pk = null,
                    cbResolve = null,
                    cbReject = null,
                    templateContext = {},
                  }) {
    pk = normalizePk(pk);
    let $divList = $('<div class="container-fluid">');

    this.isConnected().then(() => {
      if (pk === -1) {
        pk = this.valuesList[0].pk;
      }
      const id = uuidv4();
      this.socket.send(
        JSON.stringify({
          event: "model",
          event_type: "detail_view",
          event_id: id,
          args: {
            model_name: this.modelName,
            model_query: this.modelQuery,
            pk,
            template_context: templateContext,
          },
        }),
      );

      this.openRequest[id] = [
        (data) => {
          $divList.append(data.html);
          app.refresh($divList);
          cbResolve && cbResolve(data);
        },
        (res) => {
          cbReject && cbReject(res);
        },
      ];
    });

    return $divList;
  }

  /**
   * Fetch a model form fragment and attach the SDC form metadata expected by
   * the rest of the client.
   *
   * @param {object} options
   */
  getForm({modelObj, eventType, formName, $divForm, cbResolve, cbReject, formId}) {
    const id = uuidv4();
    const pk = modelObj.id ?? -1;
    this.isConnected().then(() => {
      this.socket.send(
        JSON.stringify({
          event: "model",
          event_type: eventType,
          event_id: id,
          args: {
            model_name: this.modelName,
            pk,
            form_name: formName,
          },
        }),
      );
    });

    const className = pk === null || pk === -1 ? "create" : "edit";

    this.openRequest[id] = [
      (data) => {
        $divForm.append(data.html);
        let $form = $divForm
          .closest("form")
          .addClass(
            `sdc-model-${className}-form sdc-model-form ${formId}`,
          )
          .data("model", modelObj)
          .data("model_pk", pk)
          .data("form_name", formName);
        if ($form.length > 0 && !$form[0].hasAttribute("sdc_submit")) {
          $form.attr("sdc_submit", "submitModelFormDistributor");
        }

        app.refresh($divForm).then(() => null);
        cbResolve && cbResolve(data);
      },
      (res) => {
        cbReject && cbReject(res);
      },
    ];
  }

  /**
   * Fetch a single model instance matching the current query.
   *
   * @param {?object} modelQuery
   * @returns {Promise<SdcModel>}
   */
  async get(modelQuery = null) {
    await this.load(modelQuery);
    if (this.length !== 1) {
      throw new Error(`model query returns ${this.length} but only 1 expected.`);
    }

    return this.valuesList[0];
  }

  detailView({pk, cbResolve = null, cbReject = null, templateContext = {}}) {
    return this._sendDetailView({
      pk,
      cbResolve,
      cbReject,
      templateContext,
    });
  }

  listView({modelQuery = {}, cbResolve = null, cbReject = null, templateContext = {}}) {
    return this._sendListView({
      modelQuery: Object.assign({}, this.modelQuery, modelQuery),
      cbResolve,
      cbReject,
      templateContext,
    });
  }

  save({pk = null, formName = "edit_form", data = null}) {
    const normPk = normalizePk(pk);
    return this.isConnected().then(() => {
      let elemList;
      if (normPk > -1) {
        elemList = [this.byId(normPk)];
      } else {
        elemList = this.valuesList;
      }
      let pList = [];
      data ??= elem.serialize();
      data.pk = pk;
      elemList.forEach((elem) => {
        const id = uuidv4();
        pList.push(
          new Promise((resolve, reject) => {
            this._readFiles(elem).then((files) => {
              this.socket.send(
                JSON.stringify({
                  event: "model",
                  event_type: "save",
                  event_id: id,
                  args: {
                    form_name: formName,
                    model_name: this.modelName,
                    model_query: this.modelQuery,
                    data,
                    pk,
                    files: files,
                  },
                }),
              );

              this.openRequest[id] = [
                (res) => {
                  let data =
                    typeof res.data.instance === "string"
                      ? JSON.parse(res.data.instance)
                      : res.data.instance;
                  res.data.instance = this._parseServerRes(data);
                  resolve(res);
                },
                reject,
              ];
            });
          }),
        );
      });

      return Promise.all(pList);
    });
  }

  /**
   *
   * @param elem {SdcModel}
   * @param data {object}
   * @returns {Promise<unknown>}
   */
  create({elem, data = null}) {
    const id = uuidv4();
    return this.isConnected().then(() => {
      return new Promise((resolve, reject) => {
        this._readFiles(elem).then((files) => {
          this.socket.send(
            JSON.stringify({
              event: "model",
              event_type: "create",
              event_id: id,
              args: {
                model_name: this.modelName,
                model_query: this.modelQuery,
                data: data ?? elem.serialize(),
                files: files,
              },
            }),
          );

          this.openRequest[id] = [
            (res) => {
              let data =
                typeof res.data.instance === "string"
                  ? JSON.parse(res.data.instance)
                  : res.data.instance;
              res.data.instance = this._parseServerRes(data)[0];
              resolve(res);
            },
            reject,
          ];
        });
      });
    });
  }

  /**
   * Ensure the websocket is open and has completed the server-side connect
   * handshake before issuing model requests.
   *
   * Multiple callers can arrive while a connection attempt is already in
   * progress. In that case they are queued behind the same synthetic request id.
   *
   * @returns {Promise<void>}
   */
  isConnected() {
    return new Promise((resolve, reject) => {
      if (this._isConnected) {
        resolve();
      } else if (
        !this._isConnectingProcess ||
        !this.openRequest[CONNECTING_REQUEST_ID]
      ) {
        this._isConnectingProcess = true;
        this.openRequest[CONNECTING_REQUEST_ID] = [() => {
        }, () => {
        }];
        this._connectToServer().then(() => {
          resolve(this._checkConnection());
        });
      } else {
        const [resolveOrigin, rejectOrigin] =
          this.openRequest[CONNECTING_REQUEST_ID];
        this.openRequest[CONNECTING_REQUEST_ID] = [
          () => {
            resolveOrigin();
            resolve();
          },
          () => {
            rejectOrigin();
            reject();
          },
        ];
      }
    });
  }

  /**
   * Close the websocket and disable automatic reconnect for this queryset.
   */
  close() {
    if (this.socket) {
      this._autoReconnect = false;
      this.socket.onclose = () => {
      };
      this.socket.close();
      delete this["socket"];
    }
  }

  /**
   * Upload attached `File` values in fixed-size chunks before save/create calls.
   *
   * @param {SdcModel} elem
   * @returns {Promise<object>}
   */
  _readFiles(elem) {
    let toSolve = [];
    let files = {};
    Object.entries(elem).forEach(([key, value]) => {
      if (value instanceof File) {
        toSolve.push(
          new Promise(async (resolve, reject) => {
            const id = uuidv4();
            this.openRequest[id] = [resolve, reject];

            let result = await value.arrayBuffer();
            let numberOfChunks = Math.ceil(result.length / MAX_FILE_UPLOAD);
            files[key] = {
              id: id,
              file_name: value.name,
              field_name: key,
              content_length: value.size,
            };
            for (let i = 0; i < numberOfChunks; ++i) {
              this.socket.send(
                JSON.stringify({
                  event: "model",
                  event_type: "upload",
                  event_id: id,
                  args: {
                    chunk: result.slice(
                      MAX_FILE_UPLOAD * i,
                      MAX_FILE_UPLOAD * (i + 1),
                    ),
                    idx: i,
                    number_of_chunks: numberOfChunks,
                    file_name: value.name,
                    field_name: key,
                    content_length: value.size,
                    content_type: value.type,
                    model_name: this.modelName,
                    model_query: this.modelQuery,
                  },
                }),
              );
            }
          }),
        );
      }
    });

    return Promise.all(toSolve).then(() => {
      return files;
    });
  }

  /**
   * Route websocket responses to the matching pending request and update local
   * state when the server sends model payloads.
   *
   * @param {MessageEvent} e
   */
  async _onMessage(e) {
    let data = JSON.parse(e.data);
    if (data.is_error) {
      if (this.openRequest.hasOwnProperty(data.event_id)) {
        this.openRequest[data.event_id][1](data);
        this._closeOpenRequest(data.event_id);
      }
      if (data.msg || data.header) {
        trigger("pushErrorMsg", data.header || "", data.msg || "");
      }

      if (data.type === "connect") {
        this.openRequest[CONNECTING_REQUEST_ID][1](data);
        this._closeOpenRequest(CONNECTING_REQUEST_ID);
        this._autoReconnect = false;
        this.socket.close();
      }
    } else {
      if (data.msg || data.header) {
        trigger("pushMsg", data.header || "", data.msg || "");
      }

      if (data.type === "connect") {
        this._isConnected = true;
        this._isConnectingProcess = false;
        this.openRequest[CONNECTING_REQUEST_ID][0](data);
        this._closeOpenRequest(CONNECTING_REQUEST_ID);
      } else if (["load", "named_view", "detail_view"].includes(data.type)) {
        const jsonRes = JSON.parse(data.args.data);
        this.valuesList = [];
        data.args.data = await this._parseServerRes(jsonRes);
      } else if (data.type === "on_update" || data.type === "on_create") {
        const jsonRes = JSON.parse(data.args.data);

        let obj = await this._parseServerRes(jsonRes);
        let cb;

        if (data.type === "on_create") {
          cb = this.onCreate;
        } else {
          cb = this.onUpdate;
        }

        cb(obj);
        data.args.data = obj;
      }

      let instance = data.data?.instance;
      if (instance) {
        data.data.instance = JSON.parse(data.data.instance);
      }

      if (this.openRequest.hasOwnProperty(data.event_id)) {
        this.openRequest[data.event_id][0](data);
        this._closeOpenRequest(data.event_id);
      }
    }
  }

  /**
   * Wait until all in-flight websocket requests for this queryset are resolved.
   *
   * @returns {Promise<void>}
   */
  noOpenRequests() {
    return new Promise((resolve) => {
      if (Object.keys(this.openRequest).length === 0) {
        return resolve();
      }

      this._onNoOpenRequests.push(resolve);
    });
  }

  /**
   * Remove a completed request and wake any `noOpenRequests()` waiters when the
   * request map becomes empty.
   *
   * @param {string} eventId
   */
  _closeOpenRequest(eventId) {
    delete this.openRequest[eventId];
    if (Object.keys(this.openRequest).length === 0) {
      this._onNoOpenRequests.forEach((x) => x());
      this._onNoOpenRequests = [];
    }
  }

  /**
   * Establish the raw websocket connection for this queryset.
   *
   * @returns {Promise<void>}
   */
  _connectToServer() {
    return new Promise((resolve) => {
      const modelIdentifier =
        `${this.modelName}` + (this.modelId > 0 ? `/${this.modelId}` : "");
      if (window.location.protocol === "https:") {
        this.socket = new WebSocket(
          `wss://${window.location.host}/sdc_ws/model/${modelIdentifier}`,
        );
      } else {
        this.socket = new WebSocket(
          `ws://${window.location.host}/sdc_ws/model/${modelIdentifier}`,
        );
      }

      this.socket.onmessage = this._onMessage.bind(this);

      this.socket.onclose = (e) => {
        console.error(
          `SDC Model (${this.modelName}, ${this.modelId}) Socket closed unexpectedly`,
        );
        this._isConnected = false;
        for (const [_key, value] of Object.entries(this.openRequest)) {
          value[1](e);
        }
        this.openRequest = {};

        setTimeout(() => {
          if (this._autoReconnect) {
            this._connectToServer().then(() => {
            });
          }
        }, 1000);
      };

      this.socket.onerror = (err) => {
        console.error(`Model Socket encountered error: ${err} Closing socket`);
        if (this._isConnected) {
          try {
            this.socket.close();
          } catch (e) {
          }
        }
      };

      this.socket.onopen = () => {
        resolve();
      };
    });
  }

  /**
   * Perform the application-level connect handshake once the websocket opens.
   *
   * @returns {Promise<*>}
   */
  _checkConnection() {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      this.socket.send(
        JSON.stringify({
          event: "model",
          event_type: "connect",
          event_id: id,
          args: {
            model_name: this.modelName,
            model_query: this.modelQuery,
          },
        }),
      );

      this.openRequest[id] = [resolve, reject];
    });
  }

  /**
   * Convert the backend model payload into locally tracked model objects.
   *
   * @param {Array<object>} results
   */
  _parseServerRes(results) {
    const newModels = []
    for (const x of results) {
      const newModel = new (getModel(this.modelName))(x);
      const currentModel = this.byId(newModel.id);
      if (currentModel) {
        currentModel.setValues(newModel);
        newModels.push(currentModel);
      } else {
        this.valuesList.push(newModel);
        newModel._setQuerySet(this, true);
        newModels.push(newModel);
      }
    }

    return newModels;
  }
}

export default class SdcModel {
  static fields = {};

  /**
   * Base model wrapper used by SDC model registrations.
   *
   * @param {string} modelName
   */
  constructor(modelName) {
    this._id = null;
    this._isloaded = false;
    this.formId = uuidv4();
    this.modelName = modelName;
  }

  setValues(data = {}) {
    throw new Error("setValues() must be implemented by subclass");
  }

  /**
   * Attach the queryset that owns this model instance.
   *
   * @param {SdcQuerySet} querySet
   * @param {boolean} isLoaded
   */
  _setQuerySet(querySet, isLoaded) {
    this._querySet = querySet;
    this._isloaded = isLoaded;
  }

  save({formName = "edit_form", data = null}) {
    return this._querySet.save({pk: this.id, formName, data});
  }

  create({data = null}) {
    return this._querySet.create({elem: this, data});
  }

  delete() {

  }

  get id() {
    return this._id;
  }

  set pk(data) {
    this._id = data;
  }

  get pk() {
    return this._id;
  }

  /**
   * Request the server-rendered detail view for this model instance.
   *
   * @param {object} options
   * @returns {*}
   */
  detailView({cbResolve = null, cbReject = null, templateContext = {}}) {
    return this._querySet.detailView({pk: this.id, cbResolve, cbReject, templateContext});
  }

  serialize() {
    return Object.entries(this.constructor.fields).reduce((acc, [key, val]) => {
      const value = this[key];
      if (value instanceof SdcQuerySet) {
        if (val.many_to_many || val.one_to_many) {
          acc[key] = value.getIds();
        } else {
          const allIds = value.getIds();
          if (allIds.length > 0) {
            acc[key] = allIds[0];
          } else {
            acc[key] = null;
          }

        }
      } else {
        acc[key] = value;
      }

      return acc
    }, {});
  }

  /**
   * Backwards-compatible alias for syncing values from a form into the model.
   *
   * @param {*} $forms
   * @returns {*}
   */
  syncFormToModel($forms) {
    return this.syncForm($forms);
  }

  /**
   * Resolve the form collection associated with this model instance.
   *
   * @param {*} $forms
   * @returns {*}
   */
  _resolveForms($forms) {
    if (!$forms || !$forms.hasClass(this.formId)) {
      return $(`.${this.formId}`);
    }

    return $forms;
  }

  /**
   * Copy the current model state into matching form fields.
   *
   * @param {*} $forms
   */
  syncModelToForm($forms) {
    $forms = this._resolveForms($forms);

    const self = this;
    const fields = this.constructor.fields;
    $forms.each(function () {
      const pk = normalizePk($(this).data("model_pk"));
      if (self.id !== pk) {
        return;
      }

      for (let formItem of this.elements) {
        let name = formItem.name;

        if (name && name !== "" && !!fields[name]) {
          if (formItem.type === "checkbox") {
            formItem.checked = self[name];
          } else if (formItem.type === "file") {
            if (self[name] instanceof File) {
              let container = new DataTransfer();
              container.items.add(self[name]);
              formItem.files = container;
            }
          } else {
            $(formItem).val(self[name]);
          }
        }
      }
    });
  }

  /**
   * Copy matching form values back onto the current model instance.
   *
   * Hidden inputs are parsed to their original primitive type when possible.
   *
   * @param {*} $forms
   * @returns {*}
   */
  syncForm($forms) {
    $forms = this._resolveForms($forms);

    const self = this;
    const fields = this.constructor.fields;
    const returnValue = {}
    function setValueInForm(name, value) {
      if (!!fields[name]) {
        self[name] = value;
      }
      returnValue[name] = value;
    }

    $forms.each(function () {
      const pk = normalizePk($(this).data("model_pk"));
      if (self.id !== pk && (self.id !== null || pk !== -1)) {
        return;
      }

      for (let formItem of this.elements) {
        let name = formItem.name;
        if (name && name !== "") {
          if (formItem.type === "hidden") {
            setValueInForm(name, parseHiddenInputs($(formItem).val()));
          } else if (formItem.type === "checkbox") {
            setValueInForm(name, formItem.checked);
          } else if (formItem.type === "file") {
            setValueInForm(name, formItem.files[0]);
          } else {
            setValueInForm(name, $(formItem).val());
          }
        }
      }

      return self;
    });

    return returnValue;
  }

  /**
   * Render the correct server-side form for this model state.
   *
   * @param {object} options
   * @returns {*}
   */
  form({cbResolve = null, cbReject = null}) {
    if (this.id === null || this.id === -1) {
      return this._createForm({cbReject, cbResolve});
    }
    return this._editForm({cbReject, cbResolve});
  }

  /**
   * Render the create form for a new model instance.
   *
   * @param {object} options
   * @returns {*}
   */
  _createForm({cbResolve = null, cbReject = null}) {
    let $divForm = $("<div>");
    this._querySet.getForm({
      modelObj: this,
      eventType: "create_form",
      formName: null,
      $divForm,
      cbResolve,
      cbReject,
      formId: this.formId,
    });

    return $divForm;
  }

  /**
   * Render the edit form for an existing model instance.
   *
   * @param {object} options
   * @returns {*}
   */
  _editForm({cbResolve = null, cbReject = null}) {
    let $divForm = $("<div>");

    this._querySet.getForm({
      modelObj: this,
      eventType: "edit_form",
      formName: null,
      $divForm,
      cbResolve,
      cbReject,
      formId: this.formId,
    });

    return $divForm;
  }

  /**
   * Render a named server-side form for this model.
   *
   * @param {object} options
   * @returns {*}
   */
  namedForm({formName, cbResolve = null, cbReject = null}) {
    let $divForm = $('<div  class="container-fluid">');

    this._querySet.getForm({
      modelObj: this,
      eventType: "named_form",
      formName,
      $divForm,
      cbResolve,
      cbReject,
      formId: this.formId,
    });

    return $divForm;
  }

  /**
   * Validate a field value using the supplied field config.
   *
   * @param {*} value
   * @param {object} config
   */
  validate(value, config) {
    const err = validateField(value, config);
    if (err) throw new Error(err);
  }

  /**
   * Convert a raw input value into the shape expected by the field config.
   *
   * @param {*} value
   * @param {object} config
   * @returns {*}
   */
  parseValue(value, config) {
    const {
      type
    } = config;

    switch (type) {
      case "CharField":
      case "TextField":
      case "UUIDField":
      case "EmailField":
        return `${value}`;

      case "IntegerField":
      case "AutoField":
      case "BigIntegerField":
        return parseInt(value, 10);

      case "FloatField":
      case "DecimalField":
        if (typeof value !== "number") {
          return "Must be a number";
        }
        break;

      case "BooleanField":
        return !!value;

      case "DateField":
      case "DateTimeField":
        return Date.parse(value);

      case "URLField":
        return new URL(value);

      case "FileField":
        if (value == null) {
          return null;
        }

        if (typeof value === "string") {
          return null;
        }

        if (typeof File !== "undefined" && value instanceof File) {
          if (config.max_size && value.size > config.max_size) {
            return `File too large (max ${config.max_size} bytes)`;
          }

          if (config.allowed_types && !config.allowed_types.includes(value.type)) {
            return `Invalid file type (${value.type})`;
          }

          return null;
        }
        break;

      case "JSONField":
        if (typeof value === "object") {
          return value;
        }
        if (typeof value === "string") {
          return JSON.parse(value);
        }
        break;

      default:
        break;
    }

    return value;
  }
}

/**
 * Validate a field value against the field metadata received from the backend.
 *
 * @param {*} value
 * @param {object} config
 * @returns {?string}
 */
function validateField(value, config) {
  const {
    type,
    required,
    max_length: maxLength,
    is_relation: isRelation,
    many_to_many: manyToMany,
    one_to_many: oneToMany,
    many_to_one: manyToOne,
    one_to_one: oneToOne,
    related_model: relatedModel,
  } = config;

  void isRelation;

  if (required) {
    if (value === null || value === undefined || value === "") {
      return "This field is required";
    }
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (manyToMany || oneToMany || manyToOne || oneToOne) {
    if (!value instanceof SdcQuerySet || value.modelName !== relatedModel) {
      if (typeof value !== "object" && typeof value !== "number") {
        return "Must be object or ID";
      }
      return null;
    }
  }

  switch (type) {
    case "CharField":
    case "TextField":
      if (typeof value !== "string") {
        return "Must be a string";
      }
      if (maxLength && value.length > maxLength) {
        return `Max length is ${maxLength}`;
      }
      break;

    case "IntegerField":
    case "AutoField":
    case "BigIntegerField":
      if (!Number.isInteger(value)) {
        return "Must be an integer";
      }
      break;

    case "FloatField":
    case "DecimalField":
      if (typeof value !== "number") {
        return "Must be a number";
      }
      break;

    case "BooleanField":
      if (typeof value !== "boolean") {
        return "Must be a boolean";
      }
      break;

    case "DateField":
    case "DateTimeField":
      if (isNaN(Date.parse(value))) {
        return "Must be a valid date";
      }
      break;

    case "EmailField":
      if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Invalid email";
      }
      break;

    case "URLField":
      try {
        new URL(value);
      } catch {
        return "Invalid URL";
      }
      break;

    case "UUIDField":
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) {
        return "Invalid UUID";
      }
      break;

    case "JSONField":
      if (typeof value !== "object") {
        return "Must be JSON object";
      }
      break;

    default:
      break;
  }

  return null;
}

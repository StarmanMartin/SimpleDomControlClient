import {getValueFromField, setValueInField, uuidv4} from "./sdc_utils.js";
import {getModel} from "./sdc_socket.js"
import {app} from "./sdc_main.js";
import {trigger} from "./sdc_events.js";

const MAX_FILE_UPLOAD = 25000;
const CONNECTING_REQUEST_ID = "_connecting_process";

class SdcModelError extends Error {
  constructor(props) {
    if (typeof props === 'string') {
      props = {
        msg: props,
        is_error: true,
        header: 'Error'
      }
    }
    super(props.msg)
    this.msg = props.msg;
    this.header = props.header;
    this.is_error = props.is_error;
  }
}

class FileLoaded {
  constructor({name, url}) {
    this.name = name;
    this.url = url;
    this.content = null;
  }

  async load(force = false) {
    if (force || !this.content) {
      this.content = await new Promise((resolve, reject) => {
        $.get(this.url).then(resolve).catch(
          () => {
            resolve('');
          }
        );
      });
    }

    return this.content;
  }

  async text() {
    return this.load();
  }

  static isValid(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof File) &&
      typeof value.url === "string" &&
      typeof value.name === "string"
    );
  }


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
        if (typeof prop !== "symbol" && !isNaN(prop)) {
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

  set on_create(handler) {
    this.onCreate = handler;
  }

  set on_update(handler) {
    this.onUpdate = handler;
  }

  /**
   *
   *
   * @param {Array<integr|string>|integer|SdcModel|SdcQuerySet|string} ids
   */
  setIds(ids) {

    if (ids === null || Array.isArray(ids) && ids.length === 0) {
      this.valuesList = [];
      return this.valuesList;
    } else if (ids instanceof SdcQuerySet) {
      this.valuesList = structuredClone(ids.valuesList);
      this.valuesList.forEach(value => value._setQuerySet(this, true));
      return this.valuesList;
    } else if (ids instanceof SdcModel) {
      this.valuesList = [structuredClone(ids)];
      this.valuesList.forEach(value => value._setQuerySet(this, true));
      return this.valuesList;
    }

    let numList, numId = Number.NaN;
    if (Number.isInteger(ids)) {
      numId = ids;
    } else if (ids instanceof Array) {
      const tempNumList = ids.map((x) => parseInt(x));
      if (!tempNumList.some(Number.isNaN)) {
        numList = tempNumList;
      }
    } else if (ids instanceof String) {
      const tempNumList = ids.split(',').map((x) => parseInt(x));
      if (!tempNumList.some(Number.isNaN)) {
        numList = tempNumList
      } else {
        numId = parseInt(ids);
      }
    }

    if (!Number.isNaN(numId)) {
      const newModel = this.new();
      newModel.id = numId;
    } else if (numList) {
      this.valuesList = this.valuesList.filter((item) => numList.includes(item.id));
      const valueIds = this.getIds();
      numList.filter(x => !valueIds.includes(x)).forEach((id) => {
        this.valuesList.push(new (getModel(this.modelName))({id}));
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
   * @param {?object} values
   * @returns {SdcModel}
   */
  new(values = {}) {
    const newModel = new (getModel(this.modelName))(values);
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
  load(modelQuery = null) {
    this.valuesList = [];
    this.modelQuery = modelQuery ?? this.modelQuery;
    return this._sendLoad();
  }

  /**
   * Load model instances matching the current query into the queryset cache.
   *
   * @param {?object} modelQuery
   * @param {?SdcModel} item
   * @returns {Promise<SdcQuerySet>}
   */
  update({modelQuery = null, item = null}) {
    this.modelQuery = modelQuery ?? this.modelQuery;
    let loadQuery = item ? {pk: item.id} : this.modelQuery;
    return this._sendLoad(loadQuery);
  }

  /**
   *
   * @param pk {integr}
   * @param elem {SdcModel}
   * @returns {Promise<unknown>}
   */
  delete({pk = null, elem = null}) {
    pk = !elem ? pk : elem.id;
    if (pk === null) {
      throw new Error("pk or elem must be set");
    }
    const id = uuidv4();
    return this.isConnected().then(() => {
      return new Promise((resolve, reject) => {
        this.socket.send(
          JSON.stringify({
            event: "model",
            event_type: "delete",
            event_id: id,
            args: {
              model_name: this.modelName,
              model_query: this.modelQuery,
              pk,
            },
          }),
        );

        this.openRequest[id] = [resolve, reject];
      });
    });
  }

  /**
   * Request the server-side queryset data over the model websocket.
   *
   * @returns {Promise<*>}
   */
  _sendLoad(loadQuery = null) {
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
              model_query: loadQuery ?? this.modelQuery,
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
   * @param {string} eventType
   * @param {SdcModel} modelObj
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
        modelObj.addForm($form);
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
   * @param {?boolean} doNotLoad true if modelQuery contains id or pk and object does not need to be loaded.
   * @returns {Promise<SdcModel>}
   */
  async get(modelQuery = null, doNotLoad = false) {
    if (doNotLoad) {
      const id = modelQuery?.id ?? modelQuery?.pk;
      return this.byId(id) ?? this.new(modelQuery || this.modelQuery);
    }
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

  save({pk = null, formName = "edit_form", data = null} = {}) {
    const normPk = normalizePk(pk);
    return this.isConnected().then(() => {
      let elemList;
      if (normPk > -1) {
        const elem = this.byId(normPk);
        if (!elem) {
          return Promise.reject(new SdcModelError(`Element not found with ID: ${normPk}`));
        }
        elemList = [elem];
      } else {
        elemList = this.valuesList;
      }
      let pList = [];
      elemList.forEach((elem) => {
        const id = uuidv4();
        pList.push(
          new Promise((resolve, reject) => {
            this._readFiles(elem).then((files) => {
              const sendData = data ? {...data} : elem.serialize();
              sendData.pk = elem.id;
              this.socket.send(
                JSON.stringify({
                  event: "model",
                  event_type: "save",
                  event_id: id,
                  args: {
                    form_name: formName,
                    model_name: this.modelName,
                    model_query: this.modelQuery,
                    data: sendData,
                    pk: sendData.pk,
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
   * @param elem {?SdcModel}
   * @param data {?object}
   * @returns {Promise<unknown>}
   */
  create({elem = null, data = null} = {}) {
    const id = uuidv4();
    if (!elem) {
      elem = this.new(data);
    }
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
                data: elem?.serialize() ?? {},
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
              if (elem) {
                elem.id = data[0]?.pk || data[0]?.id;
              }
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

    this.valuesList.forEach((elem) => {
      elem._onClose()
    });
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
    if (!elem) {
      return Promise.resolve(files);
    }
    Object.keys(elem.constructor.fields).forEach((key) => {
      const value = elem[key];
      if (value instanceof File) {
        toSolve.push(
          new Promise(async (resolve, reject) => {
            const id = uuidv4();
            this.openRequest[id] = [resolve, reject];

            const buffer = await value.arrayBuffer();
            let result = new Uint8Array(buffer);
            let numberOfChunks = Math.ceil(result.length / MAX_FILE_UPLOAD);
            files[key] = {
              id: id,
              file_name: value.name,
              field_name: key,
              content_length: value.size,
            };
            for (let i = 0; i < numberOfChunks; ++i) {
              const chunk = Array.from(result.slice(
                MAX_FILE_UPLOAD * i,
                MAX_FILE_UPLOAD * (i + 1),
              ));
              this.socket.send(
                JSON.stringify({
                  event: "model",
                  event_type: "upload",
                  event_id: id,
                  args: {
                    chunk,
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
        this.openRequest[data.event_id][1](new SdcModelError(data));
        this._closeOpenRequest(data.event_id);
      }
      if (data.msg || data.header) {
        trigger("pushErrorMsg", data.header || "", data.msg || "");
      }

      if (data.type === "connect") {
        this.openRequest[CONNECTING_REQUEST_ID][1](new SdcModelError(data));
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
      const ModelClass = getModel(this.modelName);
      const newModel = new ModelClass({'id': x.pk ?? x.id, ...x.fields});
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
    this.valuesList.sort((a, b) => a._id - b._id);
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
    this._forms = [];
    this._isloaded = false;
    this.formId = uuidv4();
    this.modelName = modelName;
  }

  /**
   *
   * @param {object?} modelQuerySet
   * @param {AbstractSDC} parent
   * @returns {SdcQuerySet}
   */
  static querySet(modelQuerySet = null, parent = null) {
    if (!parent) {
      return new SdcQuerySet(this.modeName, modelQuerySet);
    }

    return parent.querySet(this.modeName, modelQuerySet);
  }

  addForm($form) {
    // Remove old listeners if form already set
    const onChange = this._onChange.bind(this);

    this._forms.push($form);

    if ($form) {
      // Attach delegated event handler to all inputs
      $form.on(
        "input.formWatcher change.formWatcher",
        "input, select, textarea",
        onChange
      );
    }
  }

  _onChange(event) {
    const {name} = event.target;
    if (this.constructor.fields[name]) {
      this[`set${name}`](getValueFromField(event.target));
    }
  }

  _updateForm(fieldName) {
    const self = this;
    this._forms.forEach(($form) => {
      $form.find(`[name="${fieldName}"]`).each(function () {
        setValueInField(this, self[fieldName])
      });
    });
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
    this._querySet = new WeakRef(querySet);
    this._isloaded = isLoaded;
  }

  save({formName = "edit_form", data = null} = {}) {
    return this._querySet.deref().save({pk: this.id, formName, data});
  }

  create({data = null} = {}) {
    return this._querySet.deref().create({elem: this, data});
  }

  delete() {
    return this._querySet.deref().delete({elem: this});
  }

  load() {
    return this._querySet.deref().update({item: this});
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

  close() {
    return this._querySet.deref().close();
  }

  _onClose() {
    Object.keys(this.constructor.fields)
      .filter((x) => this[`_${x}`] instanceof SdcQuerySet)
      .forEach((x) => this[`_${x}`].close());
  }

  /**
   * Request the server-rendered detail view for this model instance.
   *
   * @param {object} options
   * @returns {*}
   */
  detailView({cbResolve = null, cbReject = null, templateContext = {}}) {
    return this._querySet.deref().detailView({pk: this.id, cbResolve, cbReject, templateContext});
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
      } else if (val.is_relation && value instanceof SdcModel) {
        acc[key] = value.id ?? null;
      } else {
        acc[key] = value;
      }

      return acc
    }, {});
  }

  toJson() {
    const res = {}
    for (let key in this.constructor.fields) {
      const value = this[key];

      if (value instanceof File) {
        res[key] = value.name;
      } else if (value instanceof SdcModel) {
        res[key] = value.id;
      } else if (value instanceof SdcQuerySet) {
        res[key] = value.getIds();
      } else {
        res[key] = value;
      }
    }

    return res;
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
          setValueInField(formItem, self[name])
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
        setValueInForm(formItem.name, getValueFromField(formItem));
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
    this._querySet.deref().getForm({
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

    this._querySet.deref().getForm({
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

    this._querySet.deref().getForm({
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
      case "TeextField":
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

        if (FileLoaded.isValid(value)) {
          return new FileLoaded(value);
        }

        if (value instanceof FileLoaded) {
          return new FileLoaded(value);
        }

        if (typeof File !== "undefined" && value instanceof File) {
          if (config.max_size && value.size > config.max_size) {
            return `File too large (max ${config.max_size} bytes)`;
          }

          if (config.allowed_types && !config.allowed_types.includes(value.type)) {
            return `Invalid file type (${value.type})`;
          }

          return value;
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
    if (!(value instanceof SdcQuerySet) || value.modelName !== relatedModel) {
      if (typeof value !== "object" && Number.isNaN(parseInt(value))) {
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
    case "FileField":
      if (!FileLoaded.isValid(value) && !(value instanceof File) && !(value instanceof FileLoaded)) {
        return "Must be a valid file";
      }
      break;
    default:
      break;
  }

  return null;
}

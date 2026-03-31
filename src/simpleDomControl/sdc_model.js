import {uuidv4} from "./sdc_utils.js";
import {getModel} from "./sdc_socket.js"
import {app} from "./sdc_main.js";
import {trigger} from "./sdc_events.js";

const MAX_FILE_UPLOAD = 25000;

function parse_hidden_inputs(value) {
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
    return parseInt(value);
  } else if (value.match(isFloatReg)) {
    return parseFloat(value);
  } else if (value.match(isStringReg)) {
    return value.substring(1, value.length - 1);
  }
  return value;
}

export class SdcQuerySet {
  /**
   *
   * @param modelName {string}
   * @param modelQuery {json}
   */
  constructor(modelName, modelQuery = {}) {
    this.values_list = [];
    this.loaded = false;
    this.modelName = modelName;
    this.modelQuery = modelQuery ?? {};
    this._onNoOpenRequests = [];
    this.values_list = [];
    this._is_connected = false;
    this._is_conneting_process = false;
    this._auto_reconnect = true;
    this.socket = null;
    this.open_request = {};
    this.modelId = 0;
    this.on_update = () => {
    };
    this.on_create = () => {
    };

    return new Proxy(this, {
      get(target, prop) {
        if (!isNaN(prop)) {
          return target.values_list[prop];
        }
        return target[prop];
      },

      set(target, prop, value) {
        if (!isNaN(prop)) {
          target.values_list[prop] = value;
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
        if (idx < this.values_list.length) {
          return {value: this.values_list[idx], done: false};
        }
        return {value: null, done: true};
      },
    };
  }


  get length() {
    return this.values_list.length;
  }

  async byId(id) {
    if (!this.loaded) {
      await this.load();
    }
    if (id !== null) {
      id = parseInt(id);
      if (isNaN(id)) {
        id = -1;
      }
      return this.values_list.find((elm) => elm.id === id);
    }

    return null;
  }

  filter(modelQuery) {
    this.modelQuery = Object.assign({}, this.modelQuery, modelQuery);
    return this;
  }

  /**
   *
   * @returns {SdcModel}
   */
  new() {
    const newModel = new (getModel(this.modelName))();
    newModel._setQuerySet(this, false);
    return newModel;
  }


  async load(modelQuery = null) {
    this.modelQuery = modelQuery ?? this.modelQuery;
    const result = await this._sendLoad();
    this.values_list = result.map((x) => new (getModel(this.modelName)(x)));
    this.values_list.forEach((x) => x._setQuerySet(this, true));
    return this;
  }

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

        this.open_request[id] = [resolve, reject];
      });
    });
  }


  _sendListView(
    {
      model_query = {},
      cbResolve = null,
      cbReject = null,
      templateContext = {},
    }
  ) {
    return this.view({
      model_query,
      cbResolve,
      cbReject,
      templateContext,
      event_type: "list_view",
    });
  }

  view({
         viewName = "html_list_template",
         model_query = {},
         cbResolve = null,
         cbReject = null,
         templateContext = {},
         event_type = "named_view",
       }) {
    let $div_list = $('<div class="container-fluid">');
    this.isConnected().then(() => {
      const id = uuidv4();
      this.socket.send(
        JSON.stringify({
          event: "model",
          event_type,
          event_id: id,
          args: {
            view_name: viewName,
            model_name: this.modelName,
            model_query,
            template_context: templateContext,
          },
        }),
      );

      this.open_request[id] = [
        (data) => {
          $div_list.append(data.html);
          app.refresh($div_list);
          cbResolve && cbResolve(data);
        },
        (res) => {
          cbReject && cbReject(res);
        },
      ];
    });

    return $div_list;
  }

  _sendDetailView({
                    pk = null,
                    cb_resolve = null,
                    cb_reject = null,
                    template_context = {},
                  }
  ) {
    pk = pk ?? -1;
    pk = parseInt(pk);
    if (isNaN(pk)) {
      pk = -1;
    }
    let $div_list = $('<div class="container-fluid">');

    this.isConnected().then(() => {
      if (pk === -1) {
        pk = this.values_list[0].pk;
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
            template_context,
          },
        }),
      );

      this.open_request[id] = [
        (data) => {
          $div_list.append(data.html);
          app.refresh($div_list);
          cb_resolve && cb_resolve(data);
        },
        (res) => {
          cb_reject && cb_reject(res);
        },
      ];
    });

    return $div_list;
  }

  getForm({modelObj, event_type, formName, $div_form, cb_resolve, cb_reject, formId}) {
    const id = uuidv4();
    const pk = modelObj.id ?? -1;
    this.isConnected().then(() => {
      this.socket.send(
        JSON.stringify({
          event: "model",
          event_type,
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

    this.open_request[id] = [
      (data) => {
        $div_form.append(data.html);
        let $form = $div_form
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

        app.refresh($div_form).then(r => null);
        cb_resolve && cb_resolve(data);
      },
      (res) => {
        cb_reject && cb_reject(res);
      },
    ];
  }

  /**
   *
   * @param modelQuery {object}
   * @returns {Promise<SdcModel>}
   */
  async get(modelQuery = null) {
    await this.load(modelQuery);
    if (this.length !== 1) {
      throw new Error(`model query returns ${this.length} but only 1 expected.`);
    }

    return this.values_list[0];
  }

  detailView({pk, cb_resolve = null, cb_reject = null, template_context = {}}) {
    return this._sendDetailView(
      {

        pk,
        cb_resolve,
        cb_reject,
        template_context,
      });
  }

  listView({model_query = {}, cb_resolve = null, cb_reject = null, template_context = {}}) {
    return this._sendListView(
      {
        model_query: Object.assign({}, this.modelQuery, model_query),
        cb_resolve,
        cb_reject,
        template_context,
      });
  }

  isConnected() {
    return new Promise((resolve, reject) => {
      if (this._is_connected) {
        resolve();
      } else if (
        !this._is_conneting_process ||
        !this.open_request["_connecting_process"]
      ) {
        this._is_conneting_process = true;
        this.open_request["_connecting_process"] = [() => {
        }, () => {
        }];
        this._connectToServer().then(() => {
          resolve(this._checkConnection());
        });
      } else {
        const [resolve_origin, reject_origin] =
          this.open_request["_connecting_process"];
        this.open_request["_connecting_process"] = [
          () => {
            resolve_origin();
            resolve();
          },
          () => {
            reject_origin();
            reject();
          },
        ];
      }
    });
  }

  close() {
    if (this.socket) {
      this._auto_reconnect = false;
      this.socket.onclose = () => {
      };
      this.socket.close();
      delete this["socket"];
    }
  }

  clean() {
    this.values_list = [];
    return this;
  }


  _readFiles(elem) {
    let to_solve = [];
    let files = {};
    for (const [key, value] of Object.entries(elem)) {
      if (value instanceof File) {
        to_solve.push(
          new Promise((resolve, reject) => {
            ((key, value) => {
              let reader = new FileReader();
              reader.onload = (e) => {
                const id = uuidv4();
                this.open_request[id] = [resolve, reject];

                let result = e.target.result;
                let number_of_chunks = parseInt(
                  Math.ceil(result.length / MAX_FILE_UPLOAD),
                );
                files[key] = {
                  id: id,
                  file_name: value.name,
                  field_name: key,
                  content_length: value.size,
                };
                for (let i = 0; i < number_of_chunks; ++i) {
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
                        number_of_chunks: number_of_chunks,
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
              };
              reader.onerror = () => {
                reject();
              };
              reader.readAsBinaryString(value);
            })(key, value);
          }),
        );
      }
    }

    return Promise.all(to_solve).then(() => {
      return files;
    });
  }

  _onMessage(e) {
    let data = JSON.parse(e.data);
    if (data.is_error) {
      if (this.open_request.hasOwnProperty(data.event_id)) {
        this.open_request[data.event_id][1](data);
        this._closeOpenRequest(data.event_id);
      }
      if (data.msg || data.header) {
        trigger("pushErrorMsg", data.header || "", data.msg || "");
      }

      if (data.type === "connect") {
        this.open_request["_connecting_process"][1](data);
        this._closeOpenRequest("_connecting_process");
        this._auto_reconnect = false;
        this.socket.close();
      }
    } else {
      if (data.msg || data.header) {
        trigger("pushMsg", data.header || "", data.msg || "");
      }

      if (data.type === "connect") {
        this._is_connected = true;
        this._is_conneting_process = false;
        this.open_request["_connecting_process"][0](data);
        this._closeOpenRequest("_connecting_process");
      } else if (["load", "named_view", "detail_view"].includes(data.type)) {
        const json_res = JSON.parse(data.args.data);
        this.values_list = [];
        data.args.data = this._parseServerRes(json_res);
      } else if (data.type === "on_update" || data.type === "on_create") {
        const json_res = JSON.parse(data.args.data);

        let obj = this._parseServerRes(json_res);
        let cb;

        if (data.type === "on_create") {
          cb = this.on_create;
        } else {
          cb = this.on_update;
        }

        cb(obj);
        data.args.data = obj;
      }

      let instance = data.data?.instance;
      if (instance) {
        data.data.instance = JSON.parse(data.data.instance);
      }

      if (this.open_request.hasOwnProperty(data.event_id)) {
        this.open_request[data.event_id][0](data);
        this._closeOpenRequest(data.event_id);
      }
    }
  }

  noOpenRequests() {
    return new Promise((resolve) => {
      if (Object.keys(this.open_request).length === 0) {
        return resolve();
      }

      this._onNoOpenRequests.push(resolve);
    });
  }

  _closeOpenRequest(event_id) {
    delete this.open_request[event_id];
    if (Object.keys(this.open_request).length === 0) {
      this._onNoOpenRequests.forEach((x) => x());
      this._onNoOpenRequests = [];
    }
  }

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
        this._is_connected = false;
        for (const [_key, value] of Object.entries(this.open_request)) {
          value[1](e);
        }
        this.open_request = {};

        setTimeout(() => {
          if (this._auto_reconnect) {
            this._connectToServer().then(() => {
            });
          }
        }, 1000);
      };

      this.socket.onerror = (err) => {
        console.error(`Model Socket encountered error: ${err} Closing socket`);
        if (this._is_connected) {
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

      this.open_request[id] = [resolve, reject];
    });
  }

  _parseServerRes(res) {
    let updated = [];
    for (let json_data of res) {
      const pk = json_data.pk;
      const obj = this.byId(pk);
      for (const [k, v] of Object.entries(json_data.fields)) {
        if (v && typeof v === "object" && v["__is_sdc_model__"]) {
          obj[k] = new SubModel(v["pk"], v["model"]);
        } else {
          obj[k] = v;
        }
      }

      updated.push(obj);
    }

    if (this.values_list.length === 1) {
      this.values = this.values_list.at(-1);
    } else {
      this.values = {};
    }

    return updated;
  }

}

export default class SdcModel {
  constructor(modelName) {
    this._id = null;
    this._isloaded = false;
    this.formId = uuidv4();
    this.modelName = modelName;
  }

  _setQuerySet(querySet, isLoaded) {
    this._querySet = querySet;
    this._isloaded = isLoaded;
  }

  save() {

  }

  delete() {

  }

  get id() {
    return this._id;
  }

  detailView({cb_resolve = null, cb_reject = null, template_context = {}}) {
    return this._querySet.detailView({pk: this.id, cb_resolve, cb_reject, template_context});
  }

  syncFormToModel($forms) {
    return this.syncForm($forms);
  }

  syncModelToForm($forms) {
    if (!$forms || !$forms.hasClass(this.formId)) {
      $forms = $(`.${this.formId}`);
    }

    const self = this;
    $forms.each(function () {
      const pk = parseInt($(this).data("model_pk"));
      if (self.id !== pk) {
        return;
      }

      for (let form_item of this.elements) {
        let name = form_item.name;
        if (name && name !== "") {
          if (form_item.type === "checkbox") {
            form_item.checked = self[name];
          } else if (form_item.type === "file") {
            if (self[name] instanceof File) {
              let container = new DataTransfer();
              container.items.add(self[name]);
              form_item.files = container;
            }
          } else {
            $(form_item).val(self[name]);
          }
        }
      }
    });
  }

  syncForm($forms) {
    if (!$forms || !$forms.hasClass(this.formId)) {
      $forms = $(`.${this.formId}`);
    }

    const self = this;
    $forms.each(function () {
      const pk = parseInt($(this).data("model_pk"));
      if (self.id !== pk && (self.id !== null || pk !== -1)) {
        return;
      }

      for (let form_item of this.elements) {
        let name = form_item.name;
        if (name && name !== "") {
          if (form_item.type === "hidden") {
            self[name] = parse_hidden_inputs($(form_item).val());
          } else if (form_item.type === "checkbox") {
            self[name] = form_item.checked;
          } else if (form_item.type === "file") {
            self[name] = form_item.files[0];
          } else {
            self[name] = $(form_item).val();
          }
        }
      }

      return self;
    });
  }

  form({cb_resolve = null, cb_reject = null}) {
    if (this.id === null || this.id === -1) {
      return this._createForm({cb_reject, cb_resolve});
    }
    return this._editForm({cb_reject, cb_resolve});
  }

  _createForm({cb_resolve = null, cb_reject = null}) {
    let $div_form = $("<div>");
    this._querySet.getForm(
      {
        modelObj: this,
        event_type: "create_form",
        formName: null,
        $div_form,
        cb_resolve,
        cb_reject,
        formId: this.formId,
      }
    );

    return $div_form;
  }

  _editForm({cb_resolve = null, cb_reject = null}) {
    let $div_form = $("<div>");

    this._querySet.getForm(
      {
        modelObj: this,
        event_type: "edit_form",
        formName: null,
        $div_form,
        cb_resolve,
        cb_reject,
        formId: this.formId,
      });

    return $div_form;
  }

  namedForm({formName, cb_resolve = null, cb_reject = null}) {
    let $div_form = $('<div  class="container-fluid">');

    this._querySet.getForm(
      {
        modelObj: this,
        event_type: "named_form",
        formName,
        $div_form,
        cb_resolve,
        cb_reject,
        formId: this.formId,
      }
    );


    return $div_form;
  }


  validate(value, config) {
    const err = validateField(value, config);
    if (err) throw new Error(err);
  }

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
        return Date.parse(value)

      case "URLField":
        return new URL(value);
      case "FileField":
        // allow null if not required
        if (value == null) return null;

        // case 1: string (already uploaded file / API response)
        if (typeof value === "string") {
          return null; // assume valid
        }

        // case 2: browser File object
        if (typeof File !== "undefined" && value instanceof File) {
          if (config.max_size && value.size > config.max_size) {
            return `File too large (max ${config.max_size} bytes)`;
          }

          if (config.allowed_types && !config.allowed_types.includes(value.type)) {
            return `Invalid file type (${value.type})`;
          }

          return null;
        }

      case "JSONField":
        if (typeof value === "object") {
          return value;
        }
        if (typeof value === "string") {
          return JSON.parse(value);
        }
        break;

      default:
        // fallback: no strict validation
        break;
    }

    return value;

  }
}

function

validateField(value, config) {
  const {
    type,
    required,
    max_length,
    is_relation,
    many_to_many,
    one_to_many,
    many_to_one,
    one_to_one
  } = config;

  // REQUIRED
  if (required) {
    if (value === null || value === undefined || value === "") {
      return "This field is required";
    }
  }

  // skip further checks if empty
  if (value === null || value === undefined) {
    return null;
  }

  // RELATIONS
  if (many_to_many || one_to_many) {
    if (!Array.isArray(value)) {
      return "Must be an array";
    }
    return null;
  }

  if (many_to_one || one_to_one) {
    if (typeof value !== "object" && typeof value !== "number") {
      return "Must be object or ID";
    }
    return null;
  }

  // TYPE CHECKS
  switch (type) {
    case "CharField":
    case "TextField":
      if (typeof value !== "string") {
        return "Must be a string";
      }
      if (max_length && value.length > max_length) {
        return `Max length is ${max_length}`;
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
      // fallback: no strict validation
      break;
  }

  return null;
}
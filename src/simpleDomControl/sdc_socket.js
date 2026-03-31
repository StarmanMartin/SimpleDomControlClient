import {uuidv4} from "./sdc_utils.js";

const registeredModels = {};


class SubModel {
  constructor(pk, model) {
    this.pk = pk;
    this._model = model;
  }

  /**
   * SDC Model Name
   * @param {string} model
   */
  set model(model) {
    this._model = model;
  }

  get model() {
    return this._model;
  }

  /**
   * Load the sub model.
   *
   * @param {AbstractSDC} controller
   * @returns {Model}
   */
  load(controller) {
    if (!this._model) {
      throw new TypeError("Model is not set!!");
    }
    if (this.pk instanceof Array) {
      return controller.newModel(this._model, {pk__in: this.pk});
    }
    return controller.newModel(this._model, {pk: this.pk});
  }
}

const ModelProxyHandler = {
  get(target, key) {
    const value = target[key] ?? undefined;
    if (value instanceof SubModel) {
      if (!value.pk && value.pk !== 0) {
        return null;
      }
      let newVal;
      if (value.pk instanceof Array) {
        newVal = value.pk.slice();
      } else {
        newVal = new Number(value.pk);
      }
      newVal.load = value.load.bind(value);
      return newVal;
    }
    return value;
  },
  set(target, key, value) {
    if (key in target) {
      const oldVal = target[key];
      if (oldVal instanceof SubModel) {
        if (value.hasOwnProperty("pk")) {
          oldVal.pk = value.pk;
        } else {
          try {
            oldVal.pk = JSON.parse(value);
          } catch {
            oldVal.pk = value;
          }
        }
      } else {
        target[key] = value;
      }
    } else {
      target[key] = value;
    }
    return true;
  },
};


function registerModel(name, classObj) {
  registeredModels[name] = classObj;
}

function getModel(name) {
  return registeredModels[name];
}

class Model {

  constructor() {

    this.form_id = uuidv4();
  }

  save(pk = -1, fromName = "edit_form") {
    pk = parseInt(pk);
    if (isNaN(pk)) {
      pk = -1;
    }
    return this.isConnected().then(() => {
      let elem_list;
      if (pk > -1) {
        elem_list = [this.byPk(pk)];
      } else {
        elem_list = this.values_list;
      }
      let p_list = [];
      elem_list.forEach((elem) => {
        const id = uuidv4();
        p_list.push(
          new Promise((resolve, reject) => {
            this._readFiles(elem).then((files) => {
              this.socket.send(
                JSON.stringify({
                  event: "model",
                  event_type: "save",
                  event_id: id,
                  args: {
                    form_name: fromName,
                    model_name: this.model_name,
                    model_query: this.model_query,
                    data: elem,
                    files: files,
                  },
                }),
              );

              this.open_request[id] = [
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

      return Promise.all(p_list);
    });
  }

  create(values = this.values) {
    const id = uuidv4();
    return this.isConnected().then(() => {
      return new Promise((resolve, reject) => {
        this._readFiles(values).then((files) => {
          this.socket.send(
            JSON.stringify({
              event: "model",
              event_type: "create",
              event_id: id,
              args: {
                model_name: this.model_name,
                model_query: this.model_query,
                data: values,
                files: files,
              },
            }),
          );

          this.open_request[id] = [
            (res) => {
              let data =
                typeof res.data.instance === "string"
                  ? JSON.parse(res.data.instance)
                  : res.data.instance;
              if (this.values?.pk === -1) {
                this.values_list = [];
                this.values = null;
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

  delete(pk = -1) {
    pk = parseInt(pk);
    if (isNaN(pk)) {
      pk = -1;
    }
    if (pk === -1) pk = this.values?.pk;
    const id = uuidv4();
    return this.isConnected().then(() => {
      return new Promise((resolve, reject) => {
        this.socket.send(
          JSON.stringify({
            event: "model",
            event_type: "delete",
            event_id: id,
            args: {
              model_name: this.model_name,
              model_query: this.model_query,
              pk: pk,
            },
          }),
        );

        this.open_request[id] = [resolve, reject];
      });
    });
  }


}


export {
  registerModel,
  getModel,
  Model
}
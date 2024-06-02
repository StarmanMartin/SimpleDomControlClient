import {app} from './sdc_main.js';
import {trigger} from "./sdc_events.js";
import {uuidv4} from "./sdc_utils.js";

let IS_CONNECTED = false;
let IS_CONNECTING = false;
let SDC_SOCKET = null
const MAX_FILE_UPLOAD = 25000;
let OPEN_REQUESTS = {};


class SubModel {

    constructor(pk, model) {
        this._pk = pk;
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
     * SDC Model PK
     * @param {Number} pk
     */
    set pk(pk) {
        this._pk = pk;
    }

    get pk() {
        return this._pk;
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
        return controller.newModel(this._model, {pk: this._pk});
    }
}

const ModelProxyHandler = {
    get(target, key) {
        const value = target[key] ?? undefined;
        if (value instanceof SubModel) {
            const newVal = new Number(value.pk);
            newVal.load = value.load.bind(value);
            return newVal;
        }
        console.log(`We return Value ${value}`);
        return value;
    },
    set(target, key, value) {
        if (key in target) {
            const oldVal = target[key];
            if (oldVal instanceof SubModel) {
                oldVal.pk = value;
            } else {
                target[key] = value;
            }
        } else {
            target[key] = value;
        }
        return true;
    }
}

export function callServer(app, controller, funcName, args) {

    let id = uuidv4();
    isConnected().then(() => {
        SDC_SOCKET.send(JSON.stringify({
            event: 'sdc_call',
            id: id,
            controller: controller,
            app: app,
            function: funcName,
            args: args
        }));
    });

    return new Promise((resolve, reject) => {
        OPEN_REQUESTS[id] = [resolve, reject];
    });
}

function _connect() {
    IS_CONNECTING = true;
    return new Promise((resolve) => {
        if (window.location.protocol === "https:") {
            SDC_SOCKET = new WebSocket(`wss://${window.location.host}/sdc_ws/ws/`);
        } else {
            SDC_SOCKET = new WebSocket(`ws://${window.location.host}/sdc_ws/ws/`);
        }


        SDC_SOCKET.onmessage = function (e) {
            let data = JSON.parse(e.data);
            if (data.is_error) {
                if (data.msg || data.header) {
                    trigger('pushErrorMsg', data.header || '', data.msg || '');
                }
                if (OPEN_REQUESTS[data.id]) {
                    OPEN_REQUESTS[data.id][1](data.data || null);
                    delete OPEN_REQUESTS[data.id];
                }
            } else {
                if (data.msg || data.header) {
                    trigger('pushMsg', data.header || '', data.msg || '');
                }

                if (data.type && data.type === 'sdc_recall') {
                    if (OPEN_REQUESTS[data.id]) {
                        OPEN_REQUESTS[data.id][0](data.data);
                        delete OPEN_REQUESTS[data.id];
                    }
                } else if (data.type && data.type === 'sdc_event') {
                    let event = data.event;
                    if (event) {
                        trigger(event, data.payload);
                    }

                } else if (data.type && data.type === 'sdc_redirect') {
                    trigger('onNavLink', data.link);
                }
            }
        };

        SDC_SOCKET.onclose = function () {
            if (IS_CONNECTED) {
                console.error('SDC Socket closed unexpectedly');
            }
            IS_CONNECTED = false;
            for (const [key, value] of Object.entries(OPEN_REQUESTS)) {
                value[1]({});
                delete OPEN_REQUESTS[key];
            }

            setTimeout(() => {
                _connect();
            }, 1000);
        };

        SDC_SOCKET.onerror = function (err) {
            console.error('Socket encountered error: ', err.message, 'Closing socket');
            if (IS_CONNECTED) {
                try {
                    SDC_SOCKET.close();
                } catch (e) {

                }
            }
        };

        SDC_SOCKET.onopen = function () {
            IS_CONNECTED = true;
            IS_CONNECTING = false;
            resolve();
        }
    })
}

export function close() {
    if (IS_CONNECTED) {
        IS_CONNECTED = false;
        try {
            SDC_SOCKET.close();
        } catch (e) {

        }

    }
}

function parse_hidden_inputs(value) {

    let isFloatReg = /^-?\d+\.?\d+$/;
    let isIntReg = /^-?\d+$/;
    let isBoolReg = /^(true|false)$/;
    let isStringReg = /^(['][^']*['])|(["][^"]*["])$/;


    if (value.toLowerCase().match(isBoolReg)) {
        return value.toLowerCase() === 'true';
    } else if (value === 'undefined') {
        return undefined;
    } else if (value.toLowerCase() === 'none') {
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

export function isConnected() {

    return new Promise((resolve) => {
        if (IS_CONNECTED) {
            return resolve();
        } else if (IS_CONNECTING) {
            setTimeout(() => {
                isConnected().then(() => {
                    resolve();
                });
            }, 200);
        } else {
            return resolve(_connect());
        }
    });
}

export class Model {
    /**
     *
     * @param model_name {string}
     * @param model_query {json}
     */
    constructor(model_name, model_query = {}) {
        this.values_list = [];
        this.values = {};
        this.model_name = model_name;
        this.model_query = model_query;
        this._is_connected = false;
        this._is_conneting_process = false;
        this._auto_reconnect = true;
        this.socket = null;
        this.open_request = {};
        this.on_update = () => {
        };
        this.on_create = () => {
        };

        this.form_id = uuidv4();
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
            }
        };
    }

    length() {
        return this.values_list.length;
    }

    byPk(pk) {
        if (pk !== null) {
            let elem = this.values_list.find(elm => elm.pk === pk);
            if (!elem) {
                elem = new Proxy({pk: pk}, ModelProxyHandler);
                this.values_list.push(elem);
            }
            return elem;
        }
        return {pk: pk};

    }

    filter(model_query) {
        this.model_query = Object.assign({}, this.model_query, model_query);
        return this;
    }

    load() {
        return this.isConnected().then(() => {
            const id = uuidv4();
            return new Promise((resolve, reject) => {
                this.socket.send(JSON.stringify({
                    event: 'model',
                    event_type: 'load',
                    event_id: id,
                    args: {
                        model_name: this.model_name,
                        model_query: this.model_query
                    }
                }));

                this.open_request[id] = [resolve, reject];
            });
        });
    }

    listView(filter = {}, cb_resolve = null, cb_reject = null) {
        let $div_list = $('<div class="container-fluid">');
        this.isConnected().then(() => {
            const id = uuidv4();
            this.socket.send(JSON.stringify({
                event: 'model',
                event_type: 'list_view',
                event_id: id,
                args: {
                    model_name: this.model_name,
                    model_query: this.model_query,
                    filter: filter
                }
            }));

            this.open_request[id] = [(data) => {
                $div_list.append(data.html);
                app.refresh($div_list);
                cb_resolve && cb_resolve(data);
            }, (res) => {
                cb_reject && cb_reject(res);
            }];

        });

        return $div_list;
    }

    detailView(pk = -1, cb_resolve = null, cb_reject = null) {
        let $div_list = $('<div class="container-fluid">');

        let load_promise;
        if (this.values_list.length !== 0) {
            load_promise = this.isConnected();
        } else {
            load_promise = this.load();
        }

        load_promise.then(() => {
            if (pk === -1) {
                pk = this.values_list[0].pk
            }
            const id = uuidv4();
            this.socket.send(JSON.stringify({
                event: 'model',
                event_type: 'detail_view',
                event_id: id,
                args: {
                    model_name: this.model_name,
                    model_query: this.model_query,
                    pk: pk
                }
            }));

            this.open_request[id] = [(data) => {
                $div_list.append(data.html);
                app.refresh($div_list);
                cb_resolve && cb_resolve(data);
            }, (res) => {
                cb_reject && cb_reject(res);
            }];

        });

        return $div_list;
    }

    syncFormToModel($forms) {
        return this.syncForm($forms);
    }

    syncModelToForm($forms) {
        if (!$forms || !$forms.hasClass(this.form_id)) {
            $forms = $(`.${this.form_id}`);
        }

        let self = this;
        $forms.each(function () {
            if (!this.hasAttribute('data-model_pk')) {
                return;
            }
            let pk = $(this).data('model_pk');
            let instance = self.byPk(pk);
            for (let form_item of this.elements) {
                let name = form_item.name;
                if (name && name !== '') {
                    if (form_item.type === 'checkbox') {
                        form_item.checked = instance[name];
                    } else if (form_item.type === 'file' && instance[name] instanceof File) {
                        let container = new DataTransfer();
                        container.items.add(instance[name]);
                        form_item.files = container;
                    } else {
                        $(form_item).val(instance[name]);
                    }
                }
            }
        });

    }

    syncForm($forms) {
        if (!$forms || !$forms.hasClass(this.form_id)) {
            $forms = $(`.${this.form_id}`);
        }

        const self = this;
        let instances = [];

        $forms.each(function () {
            let $form = $(this);
            let pk = $form.data('model_pk');
            let instance = self.byPk(pk);
            for (let form_item of this.elements) {
                let name = form_item.name;
                if (name && name !== '') {
                    if (form_item.type === 'hidden') {
                        instance[name] = parse_hidden_inputs($(form_item).val());
                    } else if (form_item.type === 'checkbox') {
                        instance[name] = form_item.checked;
                    } else if (form_item.type === 'file') {
                        instance[name] = form_item.files[0];
                    } else {
                        instance[name] = $(form_item).val();
                    }
                }
            }

            instances.push(instance);
            return instance;
        });

        if (this.values_list.length <= 1 && instances.length > 0) {
            this.values = instances.at(-1);
        }

        return instances;

    }

    createForm(cb_resolve = null, cb_reject = null) {
        let $div_form = $('<div class="container-fluid">');
        this.isConnected().then(() => {
            this._getForm(null, 'create_form', null, $div_form, cb_resolve, cb_reject);
        });

        return $div_form;
    }

    editForm(pk = -1, cb_resolve = null, cb_reject = null) {
        let load_promise;
        if (this.values_list.length !== 0) {
            load_promise = this.isConnected();
        } else {
            load_promise = this.load();
        }

        let $div_form = $('<div  class="container-fluid">');

        load_promise.then(() => {
            if (pk <= -1) {
                pk = this.values_list.at(pk).pk;
            }

            this._getForm(pk, 'edit_form', null, $div_form, cb_resolve, cb_reject);
        });

        return $div_form;
    }

    namedForm(pk = -1, formName, cb_resolve = null, cb_reject = null) {
        let load_promise;
        if (this.values_list.length !== 0) {
            load_promise = this.isConnected();
        } else {
            load_promise = this.load();
        }

        let $div_form = $('<div  class="container-fluid">');

        load_promise.then(() => {
            if (pk <= -1) {
                pk = this.values_list.at(pk).pk;
            }

            this._getForm(pk, 'named_form', formName, $div_form, cb_resolve, cb_reject);
        });

        return $div_form;
    }


    _getForm(pk, event_type, formName, $div_form, cb_resolve, cb_reject) {
        const id = uuidv4();
        this.socket.send(JSON.stringify({
            event: 'model',
            event_type: event_type,
            event_id: id,
            args: {
                model_name: this.model_name,
                model_query: this.model_query,
                pk: pk,
                form_name: formName
            }
        }));

        const className = pk === null ? 'create' : 'edit';

        this.open_request[id] = [(data) => {
            $div_form.append(data.html);
            let $form = $div_form.closest('form').addClass(`sdc-model-${className}-form sdc-model-form ${this.form_id}`).data('model', this).data('model_pk', pk);
            if ($form.length > 0 && !$form[0].hasAttribute('sdc_submit')) {
                $form.attr('sdc_submit', 'submitModelFormDistributor')
            }

            app.refresh($div_form);
            cb_resolve && cb_resolve(data);
        }, (res) => {
            cb_reject && cb_reject(res);
        }];
    }

    new() {
        return new Promise((resolve, reject) => {
            const $form = $('<form>').append(this.createForm(() => {
                this.syncFormToModel($form);
                resolve();
            }, reject));
        })
    }

    save(pk = -1) {
        return this.isConnected().then(() => {
            let elem_list;
            if (pk > -1) {
                elem_list = [this.byPk(pk)];
            } else {
                elem_list = this.values_list;
            }
            let p_list = []
            elem_list.forEach((elem) => {
                const id = uuidv4();
                p_list.push(new Promise((resolve, reject) => {
                    this._readFiles(elem).then((files) => {
                        this.socket.send(JSON.stringify({
                            event: 'model',
                            event_type: 'save',
                            event_id: id,
                            args: {
                                model_name: this.model_name,
                                model_query: this.model_query,
                                data: elem,
                                files: files
                            }
                        }));

                        this.open_request[id] = [(res) => {
                            let data = JSON.parse(res.data.instance);
                            this._parseServerRes(data);
                            resolve(res);
                        }, reject];
                    });
                }));
            });

            return Promise.all(p_list);
        });
    }

    create(values = this.values) {
        const id = uuidv4();
        return this.isConnected().then(() => {
            return new Promise((resolve, reject) => {
                this._readFiles(values).then((files) => {
                    this.socket.send(JSON.stringify({
                        event: 'model',
                        event_type: 'create',
                        event_id: id,
                        args: {
                            model_name: this.model_name,
                            model_query: this.model_query,
                            data: values,
                            files: files
                        }
                    }));

                    this.open_request[id] = [(res) => {
                        let data = JSON.parse(res.data.instance);
                        this._parseServerRes(data);
                        resolve(res);
                    }, reject];
                })
            });
        });
    }

    delete(pk = -1) {
        if (pk === -1) pk = this.values?.pk
        const id = uuidv4();
        return this.isConnected().then(() => {
            return new Promise((resolve, reject) => {
                this.socket.send(JSON.stringify({
                    event: 'model',
                    event_type: 'delete',
                    event_id: id,
                    args: {
                        model_name: this.model_name,
                        model_query: this.model_query,
                        pk: pk
                    }
                }));

                this.open_request[id] = [resolve, reject];
            });
        });
    }

    isConnected() {
        return new Promise((resolve, reject) => {
            if (this._is_connected) {
                resolve();
            } else if (!this._is_conneting_process) {
                this._is_conneting_process = true;
                this.open_request['_connecting_process'] = [() => {
                }, () => {
                }]
                this._connectToServer().then(() => {
                    resolve(this._checkConnection());
                });
            } else {
                const [resolve_origin, reject_origin] = this.open_request['_connecting_process'];
                this.open_request['_connecting_process'] = [
                    () => {
                        resolve_origin();
                        resolve();
                    },
                    () => {
                        reject_origin();
                        reject();
                    }
                ]
            }
        });
    }

    close() {
        if (this.socket) {
            this._auto_reconnect = false;
            this.socket.onclose = () => {
            };
            this.socket.close();
            delete this['socket'];
        }
    }

    clean() {
        this.values_list = [];
        this.values = {};
        return this;
    }

    _readFiles(elem) {
        let to_solve = [];
        let files = {}
        for (const [key, value] of Object.entries(elem)) {
            if (value instanceof File) {
                to_solve.push(new Promise((resolve, reject) => {
                    ((key, value) => {
                        let reader = new FileReader();
                        reader.onload = e => {
                            const id = uuidv4();
                            this.open_request[id] = [resolve, reject];

                            let result = e.target.result;
                            let number_of_chunks = parseInt(Math.ceil(result.length / MAX_FILE_UPLOAD));
                            files[key] = {
                                id: id,
                                file_name: value.name,
                                field_name: key,
                                content_length: value.size,
                            };
                            for (let i = 0; i < number_of_chunks; ++i) {
                                this.socket.send(JSON.stringify({
                                    event: 'model',
                                    event_type: 'upload',
                                    event_id: id,
                                    args: {
                                        chunk: result.slice(MAX_FILE_UPLOAD * i, MAX_FILE_UPLOAD * (i + 1)),
                                        idx: i,
                                        number_of_chunks: number_of_chunks,
                                        file_name: value.name,
                                        field_name: key,
                                        content_length: value.size,
                                        content_type: value.type,
                                        model_name: this.model_name,
                                        model_query: this.model_query
                                    }
                                }));
                            }
                        }
                        reader.onerror = () => {
                            reject()
                        };
                        reader.readAsBinaryString(value);
                    })(key, value);
                }))
            }
        }

        return Promise.all(to_solve).then(() => {
            return files
        });
    }

    _onMessage(e) {
        let data = JSON.parse(e.data);
        if (data.is_error) {
            if (this.open_request.hasOwnProperty(data.event_id)) {
                this.open_request[data.event_id][1](data);
                delete this.open_request[data.event_id];
            }
            if (data.msg || data.header) {
                trigger('pushErrorMsg', data.header || '', data.msg || '');
            }

            if (data.type === 'connect') {
                this.open_request['_connecting_process'][1](data);
                delete this.open_request['_connecting_process'];
                this._auto_reconnect = false;
                this.socket.close();
            }
        } else {

            if (data.msg || data.header) {
                trigger('pushMsg', data.header || '', data.msg || '');
            }

            if (data.type === 'connect') {
                this._is_connected = true;
                this._is_conneting_process = false;
                this.open_request['_connecting_process'][0](data);
                delete this.open_request['_connecting_process'];
            } else if (data.type === 'load') {
                const json_res = JSON.parse(data.args.data);
                this.values_list = [];
                const obj = this._parseServerRes(json_res);
                data.args.data = obj;

            } else if (data.type === 'on_update' || data.type === 'on_create') {
                const json_res = JSON.parse(data.args.data);

                let obj = this._parseServerRes(json_res);
                let cb;

                if (data.type === 'on_create') {
                    cb = this.on_create;
                } else {
                    cb = this.on_update;
                }

                cb(obj);
                data.args.data = obj;

            }
            if (this.open_request.hasOwnProperty(data.event_id)) {
                this.open_request[data.event_id][0](data);
                delete this.open_request[data.event_id];
            }
        }
    }

    _connectToServer() {
        return new Promise((resolve) => {

            const model_identifier = `${this.model_name}` + (this.model_id > 0 ? `/${this.model_id}` : '');
            if (window.location.protocol === "https:") {
                this.socket = new WebSocket(`wss://${window.location.host}/sdc_ws/model/${model_identifier}`);
            } else {
                this.socket = new WebSocket(`ws://${window.location.host}/sdc_ws/model/${model_identifier}`);
            }


            this.socket.onmessage = this._onMessage.bind(this);

            this.socket.onclose = (e) => {
                console.error(`SDC Model (${this.model_name}, ${this.model_id}) Socket closed unexpectedly`);
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
            }
        });

    }

    _checkConnection() {
        const id = uuidv4();
        return new Promise((resolve, reject) => {
            this.socket.send(JSON.stringify({
                event: 'model',
                event_type: 'connect',
                event_id: id,
                args: {
                    model_name: this.model_name,
                    model_query: this.model_query
                }
            }));

            this.open_request[id] = [resolve, reject];
        });
    }

    _parseServerRes(res) {
        let updated = [];
        for (let json_data of res) {
            const pk = json_data.pk
            const obj = this.byPk(pk);
            for (const [k, v] of Object.entries(json_data.fields)) {
                if (v && typeof v === 'object' && v['__is_sdc_model__']) {
                    obj[k] = new SubModel(v['pk'], v['model'])
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
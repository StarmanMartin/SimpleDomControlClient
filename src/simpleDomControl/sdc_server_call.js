import {uuidv4} from "./sdc_utils.js";
import {trigger} from "./sdc_events.js";

let IS_CONNECTED = false;
let IS_CONNECTING = false;
let SDC_SOCKET = null
let OPEN_REQUESTS = {};

export function callServer(app, controller, parsedContentUrl, funcName, args) {
    if (window.SERVER_CALL_VIA_WEB_SOCKET) {
        return socketCallServer(app, controller, funcName, args);
    } else {
        return postCallServer(parsedContentUrl, funcName, args);
    }

}

export function isConnected() {
    if (window.SERVER_CALL_VIA_WEB_SOCKET) {
        return socketIsConnected();
    } else {
        return Promise.resolve(true);
    }
}

export function close() {
    if (window.SERVER_CALL_VIA_WEB_SOCKET) {
        socketClose();
    }
}

function postCallServer(parsedContentUrl, funcName, args) {
    if(typeof args !== 'object' && Array.isArray(args) && args === null) {
        args = {'arg0': args}
    }
    args = {
        'data': JSON.stringify(args),
        '_sdc_func_name': funcName, '_method': 'sdc_server_call'
    }
    return $.post({
        url: parsedContentUrl,
        data: args,
        beforeSend: function (xhr, settings) {
            xhr.setRequestHeader("X-CSRFToken", window.CSRF_TOKEN);
        }
    }).then((res) => {
        const data = res['_return_data'];
        _handle_response(data);
        return data;
    }).catch((res) => {
        const data = res.responseJSON;
        data.is_error = true;
        _handle_response(data);
        throw res;
    });
}

function socketCallServer(app, controller, funcName, args) {

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
            _handle_response(data);
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

function _handle_response(data) {
    if(!data) {
        data = {};
    }
    if (data.is_error) {
        if (data.msg || data.header) {
            trigger('pushErrorMsg', data.header || '', data.msg || '');
        }
        if (data.id && OPEN_REQUESTS[data.id]) {
            OPEN_REQUESTS[data.id][1](data.data || null);
            delete OPEN_REQUESTS[data.id];
        }
    } else {
        if (data.msg || data.header) {
            trigger('pushMsg', data.header || '', data.msg || '');
        }

        if (data.type && data.type === 'sdc_recall') {
            if (data.id && OPEN_REQUESTS[data.id]) {
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
}

function socketClose() {
    if (IS_CONNECTED) {
        IS_CONNECTED = false;
        try {
            SDC_SOCKET.close();
        } catch (e) {

        }

    }
}

function socketIsConnected() {

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
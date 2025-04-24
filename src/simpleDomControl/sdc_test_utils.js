/**
 * @jest-environment jsdom
 */

import {app} from './sdc_main.js';

let spy = [], _originAjax;

function setDefaults() {
    if (!jest) throw new Error("JEST is not defined");
    if (spy.length === 0) {
        _originAjax = $.ajax.bind($);

        spy.push(jest.spyOn(
            $,
            'ajax'
        ));
        spy[0].mockImplementation(function (a) {
            return _originAjax(a).then((html) => {
                return html;
            }).catch((html) => {
                return html;
            });
        });
    }
}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
    }
    return '';
}

/**
 * Returns the CSRF token
 */
export function getCsrfToken() {
    return getCookie('csrftoken');
}

/**
 *
 * @param html{string} HTML: .
 * @param afterLifecycle{bool} Lifecycle Methode -> Reruns the controller after the root controller has run the "onRefresh" methode. This is optional.
 * @returns {Promise<Array<{AbstractSDC}>>}
 */
export async function controllerFromTestHtml(html, afterLifecycle = null) {
    setDefaults();
    const $body = $('body');
    app.updateJquery();
    $body.safeEmpty().append(html);
    app._isInit = false;
    app.cleanCache();
    await app.init_sdc();

    let children = app.rootController.iterateAllChildren();

    if (!afterLifecycle) {
        return children
    }

    const origenRefresh = children[0].onRefresh;

    const refreshSpy = jest.spyOn(
        children[0],
        'onRefresh'
    );

    return new Promise((resolve) => {
        refreshSpy.mockImplementation(function () {
            refreshSpy.mockRestore();
            const res = origenRefresh.apply(children[0], arguments);
            resolve(children);
            return res;
        });
    });
}

/**
 * Returns a controller. This controller has been created by the using the normal SDC life cycle.
 *
 * @param tag_name{string} Controller tag name (snake-case)
 * @param init_arguments{object} object: Mockeds the tag data arguments.
 * @param origen_html{string} HTML: Mocked content of the content in your target HTML container.
 * @returns {Promise<{AbstractSDC}>}
 */
export async function get_controller(tag_name, init_arguments = {}, origen_html = '') {
    setDefaults();
    const $body = $('body');
    app.updateJquery();

    $body.safeEmpty();

    const $controller = $(`<${tag_name}>${origen_html}</${tag_name}>`);
    for (const [key, value] of Object.entries(init_arguments)) {
        $controller.data(key, value);
    }
    const $divContainer = $('<div></div>').append($controller);

    $body.append($divContainer);
    app._isInit = false;
    app.cleanCache();
    await app.init_sdc();
    return app.getController($controller);
}
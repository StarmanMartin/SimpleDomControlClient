/**
 * @jest-environment jsdom
 */

import {app} from './sdc_main.js';
let spy, _originAjax;

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
 * Returns a controller. This controller has been created by the using the normal SDC life cycle.
 *
 * @param tag_name{string} Controller tag name (snake-case)
 * @param init_arguments{object} object: Mockeds the tag data arguments.
 * @param origen_html{string} HTML: Mocked content of the content in your target HTML container.
 * @returns {Promise<{AbstractSDC}>}
 */
export async function get_controller( tag_name, init_arguments = {}, origen_html = '') {
    if(!jest) throw new Error("JEST is not defined");
    if(!spy) {
        _originAjax = $.ajax.bind($);

        spy = jest.spyOn(
            $,
            'ajax'
        );
        spy.mockImplementation(function (a) {
            return _originAjax(a).then((html) => {
                return html;
            }).catch((html) => {
                return html;
            });
        });
    }
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
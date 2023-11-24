/**
 * @jest-environment jsdom
 */

import {app} from './sdc_main.js';
import {getBody} from "./sdc_utils.js";
let spy, _originAjax;

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

    getBody().empty();

    const $controller = $(`<${tag_name}>${origen_html}</${tag_name}>`);
    for (const [key, value] of Object.entries(init_arguments)) {
        $controller.data(key, value);
    }
    const $divContainer = $('<div></div>').append($controller);

    getBody().append($divContainer);
    await app.init_sdc();
    return app.getController($controller);
}
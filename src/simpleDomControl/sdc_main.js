import {
    camelCaseToTagName,
    tagNameToCamelCase,
    getBody,
    uploadFileFormData,
    promiseDummyFactory
} from "./sdc_utils.js";
import {
    replaceTagElementsInContainer,
    reloadHTMLController,
    DATA_CONTROLLER_KEY,
    CONTROLLER_CLASS, getController, cleanCache, reloadMethodHTML
} from "./sdc_view.js";
import {AbstractSDC} from "./AbstractSDC.js";
import {Global, controllerList, tagList, resetChildren} from "./sdc_controller.js";
import {initEvents, setControllerEvents, STD_EVENT_LIST, windowEventHandler} from "./sdc_dom_events.js";
import {reconcile} from "./sdc_view.js";
import {trigger} from "./sdc_events.js";
import {isConnected, close} from "./sdc_server_call.js";

const PROPERTIES_UPDATE = {'classname': 'class'}

let sdcDomFragment = function (element, props) {
    let $new_elem, is_self = false;
    if (typeof element === 'string') {
        $new_elem = $(document.createElement(element));
    } else {
        const tagName = `this.${element.name}`;
        $new_elem = $(document.createElement(tagName));
        $new_elem.data('handler', element);
        is_self = true
    }


    if (props) {
        Object.entries(props).forEach(([k, v]) => {
            if (k.startsWith('on')) {
                $new_elem[0].addEventListener(k.substring(2).toLowerCase(), v);
            } else {
                if (PROPERTIES_UPDATE[k.toLowerCase()]) {
                    k = PROPERTIES_UPDATE[k.toLowerCase()];
                }
                $new_elem[0].setAttribute(k, v);
            }
        });
    }

    if (is_self) {
        $new_elem.addClass('_bind_to_update_handler _with_handler');
    }

    return $new_elem;
}

window.sdcDom = function (tagName, props, ...children) {
    if (!tagName) {
        return '';
    }
    const $new_elem = sdcDomFragment(tagName, props);
    for (const c of children) {
        $new_elem.append(c);
    }
    return $new_elem;

}

export let app = {
    CSRF_TOKEN: window.CSRF_TOKEN || '',
    LANGUAGE_CODE: window.LANGUAGE_CODE || 'en',
    DEBUG: window.DEBUG || false,
    VERSION: window.VERSION || '0.0',
    tagNames: [],
    Global: Global,
    rootController: null,
    _isInit: false,
    _origin_trigger: null,

    init_sdc: () => {
        if (!app._isInit) {
            app._isInit = true;
            if (!app._origin_trigger) {
                app._origin_trigger = $.fn.trigger;
                $.fn.trigger = function (event) {
                    const ev_type = {}.hasOwnProperty.call(event, "type") ? event.type : event;
                    if (!STD_EVENT_LIST.includes(ev_type)) {
                        STD_EVENT_LIST.push(ev_type);
                        $(window).on(ev_type, windowEventHandler);
                    }
                    return app._origin_trigger.call(this, event);
                }

                app.updateJquery();
            } else {
                close();
            }

            isConnected();

            initEvents();

            app.rootController = app.rootController || new AbstractSDC();
        }

        app.tagNames = tagList();

        for (let [tag, controller] of Object.entries(app.Global)) {
            if (!controller.$container) Global[tag].$container = getBody();
        }

        return replaceTagElementsInContainer(app.tagNames, getBody(), app.rootController);
    },

    updateJquery: () => {
        $.fn.safeReplace = function ($elem) {
            return app.safeReplace($(this), $elem);
        }
        $.fn.safeEmpty = function () {
            return app.safeEmpty($(this));
        }
        $.fn.safeRemove = function () {
            return app.safeRemove($(this));
        }
    },

    controllerToTag: (Controller) => {
        let tagName = camelCaseToTagName(Controller.name);
        return tagName.replace(/-controller$/, '');
    },

    /**
     *
     * @param {AbstractSDC} Controller
     */
    registerGlobal: (Controller) => {
        let tagName = app.controllerToTag(Controller);
        let globalController = new Controller();
        controllerList[tagName] = [globalController, []];
        globalController._tagName = tagName;
        window[tagNameToCamelCase(tagName)] = Global[tagNameToCamelCase(tagName)] = globalController;
    },

    cleanCache: () => {
        cleanCache();
    },

    /**
     *
     * @param {AbstractSDC} Controller
     */
    register: (Controller) => {
        let tagName = app.controllerToTag(Controller);
        controllerList[tagName] = [Controller, []];
        Controller.prototype._tagName = tagName;
        return {
            /**
             *
             * @param {Array<string>} mixins Controller tag names
             */
            addMixin: (...mixins) => {
                for (let mixin of mixins) {
                    let mixinName;
                    if (typeof mixin === "string") {
                        mixinName = camelCaseToTagName(mixin);
                    } else if (mixin) {
                        mixinName = app.controllerToTag(mixin)
                    }
                    controllerList[tagName][1].push(mixinName);
                }
            }
        }
    },

    /**
     *
     * @param {AbstractSDC} controller
     * @param {string} url
     * @param {object} args
     * @return {Promise}
     */
    post: (controller, url, args) => {
        if (!args) {
            args = {};
        }

        args.CSRF_TOKEN = app.CSRF_TOKEN;
        return app.ajax(controller, url, params, $.post);
    },

    /**
     *
     * @param {AbstractSDC} controller
     * @param {string} url
     * @param {object} args
     * @return {Promise}
     */
    get: (controller, url, args) => {
        return app.ajax(controller, url, args, $.get);
    },

    /**
     *
     * @param {AbstractSDC} controller
     * @param {string} url
     * @param {object} args
     * @param {function} method $.get or $.post
     * @return {Promise}
     */
    ajax: (controller, url, args, method) => {
        if (!args) {
            args = {};
        }

        args.VERSION = app.VERSION;
        args._method = args._method || 'api';

        const p = new Promise((resolve, reject) => {
            return method(url, args).then((a, b, c) => {
                resolve(a, b, c);
                if (a.status === 'redirect') {
                    trigger('onNavLink', a['url-link']);
                } else {
                    p.then(() => {
                        app.refresh(controller.$container);
                    });
                }
            }).catch(reject);
        });

        return p;
    },

    submitFormAndUpdateView: (controller, form, url, method) => {
        let formData = new FormData(form);
        const redirector = (a) => {
            if (a['url-link']) {
                trigger('onNavLink', a['url-link']);
            } else {
                window.location.href = a['url'];
            }

        }

        const p = new Promise((resolve, reject) => {
            uploadFileFormData(formData, (url || form.action), (method || form.method))
                .then((a, b, c) => {
                    resolve(a, b, c);
                    if (a.status === 'redirect') {
                        redirector(a);
                    } else {
                        p.then(() => {
                            app.refresh(controller.$container);
                        });
                    }
                })
                .catch((a, b, c) => {
                    if (a.status === 301) {
                        a = a.responseJSON;
                        redirector(a);
                        resolve(a, b, c);
                    } else {
                        reject(a, b, c);
                    }
                });
        });

        return p;

    },
    submitForm: (form, url, method) => {
        let formData = new FormData(form);
        return new Promise((resolve, reject) => {
            uploadFileFormData(formData, (url || form.action), (method || form.method))
                .then(resolve).catch(reject);
        });
    },

    /**
     *
     * @param {jquery} $elem
     * @return {AbstractSDC}
     */
    getController: ($elem) => getController($elem),

    /**
     * safeEmpty removes all content of a dom
     * and deletes all child controller safely.
     *
     * @param $elem - jQuery DOM container to be emptyed
     */
    safeEmpty: ($elem) => {
        let $children = $elem.children();
        $children.each(function (_, element) {
            let $element = $(element);
            app.safeRemove($element);
        });

        return $elem;
    },

    /**
     * safeReplace removes all content of a dom
     * and deletes all child controller safely.
     *
     * @param $elem - jQuery DOM to be repleaced
     * @param $new - jQuery new DOM container
     */
    safeReplace: ($elem, $new) => {
        $new.insertBefore($elem);
        return app.safeRemove($elem);
    },


    /**
     * safeRemove removes a dom and deletes all child controller safely.
     *
     * @param $elem - jQuery Dom
     */
    safeRemove: ($elem) => {
        $elem.each(function () {
            let $this = $(this);
            if ($this.data(`${DATA_CONTROLLER_KEY}`)) {
                $this.data(`${DATA_CONTROLLER_KEY}`).remove();
            }
        });

        $elem.find(`.${CONTROLLER_CLASS}`).each(function () {
            const controller = $(this).data(`${DATA_CONTROLLER_KEY}`);
            controller && controller.remove();
        });

        return $elem.remove();
    },

    /**
     *
     * @param {AbstractSDC} controller
     * @return {Promise<jQuery>}
     */
    reloadController: (controller) => {
        return reloadHTMLController(controller).then((html) => {
            let $html = $(html);
            return app.reconcile(controller, $html);
        });
    },


    /**
     *
     * @param {AbstractSDC} controller
     * @param {jquery} $virtualNode
     * @param {jquery} $realNode
     */
    reconcile: (controller, $virtualNode, $realNode = null) => {
        if (!$realNode) {
            let $temp = controller.$container.clone().empty();
            $temp.append($virtualNode);
            $virtualNode = $temp;
        }

        $realNode = $realNode ?? controller.$container;

        return app.refresh($virtualNode, controller, true).then(() => {
            reconcile($virtualNode, $realNode, controller);
            resetChildren(controller);
            return controller;
        });

    },

    /**
     *
     * @param {jquery} $container
     * @param {AbstractSDC} leafController
     * @param {bool} silent
     * @return {Promise<jQuery>}
     */
    refresh: ($container, leafController, silent = false) => {
        if (!leafController) {
            leafController = app.getController($container);
        }

        if (!leafController) {
            return promiseDummyFactory();
        }

        let controller = leafController;
        let controllerList = [];
        while (controller) {
            controller._isEventsSet = false;
            controllerList.unshift(controller);
            controller = controller._parentController;
        }

        $container ??= leafController.$container;

        return replaceTagElementsInContainer(app.tagNames, $container, leafController).then(() => {
            reloadMethodHTML(leafController, $container).then(() => {
                for (let con of controllerList) {
                    setControllerEvents(con);
                }

                !silent && leafController.onRefresh($container);
            });

        });
    },
};
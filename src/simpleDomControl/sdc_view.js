import {controllerFactory, runControlFlowFunctions, tagList} from "./sdc_controller.js";
import {getUrlParam} from "./sdc_params.js";
import {app} from "./sdc_main.js";
import {trigger} from "./sdc_events.js";

/**
 * List of HTML files.
 * @type {{}}
 */
let htmlFiles = {};

export const DATA_CONTROLLER_KEY = '_controller_';
export const CONTROLLER_CLASS = '_sdc_controller_';


export function cleanCache() {
    htmlFiles = {};
}

/**
 * findSdcTgs Finds all registered tags in a container. But it ignores
 * registered tags in registered tags. It collects all those
 * doms and returns a list of objects containing also the tag name the dom and the tag
 * names of the super controller
 *
 * @param {jquery} $container - jQuery container
 * @param {Array<string>} tagNameList - a string list with tag names.
 * @param {AbstractSDC} parentController - controller in surrounding
 * @return {Array} - a array of objects with all register tags found
 */
function findSdcTgs($container, tagNameList, parentController) {
    if (!$container) {
        return [];
    }
    let $children = $container.children();
    let emptyList = [];
    $children.each(function (_, element) {
        let $element = $(element);
        let tagName = $element.prop('tagName').toLowerCase().split('_');
        if ($.inArray(tagName[0], tagNameList) >= 0) {
            emptyList.push({
                tag: tagName[0],
                super: tagName.splice(1) || [],
                dom: $element
            });

        } else if (tagName[0].startsWith('this.')) {
            $element.addClass(`_bind_to_update_handler sdc_uuid_${parentController._uuid}`)
        } else {
            emptyList = emptyList.concat(findSdcTgs($element, tagNameList, parentController))
        }
    });

    return emptyList;
}

/**
 * replacePlaceholderController fills the parameter of the content
 * url this function uses the tag parameter
 *
 * @param controller - controller object
 * @param url - the origin content URL
 * @param urlValues - values for the url placeholder. In same order!!
 * @returns {string} - the correct URL with prefix.
 */
function replacePlaceholderController(controller, url, urlValues) {
    for (let key_idx in controller._urlParams) {
        if (controller._urlParams.hasOwnProperty(key_idx)) {
            let key = controller._urlParams[key_idx];
            let re = RegExp("%\\(" + key + "\\)\\w", "gm");
            url = url.replace(re, "" + urlValues.shift());
        }
    }

    return url;
}

/**
 * loadHTMLFile loads the HTML content file from the server via ajax request.
 *
 * If the HTML file is loaded already the function takes no action.
 *
 * @param path - a content URL from the controller.
 * @param {object} args - get args.
 * @param tag - a normalized tag-name as string.
 * @param hardReload - true if the file has to be reloaded every time.
 * @returns {Promise<Boolean>} - waits for the file to be loaded.
 */
function loadHTMLFile(path, args, tag, hardReload) {
    if (!path) {
        return Promise.resolve(false);
    } else if (htmlFiles[tag]) {
        return Promise.resolve(htmlFiles[tag])
    }

    args.VERSION = app.VERSION;
    args._method = 'content';

    return $.get(path, args).then(function (data) {
        if (!hardReload) {
            htmlFiles[tag] = data;
        }

        return data;
    }).catch(function (err) {
        if (err.status === 301) {
            const data = err.responseJSON;
            trigger('_RedirectOnView', data['url-link']);
        }
        trigger('navLoaded', {'controller_name': ()=> err.status});

        throw `<sdc-error data-code="${err.status}">${err.responseText}</sdc-error>`;
    });
}

/**
 * replaceAllTagElementsInContainer replaces all registered tags by the controller.
 * In this step the life-cycle starts.
 *
 * @param {jquery} $container - given container
 * @param {AbstractSDC} parentController - parent contoller surrounded the container
 */
function replaceAllTagElementsInContainer($container, parentController) {
    parentController = parentController || $container.data(DATA_CONTROLLER_KEY);
    return replaceTagElementsInContainer(app.tagNames, $container, parentController);
}

/**
 * parseContentUrl uses the content URL prefix to marge the
 * correct URL. Also parses the url parameter
 *
 * @param {AbstractSDC} controller - controller object
 * @returns {string} - the correct URL with prefix.
 */
function parseContentUrl(controller) {
    let url = controller.contentUrl;
    if (controller && controller._urlParams.length === 0) {
        let re = /%\(([^)]+)\)\w/gm;
        let matches;
        controller._urlParams = [];
        while ((matches = re.exec(url))) {
            controller._urlParams.push(matches[1]);
            controller.contentReload = true;
        }
    }

    let params = getUrlParam(controller, controller.$container);
    if (controller._urlParams.length) {
        url = replacePlaceholderController(controller, url, params);
    }

    controller.parsedContentUrl = url;

    return {url: url, args: params[params.length - 1]};
}


/**
 *
 * @param {jquery} $elem
 * @return {AbstractSDC}
 */
export function getController($elem) {
    if ($elem.hasClass(CONTROLLER_CLASS)) {
        return $elem.data(`${DATA_CONTROLLER_KEY}`);
    }
    return $elem.closest(`.${CONTROLLER_CLASS}`).data(`${DATA_CONTROLLER_KEY}`);
}

/**
 * loadFilesFromController loads the content (HTML) of a
 * Controller. If you have an alternative content URL is registered, for this
 * controller the origin content URL is ignored.
 *
 * The content is saved as jQuery object to the controller.$content property of
 * the controller.
 *
 * @param {AbstractSDC} controller - a instance of a JavaScript controller object.
 * @returns {Promise<jQuery>} - the promise waits to the files are loaded. it returns the jQuery object.
 */
export function loadFilesFromController(controller) {
    let getElements = {args: {}};
    if (controller.contentUrl) {
        getElements = parseContentUrl(controller, controller.contentUrl);
        controller.contentUrl = getElements.url;
    }

    return Promise.all([
        loadHTMLFile(controller.contentUrl, getElements.args, controller._tagName, controller.contentReload)
    ]).then(function (results) {
        let htmlFile = results[0];
        if (htmlFile) {
            try {
                return $(htmlFile);
            } catch {
                return $('<div></div>').append(htmlFile);
            }
        }

        return null;
    });
}

/**
 * reloadHTMLController loads the content (HTML) of a
 * Controller. If you have an alternative content URL is registered, for this
 * controller the origin content URL is ignored.
 *
 *
 * @param {AbstractSDC} controller - a instance of a JavaScript controller object.
 *
 * @returns {Promise<jQuery>} - the promise waits to the files are loaded. it returns the jQuery object.
 */
export function reloadHTMLController(controller) {
    if (controller.contentUrl) {
        let getElements = parseContentUrl(controller, controller.contentUrl);
        controller.contentUrl = getElements.url;
        return loadHTMLFile(controller.contentUrl, getElements.args, controller._tagName, controller.contentReload);
    }

    return new Promise(resolve => {
        resolve($());
    });
}

/**
 *
 * @param {jquery} $element
 * @param {string} tagName
 * @param {Array<string>} superTagNameList
 * @param {AbstractSDC} parentController
 * @returns {boolean}
 */
function runReplaceTagElementsInContainer($element, tagName, superTagNameList, parentController) {
    let controller = $element.data(DATA_CONTROLLER_KEY);
    if (controller) {
        return replaceAllTagElementsInContainer($element, controller);
    }

    controller = controllerFactory(parentController, $element, tagName, superTagNameList);
    $element.data(DATA_CONTROLLER_KEY, controller);
    $element.addClass(CONTROLLER_CLASS);
    return runControlFlowFunctions(controller, $element);
}


/**
 * runControllerFillContent empties the registered tag and replaces it by the controller
 * content. It sets the CSS tags for the relation with the CSS files.
 *
 * @param {AbstractSDC} controller - js controller instance
 * @param {jquery} $html - jQuery loaded content
 * @return {Promise}
 */
export function runControllerFillContent(controller, $html) {
    if ($html && $html.length > 0) {
        controller.$container.empty();
        controller.$container.attr(controller._tagName, '');
        for (let mixinKey in controller._mixins) {
            controller.$container.attr(controller._mixins[mixinKey]._tagName, '');
        }
        controller.$container.append($html);
    }

    return replaceAllTagElementsInContainer(controller.$container, controller);
}


/**
 * replaceTagElementsInContainer Finds all registered tags in a container. But it ignores
 * registered tags in registered tags. For each registered tag it loads the content.
 * Afterwards it starts the life cycle of the controller. I the next step it starts the
 * procedure for the child elements of the controller tag.
 *
 * @param {Array<string>} tagList - list of all registered tags
 * @param {jquery} $container - jQuery container to find the tags
 * @param {AbstractSDC} parentController - controller in surrounding
 */
export function replaceTagElementsInContainer(tagList, $container, parentController) {
    return new Promise((resolve) => {

        let tagDescriptionElements = findSdcTgs($container, tagList, parentController);
        let tagCount = tagDescriptionElements.length;

        if (tagCount === 0) {
            return resolve();
        }

        for (let elementIndex = 0; elementIndex < tagDescriptionElements.length; elementIndex++) {
            runReplaceTagElementsInContainer(tagDescriptionElements[elementIndex].dom,
                tagDescriptionElements[elementIndex].tag,
                tagDescriptionElements[elementIndex].super,
                parentController).then(() => {
                tagCount--;
                if (tagCount === 0) {
                    return resolve();
                }
            });
        }
    });
}

export function reloadMethodHTML(controller) {
    return _reloadMethodHTML(controller, controller.$container)
}
function _reloadMethodHTML(controller, $dom) {
    const plist = [];

    $dom.find(`._bind_to_update_handler.sdc_uuid_${controller._uuid}`).each(function () {
        const $this = $(this);
        let result = undefined;
        if($this.hasClass(`_with_handler`)) {
            result = $this.data('handler');
        } else {
            let controller_handler = this.tagName.toLowerCase().replace(/^this./, '');
            if (controller[controller_handler]) {
                result = controller[controller_handler];
            }
        }


        if (typeof result === 'function') {
            result = result.bind(controller)($this.data());
        }
        if (result !== undefined) {
            plist.push(Promise.resolve(result).then((x) => {
                const $new_content = $(`<div></div>`);
                $new_content.append(x);
                return replaceTagElementsInContainer(tagList(), $new_content, controller).then(()=> {
                    return _reloadMethodHTML(controller, $new_content).then(()=> {
                        $this.safeEmpty().text('').append(x);
                        return true;
                    });
                });
            }));
        }

    });

    return Promise.all(plist);
}
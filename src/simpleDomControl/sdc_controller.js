import {promiseDummyFactory, tagNameToCamelCase, agileAggregation} from "./sdc_utils.js";
import {
    CONTROLLER_CLASS,
    getController,
    loadFilesFromController,
    refresh,
    runControllerFillContent
} from "./sdc_view.js";

import {runOnInitWithParameter} from "./sdc_params.js";
import {setControllerEvents} from "./sdc_dom_events.js";
import {app} from "./sdc_main.js";

export let Global = [];
export let controllerList = {};

export function tagList() {
    return Object.keys(controllerList);
}


function prepareMixins(superTagNameList, tagName) {
    superTagNameList = superTagNameList.concat(controllerList[tagName][1]);
    superTagNameList = superTagNameList.filter((value, index, self) => {
        return self.indexOf(value) === index;
    });
    let hasAdded = true;
    while (hasAdded) {
        hasAdded = false;
        for (let tag of superTagNameList) {
            for (let newTag of controllerList[tag][1]) {
                if (!superTagNameList.includes(newTag)) {
                    superTagNameList.push(newTag);
                    hasAdded = true;
                }
            }
        }
    }
    return superTagNameList;
}

/**
 * setParentController sets the parent controller as property: 'parentController'
 * to the child controller. Also, it adds the child controller to the property list:
 * 'parentController' to the parent controller
 *
 * @param {AbstractSDC} parentController - js controller instance, controller of the parent DOM of the controllers DOM
 * @param {AbstractSDC} controller - js controller instance
 * @return {AbstractSDC} - parentController
 */
function setParentController(parentController, controller) {
    if (parentController) {
        let controllerName = tagNameToCamelCase(controller._tagName);
        if (!parentController._childController[controllerName]) {
            parentController._childController[controllerName] = [];
        }

        parentController._childController[controllerName].push(controller);
    }

    return (controller._parentController = parentController)
}

/**
 * resetChildren resets all children of a controller.
 *
 * @param {AbstractSDC} parentController
 */
export function resetChildren(parentController) {
    parentController._childController = {};
    parentController.find(`.${CONTROLLER_CLASS}`).each(function () {
        const $this = $(this);
        const cController = getController($this);
        if (cController === parentController) {
            setParentController(parentController, cController);
        }
    });
}

/**
 * controllerFactoryInstance it generates a controller instance
 * depending if the controller is registered as a global controller. It sets the
 * $container object to the jQuery representation of the tag.
 *
 * It handles the init parameter by the data values of the DOM.
 *
 * It handles the super extensions.
 *
 * @param {AbstractSDC} parentController - Controller of the parent DOM
 * @param {jquery} $element - The current DOM jQuery
 * @param {string} tagName - the registered tag name of the current DOM
 * @param {Array<string>} superTagNameList - tag names of super controller
 * @return {AbstractSDC} -  new Controller
 */
function controllerFactoryInstance(parentController, $element, tagName, superTagNameList) {

    let mixinControllerClass = [];
    superTagNameList = prepareMixins(superTagNameList, tagName);
    for (let superTagName of superTagNameList) {
        mixinControllerClass.push(controllerList[superTagName][0]);
    }

    let controllerClass = controllerList[tagName][0];
    let controller = new (agileAggregation(controllerClass, ...mixinControllerClass))();
    controller._tagName = tagName;

    setParentController(parentController, controller);
    controller.$container = $element;
    runOnInitWithParameter($element, controller);


    return controller;
}

/**
 * controllerFactory it either generates a controller or takes a globe instance
 * depending if the controller is registered as a global controller. It sets the
 * $container object to the jQuery representation of the tag.
 *
 * Remember Global controller can not have a super controller!
 *
 * @param {AbstractSDC} parentController - Controller of the parent DOM
 * @param {jquery} $element - The current DOM jQuery
 * @param {string} tagName - the registered tag name of the current DOM
 * @param {Array<string>} superTagNameList - tag names of super controller
 * @return {AbstractSDC} -  new Controller
 */
export function controllerFactory(parentController, $element, tagName, superTagNameList) {

    if (Global.includes(tagName)) {
        let gTagName = tagNameToCamelCase(tagName);
        if (!window[gTagName]) {
            window[gTagName] = controllerFactoryInstance(parentController, $element, tagName, superTagNameList);
        }

        window[gTagName].$container = $element;
        return window[gTagName];
    }

    return controllerFactoryInstance(parentController, $element, tagName, superTagNameList);
}

/**
 * runControllerShow first runs onLoad and fill content for all sub
 * controller. Only if all the sub controller are loaded the willShow
 * control flow function gets called.
 *
 * @param {AbstractSDC} controller - js controller instance
 * @param {jquery} $html - jQuery loaded content
 * @return {Promise<*>} - return of the onLoad function
 */
function runControllerShow(controller, $html) {
    return runControllerFillContent(controller, $html).then(function (args) {
        args = args || true;
        if (controller.willShow) {
            let loadPromiseOrContent = controller.willShow();
            if (loadPromiseOrContent instanceof Promise) {
                return loadPromiseOrContent.then(function () {
                    return args;
                });
            }
        }

        return args;
    });
}


/**
 * runControllerLoad Calls the onLoad function of the controller.
 * This function is called before the HTML is set to the page.
 * The parameter is a list of children of the tag and the registered tag.
 *
 * @param {AbstractSDC} controller - js controller instance
 * @return {Promise<*>} - return of the onLoad function
 */
function runControllerLoad(controller) {
    return loadFilesFromController(controller).then((html) => {
        if (!controller.onLoad || controller._onLoadDone) {
            return html;
        }

        controller._onLoadDone = true;
        let loadPromise = controller.onLoad(html);
        return (loadPromise || promiseDummyFactory()).then(() => {
            return html;
        });
    });
}

/**
 * runControlFlowFunctions runs the control flow functions:
 * 1. onLoad()
 * 2. fill content
 * 3. willShow(dom parameter)
 * 4. refresh()
 *
 * @param controller
 * @param {Object} process - Process object containing the refresh process
 */
export function runControlFlowFunctions(controller, process ) {
    const prom_controller = runControllerLoad(controller)
        .then(function ($html) {
            return runControllerShow(controller, $html);
        }).then(() => {
            return runRefresh(controller, process);
        }).catch(function ($html) {
            return runControllerFillContent(controller, $html);
        });

    if (controller.load_async) {
        return Promise.resolve();
    }

    return prom_controller;
}

/**
 *
 * @param {AbstractSDC} controller
 * @param {Object} process - Process object containing the refresh process
 */
export function runRefresh(controller, process) {
    return refresh(null, controller, process);
}

function getParentList(controller) {
    let controllerList = [];
    while (controller) {
        controller._isEventsSet = false;
        controllerList.unshift(controller);
        controller = controller._parentController;
    }
    return controllerList
}

/**
 *
 * @param {Object} process - Process object containing the refresh process
 */
export function updateEventAndTriggerOnRefresh(process) {
    const parentList = getParentList(process.controller[0]);
    const controllerList = parentList.concat(process.controller.slice(1));

    for (let con of controllerList) {
        setControllerEvents(con);
        con.onRefresh(process.controller[0]);
    }
}


export function prepareRefreshProcess(refreshProcess, controller) {
    let isRunningProcess = Boolean(refreshProcess);

    if (!isRunningProcess) {
      refreshProcess = {uuids: new Set([controller._uuid]), controller: [controller]};
    } else if (!refreshProcess.uuids.has(controller._uuid)) {
      refreshProcess.uuids.add(controller._uuid);
      refreshProcess.controller.push(controller);
    }

    return {isRunningProcess, refreshProcess};
}


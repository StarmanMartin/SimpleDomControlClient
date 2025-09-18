import {
  controllerFactory,
  prepareRefreshProcess,
  runControlFlowFunctions,
  updateEventAndTriggerOnRefresh
} from "./sdc_controller.js";
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
    trigger('navLoaded', {'controller_name': () => err.status});

    throw `<sdc-error data-code="${err.status}">${err.responseText}</sdc-error>`;
  });
}

/**
 * replaceAllTagElementsInContainer replaces all registered tags by the controller.
 * In this step the life-cycle starts.
 *
 * @param {jquery} $container - given container
 * @param {AbstractSDC} parentController - parent contoller surrounded the container
 * @param {Object} process - Process object containing the refresh process
 */
function replaceAllTagElementsInContainer($container, parentController, process = null) {
  parentController = parentController || $container.data(DATA_CONTROLLER_KEY);
  return replaceTagElementsInContainer(app.tagNames, $container, parentController, process);
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
 * @param {Object} process - Process object containing the refresh process
 * @returns {Promise}
 */
function runReplaceTagElementsInContainer($element, tagName, superTagNameList, parentController, process) {
  let controller = $element.data(DATA_CONTROLLER_KEY);
  if (controller) {
    return replaceAllTagElementsInContainer($element, controller, process);
  }

  controller = controllerFactory(parentController, $element, tagName, superTagNameList);
  $element.data(DATA_CONTROLLER_KEY, controller);
  $element.addClass(CONTROLLER_CLASS);
  return runControlFlowFunctions(controller, process);
}


/**
 * runControllerFillContent empties the registered tag and replaces it by the controller
 * content. It sets the CSS tags for the relation with the CSS files.
 *
 * @param {AbstractSDC} controller - js controller instance
 * @param {jquery} $html - jQuery loaded content
 * @param {Object} process - Process object containing the refresh process
 * @return {Promise}
 */
export function runControllerFillContent(controller, $html, process = null) {
  if ($html && $html.length > 0) {
    controller.$container.empty();
    controller.$container.attr(controller._tagName, '');
    for (let mixinKey in controller._mixins) {
      controller.$container.attr(controller._mixins[mixinKey]._tagName, '');
    }
    controller.$container.append($html);
  }

  return replaceAllTagElementsInContainer(controller.$container, controller, process);
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
 * @param {Object} process - Process object containing the refresh process
 */
export function replaceTagElementsInContainer(tagList, $container, parentController, process) {
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
        parentController, process).then(() => {
        tagCount--;
        if (tagCount === 0) {
          return resolve();
        }
      });
    }
  });
}

export function reloadMethodHTML(controller, $container, process) {
  return _reloadMethodHTML(controller, $container ?? controller.$container, process)
}

function _reloadMethodHTML(controller, $dom, process) {
  const plist = [];

  $dom.find(`._bind_to_update_handler.sdc_uuid_${controller._uuid}`).each(function () {
    const $this = $(this);
    let result = undefined;
    if ($this.hasClass(`_with_handler`)) {
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
        let $newContent = $(`<div></div>`);
        $newContent.append(x);
        $newContent = $this.clone().empty().append($newContent);
        return app.reconcile(controller, $newContent, $this, process);
      }));
    }

  });

  return Promise.all(plist);
}


function getNodeKey(node) {
  if (node[0].nodeType === 3) {
    return `TEXT__${node[0].nodeValue}`;
  }
  const res = [node[0].tagName];
  if (node[0].nodeName === 'INPUT') {
    [['name', ''], ['type', 'text'], ['id', '']].forEach(([key, defaultValue]) => {
      const attr = node.attr(key) ?? defaultValue;
      if (attr) {
        res.push(attr);
      }
    });
  }
  return res.join('__');
}

function reconcileTree($element, id = [], parent = null) {
  id.push(getNodeKey($element));
  const obj = {
    $element,
    id: id.join('::'),
    depth: id.length,
    idx: 0,
    getRealParent: () => parent,
    getIdx: function () {
      this.idx = (this.getRealParent()?.getIdx() ?? -1) + $element.index() + 1;
      return this.idx;
    },
    op: null,
    parent
  };
  obj.getIdx.bind(obj);
  return [obj].concat($element.contents().toArray().map((x) => reconcileTree($(x), id.slice(), obj)).flat());

}


export function reconcile($virtualNode, $realNode) {
  const $old = reconcileTree($realNode);
  const $new = reconcileTree($virtualNode);
  $old.map((x, i) => x.idx = i);
  $new.map((x, i) => x.idx = i);
  const depth = Math.max(...$new.concat($old).map(x => x.depth));
  const op_steps = lcbDiff($old, $new, depth);
  let toRemove = [];
  window.MAIN = $realNode;
  window.OPS = op_steps;

  op_steps.forEach((op_step, i) => {
    const {op, $element, idx} = op_step;

    if (op.type === 'keep_counterpart') {
      let cIdx = op.counterpart.getIdx();
      if (cIdx !== idx) {
        const elemBefore = op_step.getBefore();
        if (!elemBefore) {
          op_step.getRealParent().$element.prepend(op.counterpart.$element);
        } else {
          op.counterpart.$element.insertAfter(elemBefore.$element);
        }
      }

      syncAttributes(op.counterpart.$element, $element);
      if ($element.hasClass(CONTROLLER_CLASS)) {
        $element.data(DATA_CONTROLLER_KEY).$container = op.counterpart.$element;
        $element.data(DATA_CONTROLLER_KEY, null);
      }

      toRemove.push($element);
    } else if (op.type === 'delete') {
      $element.safeRemove();
    } else if (op.type === 'insert') {
      const {after, target} = op_step.op;
      if (after) {
        $element.insertAfter(after.$element);
      } else if (target) {
        target.$element.prepend($element);
      }

    }
  });

  toRemove.forEach(($element) => $element.safeRemove());
}

function syncAttributes($real, $virtual) {
  const realAttrs = $real[0].attributes ?? [];
  const virtualAttrs = $virtual[0].attributes ?? [];
  // Remove missing attrs
  [...realAttrs].forEach(attr => {
    if (!$virtual.is(`[${attr.name}]`)) {
      $real.removeAttr(attr.name);
    }
  });

  // Add or update
  [...virtualAttrs].forEach(attr => {
    if (!attr.name.startsWith(`data`) && $real.attr(attr.name) !== attr.value) {
      $real.attr(attr.name, attr.value);
    }
  });

  $real.removeData();
  Object.entries($virtual.data()).forEach(([key, value]) => {
    $real.data(key, value);
  });
}

/**
 * LCB (Longest Common Branch) finds matching branches and reserves them!
 *
 * @param oldNodes
 * @param newNodes
 * @param depth
 * @returns {*|*[]}
 */
function lcbDiff(oldNodes, newNodes, depth) {
  newNodes.filter(x => x.depth === depth && !x.op).forEach((newNode) => {
    const oldNode = oldNodes.find((tempOldNode) => {
      return !tempOldNode.op && tempOldNode.id === newNode.id;
    });

    if (oldNode) {
      const keepTreeBranch = (oldNode, newNode) => {
        oldNode.op = {type: 'keep', idx: newNode.idx};
        newNode.op = {type: 'keep_counterpart', counterpart: oldNode};
        oldNode = oldNode.parent;
        newNode = newNode.parent;
        if (!oldNode || oldNode.op || newNode?.op) {
          return;
        }
        keepTreeBranch(oldNode, newNode);

      }
      keepTreeBranch(oldNode, newNode);
    }
  });
  if (depth > 1) {
    return lcbDiff(oldNodes, newNodes, depth - 1);
  }

  oldNodes.forEach((x, i) => {
    if (!x.op) {
      const idx = (oldNodes[i - 1]?.op.idx ?? -1) + 1;
      x.op = {type: 'delete', idx}
    }
  });

  function getRealParent(element) {
    if (!element.parent) {
      return null;
    }
    return element.parent.op.type === 'keep_counterpart' ? element.parent.op.counterpart : element.parent;
  }

  function getBefore(element, idx) {
    const startDepth = element.depth;
    while (idx >= 0 && element.depth >= startDepth) {
      idx -= 1;
      element = newNodes[idx];
      if (element.depth === startDepth) {
        return element.op.type === 'keep_counterpart' ? element.op.counterpart : element;
      }
    }

    return null

  }

  newNodes.forEach((x, i) => {
    x.getBefore = () => getBefore(x, i);
    x.getRealParent = () => getRealParent(x);

    if (!x.op) {
      const target = x.getRealParent();
      const type = target?.op.type === 'insert' ? 'insert_ignore' : 'insert';
      x.op = {type, target, after: x.getBefore()}
    }
  });

  const tagged = [
    ...oldNodes,
    ...newNodes,
  ];


  return tagged.sort((a, b) => {
    const aVal = a.op?.idx ?? a.idx;
    const bVal = b.op?.idx ?? b.idx;

    return aVal - bVal;
  });
}

/**
 *
 * @param {jquery} $dom
 * @param {AbstractSDC} leafController
 * @param {Object} process - Process object containing the refresh process
 * @return {Promise<void>}
 */

export function refresh($dom, leafController, process = null) {
  if (!leafController) {
    leafController = getController($dom);
  }

  if (!leafController) {
    return Promise.resolve();
  }

  const {refreshProcess, isRunningProcess} = prepareRefreshProcess(process, leafController);

  $dom ??= leafController.$container;

  return replaceTagElementsInContainer(app.tagNames, $dom, leafController, process).then(() => {
    reloadMethodHTML(leafController, $dom, refreshProcess).then(() => {
      if (!isRunningProcess) {
        updateEventAndTriggerOnRefresh(refreshProcess);
      }
    });

  });
}
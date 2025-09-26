import {getParamsNameOfFunction, checkIfParamNumberBoolOrString} from "./sdc_utils.js";
import {DATA_CONTROLLER_KEY} from "./sdc_view.js";


export function prepareData(data, paramNameList = []) {
  const data_json_key = 'SDC_JSON_MODEL=['
  return Object.fromEntries(
    Object.entries(data).filter(([key, element]) => {
      return key !== DATA_CONTROLLER_KEY && !paramNameList.includes(key);
    }).map(([key, element]) => {
      if (typeof element === 'string' && element.startsWith(data_json_key)) {
        try {
          const {pk, fields} = JSON.parse(element.slice(data_json_key.length, -1));
          return [key, {
            ...fields,
            id: pk,
            pk
          }];
        } catch {
        }
      }
      return [key, element];
    })
  );
}

function getParamList(paramNameList, $element) {
  let returnList;
  if (!paramNameList) {
    paramNameList = [];
  }

  let data = $element.data();
  let restData = prepareData(data, paramNameList);

  returnList = [];
  for (let i = 0; i < paramNameList.length; i++) {
    let data_name = paramNameList[i];

    if (data.hasOwnProperty(data_name)) {
      returnList.push(data[data_name]);
    } else {
      returnList.push('undefined');
    }
  }

  returnList.push(restData)
  return returnList;
}

function parseParamNameList(list, controller = null) {
  let values = [];

  for (let i = 0; i < list.length; i++) {
    let tempValue = checkIfParamNumberBoolOrString(list[i], controller);
    values.push(tempValue);
  }

  return values;
}

function getDomTagParamsWithList(paramNameList, $element, controller = null) {
  let paramList = getParamList(paramNameList, $element);
  return parseParamNameList(paramList, controller);
}

/**
 *
 * @param {AbstractSDC} controller
 * @param {jquery} $element
 * @param applyController
 * @returns {boolean}
 */
function reg_runOnInitWithParameter(controller, $element, applyController) {
  if (!controller) {
    return false
  } else if (typeof controller.onInit !== 'function') {
    return false
  }
  let paramNameList;
  if (typeof controller._on_init_params === 'function') {
    paramNameList = controller._on_init_params();
  } else {
    paramNameList = getParamsNameOfFunction(controller.onInit);
  }


  let initParams = getDomTagParamsWithList(paramNameList, $element, applyController._parentController);
  controller.onInit.apply(applyController, initParams);
  if (applyController === controller) {
    for (let mixinKey in controller._mixins) {
      reg_runOnInitWithParameter(controller._mixins[mixinKey], $element, applyController);
    }
  }
}

export function runOnInitWithParameter($element, controller) {
  reg_runOnInitWithParameter(controller, $element, controller);
}

export function getUrlParam(controller, $element) {
  return getDomTagParamsWithList(controller._urlParams, $element);
}
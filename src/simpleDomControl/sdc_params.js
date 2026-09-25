import {
  checkIfParamNumberBoolOrString,
} from "./sdc_utils.js";
import { DATA_CONTROLLER_KEY } from "./sdc_view.js";

export function prepareData(data, controller = null) {
  const data_json_key = "SDC_JSON_MODEL=[";
  return Object.fromEntries(
    Object.entries(data)
      .filter(([key, element]) => {
        return key !== DATA_CONTROLLER_KEY;
      })
      .map(([key, element]) => {
        if (typeof element === "string" && element.startsWith(data_json_key)) {
          try {
            const { pk, fields } = JSON.parse(
              element.slice(data_json_key.length, -1),
            );
            return [
              key,
              {
                ...fields,
                id: pk,
              },
            ];
          } catch {
          }
        }
        return [key, checkIfParamNumberBoolOrString(element, controller)];
      }),
  );
}


function getDomTagParamsWithList($element, controller = null) {
  return prepareData($element.data(), controller);
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
    return false;
  }

  controller.params = getDomTagParamsWithList(
    $element,
    applyController._parentController,
  );
}

export function runOnInitWithParameter($element, controller) {
  reg_runOnInitWithParameter(controller, $element, controller);
}

export function getUrlParam(controller, $element) {
  const values = getDomTagParamsWithList($element, controller);
  const [params, args] = Object.entries(values).reduce(([params, args], [k, v]) => {
    if (controller._urlParams.includes(k)) {
      params[k] = v;
    } else {
      args[k] = v;
    }
    return [params, args]
  }, [{}, {}]);

  return { params, args };
}

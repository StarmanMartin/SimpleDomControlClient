import {app} from './simpleDomControl/sdc_main.js';
import {AbstractSDC} from './simpleDomControl/AbstractSDC.js';
import {on, trigger, allOff, setEvent} from './simpleDomControl/sdc_events.js';
import {clearErrorsInForm, setErrorsInForm, checkIfParamNumberBoolOrString} from './simpleDomControl/sdc_utils.js';
import {controllerFactory, runControlFlowFunctions} from './simpleDomControl/sdc_controller.js';
import {close} from './simpleDomControl/sdc_server_call.js'
import {get_controller, getCsrfToken, controllerFromTestHtml} from './simpleDomControl/sdc_test_utils.js'

const socketReconnect = close
const test_utils = {get_controller, getCsrfToken, controllerFromTestHtml};

export {
    app, AbstractSDC, on, trigger, allOff, setEvent, clearErrorsInForm, setErrorsInForm, checkIfParamNumberBoolOrString,
    controllerFactory, runControlFlowFunctions, socketReconnect, test_utils
}

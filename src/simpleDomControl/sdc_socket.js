const registeredModels = {};


function registerModel(name, classObj) {
  registeredModels[name] = classObj;
}

function getModel(name) {
  return registeredModels[name];
}


export {
  registerModel,
  getModel,
}
API Reference
=============

Top-level exports
-----------------

The package entry point exports the following public API:

``app``
   Global runtime object.

``AbstractSDC``
   Base controller class.

``SdcModel``
   Model base export from ``sdc_model.js``.

``SdcQuerySet``
   QuerySet collection class for backend-backed models.

``registerModel(name, classObj)``
   Registers a model class in the global model registry.

``on(name, controller)``
   Registers a controller or object as a listener for an application event.

``trigger(name, ...args)``
   Emits an application event and returns a promise of listener results.

``allOff(controller)``
   Removes the controller from all application event subscriptions.

``setEvent(name, functionName = name)``
   Maps an application event name to a handler method name.

``clearErrorsInForm($form)``
   Removes form-level and field-level validation error markup.

``setErrorsInForm($form, $resForm)``
   Applies validation error markup from a response form fragment.

``checkIfParamNumberBoolOrString(value, controller = null)``
   Converts serialized DOM values into typed JavaScript values.

``controllerFactory(parentController, $element, tagName, superTagNameList)``
   Creates a controller instance for a registered tag.

``runControlFlowFunctions(controller, process)``
   Runs ``onLoad()``, child rendering, ``willShow()``, and refresh.

``socketReconnect``
   Alias of the server-call ``close()`` function.

``test_utils``
   Test helpers: ``get_controller()``, ``getCsrfToken()``,
   ``controllerFromTestHtml()``.

``app`` reference
-----------------

Bootstrap and registration
^^^^^^^^^^^^^^^^^^^^^^^^^^

``app.init_sdc()``
   Initializes the runtime, scans the DOM, and instantiates registered
   controllers.

``app.register(Controller, overwrite = false)``
   Registers a controller class and returns an object with ``addMixin(...)``.

``app.registerGlobal(Controller)``
   Registers a controller and marks it as global.

``app.controllerToTag(Controller)``
   Converts a controller class name to a tag name.

DOM and controller helpers
^^^^^^^^^^^^^^^^^^^^^^^^^^

``app.getController($elem)``
   Returns the controller bound to a DOM node or its closest controller parent.

``app.refresh($dom, leafController = null)``
   Refreshes the controller subtree rooted at the given node.

``app.reloadController(controller)``
   Reloads controller HTML from ``contentUrl`` and reconciles it into place.

``app.reconcile(controller, $virtualNode, $realNode = null, process = null)``
   Runs refresh and DOM reconciliation for a controller.

``app.cleanCache()``
   Clears cached HTML fragments loaded from controller ``contentUrl`` values.

``app.updateJquery()``
   Installs ``safeReplace()``, ``safeEmpty()``, and ``safeRemove()`` on jQuery.

Safe DOM operations
^^^^^^^^^^^^^^^^^^^

``app.safeRemove($elem)``
   Removes DOM nodes after cleanly removing any controllers contained in them.

``app.safeEmpty($elem)``
   Safely removes all children of a container.

``app.safeReplace($elem, $new)``
   Inserts ``$new`` before ``$elem`` and safely removes ``$elem``.

HTTP and form helpers
^^^^^^^^^^^^^^^^^^^^^

``app.get(controller, url, args)``
   GET request wrapper that refreshes the controller on success.

``app.post(controller, url, args)``
   POST request wrapper that refreshes the controller on success.

``app.ajax(controller, url, args, method)``
   Shared transport wrapper for ``get`` and ``post``.

``app.submitFormAndUpdateView(controller, form, url, method)``
   Submits a form, then refreshes the controller when successful.

``app.submitForm(form, url, method)``
   Submits a form without a controller refresh step.

``AbstractSDC`` reference
-------------------------

Tree and DOM
^^^^^^^^^^^^

``find(selector)``
   Shortcut for ``this.$container.find(selector)``.

``refresh()``
   Refreshes the controller subtree.

``reload()``
   Reloads controller HTML from the backend.

``reconcile($virtualNode, $realNode = null)``
   Reconciles virtual HTML into the controller's real DOM.

``iterateAllChildren()``
   Recursively returns all descendant controllers.

Lifecycle
^^^^^^^^^

``onInit(...args)``
``onLoad(html)``
``willShow()``
``onRefresh(originController)``
``onRemove()``

Networking and models
^^^^^^^^^^^^^^^^^^^^^

``get(url, args)``
``post(url, args)``
``submitForm(form, url, method)``
``serverCall(methodName, args)``
``querySet(modelName, modelQuery = {})``
``noOpenModelRequests()``

Forms
^^^^^

``submitModelFormDistributor($form, event)``
``defaultSubmitModelForm($form, event)``

``SdcQuerySet`` reference
-------------------------

Collection API
^^^^^^^^^^^^^^

``length``
``[index]``
``[Symbol.iterator]()``
``getIds()``
``setIds(ids)``
``byId(id)``
``new()``

Query and transport
^^^^^^^^^^^^^^^^^^^

``setFilter(modelQuery)``
``addFilter(modelQuery)``
``load(modelQuery = null)``
``update({ modelQuery = null, item = null })``
``get(modelQuery = null)``
``delete({ pk = null, elem = null })``
``save({ pk = null, formName = "edit_form", data = null })``
``create({ elem, data = null })``
``isConnected()``
``close()``
``noOpenRequests()``

View rendering
^^^^^^^^^^^^^^

``view({ viewName = "html_list_template", modelQuery = {}, cbResolve = null,
cbReject = null, templateContext = {}, eventType = "named_view" })``

``listView({ modelQuery = {}, cbResolve = null, cbReject = null,
templateContext = {} })``

``detailView({ pk, cbResolve = null, cbReject = null, templateContext = {} })``

Test utilities
--------------

``getCsrfToken()``
   Reads the ``csrftoken`` cookie in test environments.

``get_controller(tag_name, init_arguments = {}, origen_html = "")``
   Creates a controller through the normal SDC lifecycle in a JSDOM test.

``controllerFromTestHtml(html, afterLifecycle = null)``
   Bootstraps controllers from arbitrary test HTML and returns the resulting
   controller list.

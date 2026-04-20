Controllers
===========

Base class
----------

All controllers extend ``AbstractSDC``.

Common properties
-----------------

``contentUrl``
   Backend URL used to load the controller's HTML fragment.

``contentReload``
   If ``true``, the content is always reloaded instead of using the cached
   HTML fragment.

``events``
   List of event definition objects merged into one event map.

``load_async``
   If ``true``, the controller lifecycle does not block parent initialization.

``$container``
   jQuery wrapper for the DOM element associated with the controller.

``parentController`` / ``childController``
   Accessors for the controller tree.

Lifecycle
---------

``onInit(...args)``
   Runs immediately after the controller is created. Arguments are resolved
   from DOM ``data-*`` attributes.

``onLoad(html)``
   Runs after the controller HTML has been fetched but before child controller
   tags are replaced. This is a common place to mutate the loaded fragment.

``willShow()``
   Runs after child controller content has been prepared and before refresh.

``onRefresh(originController)``
   Runs after DOM updates and event wiring are complete.

``onRemove()``
   Runs when the controller is being removed. Return ``false`` to block
   removal.

Example lifecycle
-----------------

.. code-block:: javascript

   class ProductList extends AbstractSDC {
     constructor() {
       super();
       this.contentUrl = "/sdc_view/shop/product-list/";
     }

     onInit(categoryId) {
       this.categoryId = categoryId;
     }

     onLoad(html) {
       $(html).find(".title").text(`Category ${this.categoryId}`);
       return super.onLoad(html);
     }

     willShow() {
       this.loadedAt = Date.now();
     }

     onRefresh() {
       console.log("ProductList refreshed");
     }
   }

DOM events
----------

Controller events are delegated through the document window and stored as
``sdc_<event-name>`` attributes on matching elements.

Example:

.. code-block:: javascript

   class TodoList extends AbstractSDC {
     constructor() {
       super();
       this.events.unshift({
         click: {
           ".add-button": "addItem",
           ".delete-button": "deleteItem",
         },
         submit: {
           "form": "saveForm",
         },
       });
     }

     addItem($element, event) {}
     deleteItem($element, event) {}
     saveForm($element, event) {}
   }

The handler receives:

- the matched jQuery element
- the original browser event

You can also register events at runtime with ``addEvent(event, selector,
handler)``.

Mixins
------

Controllers can aggregate other registered controller classes as mixins.

.. code-block:: javascript

   app.register(BaseList);
   app.register(Sortable);
   app.register(Filterable);

   app.register(ProductList)
     .addMixin(Sortable, Filterable);

Mixin methods and event definitions are merged into the controller instance.
Lifecycle methods on mixins are invoked through ``AbstractSDC._runLifecycle()``.

Refresh, reload, and reconciliation
-----------------------------------

``refresh()``
   Re-runs nested controller replacement and handler-bound ``<this.*>`` DOM
   fragments inside the controller container.

``reload()``
   Reloads the controller HTML from ``contentUrl`` and reconciles it into the
   existing DOM tree.

``reconcile($virtualNode, $realNode = null)``
   Diffs the virtual and real DOM trees and preserves matching elements where
   possible. This is used to keep elements such as form inputs stable across
   updates.

Safe DOM helpers
----------------

The runtime installs jQuery helpers:

- ``$elem.safeReplace($new)``
- ``$elem.safeEmpty()``
- ``$elem.safeRemove()``

These helpers call controller removal logic before modifying the DOM so child
controllers can clean up sockets, events, and internal state.

Rendering dynamic fragments with ``sdcDom`` and ``<this.*>``
------------------------------------------------------------

The global ``window.sdcDom()`` helper creates DOM fragments compatible with
the controller refresh pipeline.

When the tag name is a function, the runtime creates a ``<this.functionName>``
placeholder that is rebound during refresh.

This enables patterns like:

.. code-block:: javascript

   class Demo extends AbstractSDC {
     onLoad(html) {
       $(html).append("<this.listview></this.listview>");
       return super.onLoad(html);
     }

     listview() {
       return "<div>Dynamic content</div>";
     }
   }

During ``refresh()``, the runtime resolves these placeholders by calling the
matching controller method and reconciling the result into the current DOM.

Backend method calls
--------------------

Use ``serverCall(methodName, args)`` to invoke a backend controller method.

.. code-block:: javascript

   class InvoiceEditor extends AbstractSDC {
     approve() {
       return this.serverCall("approve", { approved: true });
     }
   }

``serverCall()`` uses:

- AJAX if ``window.SERVER_CALL_VIA_WEB_SOCKET`` is falsy
- WebSockets if it is truthy

For ``serverCall()`` to work, ``contentUrl`` must contain an ``sdc_view/<app>/``
segment so the client can infer the backend app name.

Model-aware forms
-----------------

``AbstractSDC`` includes a default model form submit pipeline.

``submitModelFormDistributor($form, event)``
   Dispatches to ``_submitModelForm()``, ``submitModelForm()``, or
   ``defaultSubmitModelForm()``.

``defaultSubmitModelForm($form, event)``
   Reads the model from form metadata, submits ``save()`` or ``create()``,
   clears validation errors on success, and reconciles returned error HTML on
   failure.

Controllers and their descendants can react to the result through:

- ``submit_model_form_success(result)``
- ``submit_model_form_error(errorData)``

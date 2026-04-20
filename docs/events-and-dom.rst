Events and DOM
==============

Application event bus
---------------------

SimpleDomControlClient includes a small application-level event bus in addition
to browser DOM events.

Exports:

- ``setEvent(name, functionName = name)``
- ``on(name, controller)``
- ``trigger(name, ...args)``
- ``allOff(controller)``

Usage:

.. code-block:: javascript

   import { setEvent, on, trigger } from "sdc_client";

   setEvent("pushMsg", "handleMessage");

   class Toasts {
     handleMessage(title, message) {
       console.log(title, message);
     }
   }

   const toasts = new Toasts();
   on("pushMsg", toasts);
   trigger("pushMsg", "Saved", "The item was stored.");

The server transport uses this event bus to emit:

- ``pushMsg`` for non-error messages
- ``pushErrorMsg`` for error messages
- ``onNavLink`` for redirects

DOM event delegation
--------------------

The DOM event system listens on ``window`` for standard browser events and
dispatches them to controller handlers declared on matching elements.

The pipeline works as follows:

1. ``initEvents()`` subscribes to standard browser events.
2. When jQuery triggers a previously unseen custom event, the runtime adds it
   to the watched event list automatically.
3. ``windowEventHandler()`` walks from the event target upward through the DOM.
4. For each element with a matching ``sdc_<event>`` attribute, the handler
   resolves the owning controller.
5. The handler name is matched either directly on the controller or through the
   controller event map.

Declarative event attributes
----------------------------

Elements can carry event attributes directly:

.. code-block:: html

   <button sdc_click="save">Save</button>

If ``save`` exists on the current controller, it will be called with:

- ``$element``: the matched jQuery element
- ``event``: the native event object

Controller event maps
---------------------

A more maintainable pattern is to define events in the controller:

.. code-block:: javascript

   this.events.unshift({
     click: {
       ".save-button": "save",
       ".delete-button": "removeItem",
     },
   });

At refresh time, ``setControllerEvents()`` finds the matching selectors and
adds internal ``sdc_<event>`` attributes to the corresponding DOM nodes.

DOM reconciliation
------------------

The client contains a custom reconciliation step used by ``app.reconcile()``
and controller refresh operations.

Goals of reconciliation:

- keep matching DOM branches when possible
- update attributes and data bindings
- preserve stable nodes such as input elements
- remove and insert only what changed

The implementation builds trees for the virtual and real DOM, computes a
longest-common-branch style diff, then applies keep, delete, and insert
operations in index order.

This is the main reason refreshed content can preserve existing input elements
instead of replacing them outright.

Safe removal semantics
----------------------

Always prefer the SDC-safe helpers over direct jQuery removal when a subtree may
contain controllers:

- ``app.safeRemove($elem)``
- ``app.safeEmpty($elem)``
- ``app.safeReplace($elem, $new)``

These helpers call controller ``remove()`` methods first so child controllers
can unregister application events, close sockets, and clean up forms.

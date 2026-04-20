Getting Started
===============

Requirements
------------

SimpleDomControlClient is designed to be used together with the Django package
``simpledomcontrol``. The backend is expected to provide:

- Controller content endpoints referenced by ``contentUrl``.
- Optional server controller methods for ``serverCall()``.
- Model WebSocket endpoints for ``SdcQuerySet`` and ``SdcModel`` usage.
- Global values such as ``window.CSRF_TOKEN`` and optionally
  ``window.SERVER_CALL_VIA_WEB_SOCKET``.

Installation
------------

Install the package in a frontend project:

.. code-block:: bash

   yarn add sdc_client

or:

.. code-block:: bash

   npm install sdc_client

Basic bootstrap
---------------

Import the runtime, define a controller, register it, and call ``init_sdc()``.

.. code-block:: javascript

   import { app, AbstractSDC } from "sdc_client";

   class HelloWorld extends AbstractSDC {
     constructor() {
       super();
       this.contentUrl = "/sdc_view/demo/hello-world/";
       this.events.unshift({
         click: {
           ".reload-button": "handleReload",
         },
       });
     }

     onInit(name = "World") {
       this.name = name;
     }

     handleReload() {
       return this.reload();
     }
   }

   app.register(HelloWorld);
   app.init_sdc();

In the HTML:

.. code-block:: html

   <hello-world data-name='"Ada"'></hello-world>

Tag name mapping
----------------

Controller classes are mapped to tag names automatically.

- ``HelloWorld`` becomes ``<hello-world>``.
- A class ending in ``Controller`` has the suffix removed.
- ``UserListController`` becomes ``<user-list>``.

The mapping is implemented by ``app.controllerToTag()``.

Controller content loading
--------------------------

If a controller sets ``contentUrl``, the runtime fetches HTML for that
controller before rendering nested child controllers.

Important behavior:

- ``contentUrl = ""`` means no remote HTML is fetched.
- URLs containing placeholder values such as ``"%(user_id)s"`` are re-parsed
  from DOM data attributes and force ``contentReload = true``.
- Responses are cached per controller tag unless ``contentReload`` is true.

Using ``data-*`` parameters
---------------------------

``onInit()`` arguments are populated from the DOM element's ``data-*``
attributes. The final argument is always an object with the remaining data
values.

Example:

.. code-block:: html

   <user-card
     data-user-id="7"
     data-title='"Admin"'
     data-active="true">
   </user-card>

.. code-block:: javascript

   class UserCard extends AbstractSDC {
     onInit(userId, title, active, rest) {
       this.userId = userId;   // 7
       this.title = title;     // "Admin"
       this.active = active;   // true
       this.rest = rest;       // remaining data attributes
     }
   }

The parameter parser converts:

- integers to ``number``
- floats to ``number``
- ``true`` and ``false`` to ``boolean``
- ``none`` to ``null``
- ``undefined`` to ``undefined``
- quoted strings to plain strings
- controller property names to the corresponding controller value or method

Global controllers
------------------

Register a controller as global when it should be instantiated once and exposed
 through the global controller tree rather than repeated per matching DOM
container.

.. code-block:: javascript

   app.registerGlobal(NotificationsController);

Global controllers are created during ``app.init_sdc()`` before regular body
controllers are resolved.

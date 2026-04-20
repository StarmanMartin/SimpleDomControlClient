Overview
========

What the project does
---------------------

SimpleDomControlClient provides a lightweight component system built around
custom HTML tags and controller classes.

The client is responsible for:

- Registering controller classes against tag names such as ``<user-list>``.
- Finding those tags in the DOM and instantiating controller objects.
- Loading controller HTML from the backend through ``contentUrl``.
- Running controller lifecycle hooks such as ``onInit()``, ``onLoad()``,
  ``willShow()``, and ``onRefresh()``.
- Delegating browser events to controller methods.
- Refreshing and reconciling DOM updates without discarding matching existing
  elements.
- Calling backend controller methods through AJAX or WebSockets.
- Loading and saving server-backed model data through ``SdcQuerySet`` and
  ``SdcModel``.

Architecture at a glance
------------------------

The main exported building blocks are:

``app``
   Global runtime object. It boots the library, registers controllers,
   refreshes content, and exposes DOM-safe helper methods.

``AbstractSDC``
   Base class for all controllers. It provides lifecycle hooks, parent/child
   relationships, event configuration, server calls, and model/query helpers.

``SdcQuerySet`` and ``SdcModel``
   Client-side model abstractions used to query, create, update, delete, and
   render model-backed content.

``on()``, ``trigger()``, ``allOff()``, ``setEvent()``
   A small application event bus separate from browser DOM events.

Runtime flow
------------

At startup, ``app.init_sdc()`` performs the following steps:

1. Initializes DOM event delegation.
2. Ensures the transport layer is ready when server calls use WebSockets.
3. Builds root controllers for the page body and global controllers.
4. Scans the DOM for all registered controller tags.
5. Creates controller instances and binds them to their DOM containers.
6. Resolves tag parameters from ``data-*`` attributes and calls ``onInit()``.
7. Loads controller HTML from the backend when ``contentUrl`` is defined.
8. Replaces nested registered tags recursively.
9. Wires configured DOM events and triggers ``onRefresh()``.

How this differs from common SPA frameworks
-------------------------------------------

SimpleDomControlClient is not a virtual-DOM-first SPA framework. The server
still produces much of the HTML, and controllers are thin client-side objects
that coordinate DOM behavior around that HTML. The library keeps enough client
state to support dynamic updates, forms, and model synchronization without
requiring a full frontend build architecture.

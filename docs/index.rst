SimpleDomControlClient
======================

SimpleDomControlClient is the browser-side runtime for the Django package
``simpledomcontrol``. It scans the DOM for registered custom tags, creates
controller instances, loads HTML fragments from the server, binds DOM events,
and synchronizes model data through AJAX and WebSockets.

This documentation is organized around the way the library is used in a real
application: bootstrap the runtime, register controllers, render content,
handle events, and talk to server-backed models.

.. toctree::
   :maxdepth: 2
   :caption: Contents

   overview
   getting-started
   controllers
   models
   events-and-dom
   api-reference

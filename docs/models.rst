Models
======

Overview
--------

Model support in SimpleDomControlClient is centered on two pieces:

``SdcModel``
   A client-side object representing one backend record.

``SdcQuerySet``
   A live collection wrapper that loads, updates, saves, deletes, and renders
   model-backed content over the SDC model transport.

The client expects the backend to expose the SDC model WebSocket protocol for:

- connect handshakes
- queryset loading
- item updates
- item creation
- deletion
- server-rendered views
- server-rendered forms
- chunked file uploads

Registering model classes
-------------------------

Model classes must be registered by name so queryset responses can be turned
into the correct JavaScript class.

.. code-block:: javascript

   import { registerModel } from "sdc_client";
   import Author from "./models/Author.js";
   import Book from "./models/Book.js";

   registerModel("Author", Author);
   registerModel("Book", Book);

The registry is global. Once a class is registered, any queryset for that model
name can construct typed instances.

How controllers use models
--------------------------

Controllers usually create querysets through ``AbstractSDC.querySet()``:

.. code-block:: javascript

   class AuthorList extends AbstractSDC {
     onInit() {
       this.authors = this.querySet("Author", { active: true });
     }

     async onLoad(html) {
       await this.authors.load();
       return super.onLoad(html);
     }
   }

This attaches the queryset to the controller so open sockets can be tracked and
closed when the controller is removed.

``SdcQuerySet`` as a collection
-------------------------------

``SdcQuerySet`` behaves like an array-like collection through a proxy.

You can:

- read ``queryset.length``
- access ``queryset[0]``
- iterate with ``for (const item of queryset)``
- call ``queryset.getIds()`` to get the current primary keys
- call ``queryset.byId(id)`` to look up a loaded instance

Example:

.. code-block:: javascript

   await this.authors.load();

   for (const author of this.authors) {
     console.log(author.id, author.name);
   }

   const ada = this.authors.byId(1);

Loading and refreshing data
---------------------------

There are two important ways to fetch queryset data:

``load(modelQuery = null)``
   Clears the current queryset cache and fetches matching rows from the server.
   Use this when you want a fresh dataset and do not need to preserve the
   current ``valuesList`` content.

``update({ modelQuery = null, item = null })``
   Refreshes server state as an alternative to ``load()``. Use this when the
   queryset already exists and should be synchronized again. It can refresh:

   - the active queryset filter
   - a replacement filter passed through ``modelQuery``
   - one specific item when ``item`` is provided

Typical guidance:

- use ``load()`` for the initial fetch
- use ``update()`` when the queryset already exists and you want to re-sync it
- use ``update({ item })`` when one known model may have changed and only that
  record needs to be refreshed

Example:

.. code-block:: javascript

   await this.authors.load({ active: true });

   // Later, refresh the same queryset
   await this.authors.update({});

   // Refresh a specific item only
   await this.authors.update({ item: this.authors.byId(1) });

Filtering and identity helpers
------------------------------

``setFilter(modelQuery)``
   Replaces the queryset filter.

``addFilter(modelQuery)``
   Merges additional constraints into the current filter.

``setIds(ids)``
   Rebuilds the queryset from ids, another queryset, a single model, or a list
   of ids. This is mainly useful for relation fields and client-side relation
   synchronization.

``get(modelQuery = null)``
   Loads and returns exactly one item. It throws when the result count is not
   exactly one.

Creating and saving models
--------------------------

``new()``
   Creates a new empty registered model instance, binds it to the queryset, and
   appends it to ``valuesList``.

``save({ pk = null, formName = "edit_form", data = null })``
   Saves one or more existing models. If ``pk`` is given, the queryset saves
   that one item. Otherwise it saves the current queryset items. If ``data`` is
   omitted, the client uses the model's ``serialize()`` output.

``create({ elem, data = null })``
   Creates a new backend record. If ``data`` is omitted, the payload is taken
   from the model instance serialization.

``delete({ pk = null, elem = null })``
   Deletes a record by primary key or by model object.

Example:

.. code-block:: javascript

   const author = this.authors.new();
   author.name = "Ada Lovelace";
   author.age = 36;

   await this.authors.create({ elem: author });

   author.age = 37;
   await this.authors.save({ pk: author.id });

Server-rendered model views
---------------------------

``SdcQuerySet`` can request server-rendered HTML and return it as a container
that is automatically passed through ``app.refresh()`` when the response
arrives.

Available methods:

``view({ viewName, modelQuery, cbResolve, cbReject, templateContext, eventType })``
   Generic named view renderer.

``listView({ modelQuery, cbResolve, cbReject, templateContext })``
   Convenience wrapper for list-style rendering.

``detailView({ pk, cbResolve, cbReject, templateContext })``
   Convenience wrapper for a single object detail view.

Example:

.. code-block:: javascript

   const $list = this.authors.listView({
     modelQuery: { active: true },
     templateContext: { compact: true },
   });

   this.$container.find(".results").append($list);

Form synchronization and ``SdcModel`` state
-------------------------------------------

The most important rule for model forms is this:

``SdcModel`` properties and form fields are expected to stay synchronized.

The form is not treated as an independent data store. It is a view of the
model object.

That synchronization happens in both directions:

``syncModelToForm($form)``
   Copies model properties into the form.

``syncForm($form)``
   Reads values from the form back into the ``SdcModel`` object and returns the
   data used for submission.

This behavior matters because the default controller submit flow operates on the
model instance associated with the form, not on a detached raw payload.

Practical consequences:

- when model properties change, the form should be updated from the model
- when the user edits the form, the model should be updated from the form
- hidden fields are parsed back into typed JavaScript values
- file inputs become ``File`` objects on the model
- relation fields are converted into related ids or queryset-backed relations

The model object therefore remains the source of truth across:

- initial form rendering
- edits
- create calls
- save calls
- validation error flows
- later refreshes of the same object

How queryset form rendering works
---------------------------------

The internal queryset form helper fetches server-rendered create or edit forms
and attaches the metadata expected by controller form submission.

When a form is prepared, the client:

- renders the returned HTML into the target container
- marks the form as create or edit
- stores ``data("model", modelObj)``
- stores ``data("model_pk", pk)``
- stores ``data("form_name", formName)``
- adds ``sdc_submit="submitModelFormDistributor"`` if missing
- registers the form on the model via ``addForm($form)``

This is why ``AbstractSDC.defaultSubmitModelForm()`` can read the bound model
from the form and choose between ``create()`` and ``save()`` automatically.

Validation errors and model-backed forms
----------------------------------------

On submit failure, the controller default form handler reconciles returned form
HTML back into the existing DOM rather than replacing the entire subtree
blindly.

That allows the application to:

- keep the controller tree intact
- preserve more stable DOM nodes where possible
- show backend validation errors in the rendered form
- continue working with the same underlying ``SdcModel`` instance

Even when the error HTML changes, the client-side model object still represents
the active record being edited.

Relationships
-------------

The test suite shows two important serialization conventions:

- many-to-one relations are serialized as a single related primary key
- one-to-many relations are serialized as a list of related primary keys

This lets model instances expose richer client-side relation objects while
sending backend-friendly payloads.

Expected ``SdcModel`` capabilities
----------------------------------

The client code and tests imply that registered model classes should provide at
least the following behavior:

- scalar field properties such as ``id``, ``name``, ``title``, and similar
- relation fields that can accept ids and queryset/model objects
- ``serialize()`` for backend payload generation
- ``syncModelToForm($form)`` for writing model state into form fields
- ``syncForm($form)`` for reading form fields back into model state
- ``addForm($form)`` for tracking rendered forms
- queryset linkage so save/create operations know where the model belongs

Connection lifecycle
--------------------

Each queryset manages its own WebSocket connection state.

Important methods and callbacks:

``isConnected()``
   Ensures the socket is open and the backend handshake has completed.

``close()``
   Closes the queryset socket and disables automatic reconnect.

``noOpenRequests()``
   Resolves when all currently tracked socket requests have completed.

``onUpdate``
   Callback invoked when the server pushes an update event.

``onCreate``
   Callback invoked when the server pushes a create event.

File uploads
------------

If a model contains ``File`` values, the queryset uploads them in chunks before
issuing the final ``save()`` or ``create()`` request.

This process is automatic:

- file properties are detected on the model object
- the file is split into chunks
- upload metadata is sent with each chunk
- the final save/create payload references the uploaded file data

Summary
-------

Use the model layer when you need more than static controller HTML:

- ``load()`` for initial queryset fetches
- ``update()`` for re-synchronizing existing queryset state
- ``new()``, ``create()``, ``save()``, and ``delete()`` for persistence
- ``listView()`` and ``detailView()`` for server-rendered model fragments
- synchronized forms where the ``SdcModel`` object remains the source of truth

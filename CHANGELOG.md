# Changelog

## 0.159.0

### Added
- `datetime-local` and `date` form inputs are synced with model `DateTimeField` / `DateField` values.
- `SdcQuerySet.create(data)` and `SdcModel.create(data)` accept the data object directly, in addition to `create({ elem, data })` / `create({ data })`.
- `test_utils.login(user)` / `test_utils.logout()` switch the `sessionid` cookie using the session ids in the global `SDC_TEST_USER`.

### Changed (breaking)
- `DateField` and `DateTimeField` values are now `Date` objects instead of numeric timestamps. Empty or invalid values become `null`. Date-only strings (`YYYY-MM-DD`) are read as local dates.
- When a model is serialized, `DateField` values are sent as `YYYY-MM-DD` and `DateTimeField` values as ISO 8601 strings.
- `jquery` and `lodash` are now peer dependencies. They have always been used as the globals `$` and `_`. `bootstrap`, `@popperjs/core` and `esm` are no longer dependencies. Projects created with `sdc_init` already install all of them.
- `gulp` is now a peer dependency. The build helpers used by `sdc_client/gulp/gulp.jsx` (`gulp-sass`, `sass`, `gulp-exec`, `dotenv`, `through2`) are now regular dependencies.

### Fixed
- `childController` / `iterateAllChildren()` are rebuilt correctly after `reload()`, `reconcile()` and
  `<this.*>` renders (they were emptied), so `submit_model_form_success/error` reach child controllers.
- `app.get()` / `app.post()` follow `send_redirect()` responses (HTTP 301) instead of rejecting.
- `msg` / `header` in a server-call return value show a message over WebSocket as well as over HTTP.
- Reconcile moves `sdcDom` (JSX) `on*` listeners to the DOM node it keeps, so handlers are not stale.
- Calling `app.init_sdc()` again no longer re-creates the global controllers.
- `app.registerGlobal()` returns `{addMixin}` like `app.register()`.
- `getEvents()` no longer changes event maps shared between controller instances.
- `serverCall()` arguments that are not an object are passed as `arg0` (the check never worked);
  the error for a `contentUrl` without `sdc_view/<app>` names the controller tag.
- Model form submit passes the create response to `submit_model_form_success` (was `undefined`).
- `SdcModel.querySet()` (static) uses the model name (typo `modeName`).
- `TextField`, `SlugField` and all integer field types (incl. `BigAutoField`) are converted and validated.
- `JSONField` accepts JSON strings; `FileField` size/type limits are enforced by `validate()` instead of
  storing an error string as value.
- Deletes: querysets handle the new `on_delete` event (rows are removed; `onDelete`, falling back to
  `onUpdate`, is called), and `delete()` removes the item locally.
- The automatic reconnect of a model socket repeats the `connect` handshake, so live updates continue.
- `setIds()` with a model or queryset works (was `DataCloneError`) and keeps models that are already in the
  queryset, so references to related models stay valid.
- `listView()` responses fill the queryset like `load()`.
- `syncModelToForm()` fills create forms; `syncForm()` and live form edits no longer throw on invalid
  values; edits in one form are shown in the other forms of the model.

### Removed
- The build no longer injects `_on_init_params` into controllers, and `this.params` no longer requires an
  `onInit()` method. `onInit()` is deprecated (it has not been called since 0.158.7).

### Internal
- Switched to Yarn 4 with the `node-modules` linker.
- The published package contains only `dist/`, `src/`, `gulp/`, `README.md` and `CHANGELOG.md`.

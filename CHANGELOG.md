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

### Internal
- Switched to Yarn 4 with the `node-modules` linker.
- The published package contains only `dist/`, `src/`, `README.md` and `CHANGELOG.md`.

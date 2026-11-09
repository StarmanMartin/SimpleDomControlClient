'use strict';
/**
 * Dependency check of an SDC project build (gulp task ``sdc_check_dependencies``).
 *
 * SDC apps installed with pip are linked as ``Assets/libs/<app>`` -> ``<app>/Assets/bin/<app>``. Their bundle
 * keeps the npm packages listed in ``<app>/Assets/sdc_app.json`` (``peerDependencies``) as imports, so the project
 * must install them. The check
 *
 * - adds packages an app needs and the project's package.json lacks (with the app's range),
 * - reports packages whose range in the project cannot satisfy the app (package.json is not changed),
 * - reports packages that are declared but not installed (or installed in a version outside the app's range),
 *
 * and fails in all these cases, so the build stops until the developer ran ``npm install`` / ``yarn install``.
 */
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const DEPENDENCY_KEYS = ['dependencies', 'devDependencies'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * The manifests of the SDC apps linked into ``Assets/libs``.
 *
 * @param {string} projectRoot - directory of the project's package.json
 * @return {Array<{app: string, file: string, peers: Object<string, string>}>}
 */
function appManifests(projectRoot) {
  const libs = path.join(projectRoot, 'Assets', 'libs');
  if (!fs.existsSync(libs)) {
    return [];
  }
  const result = [];
  for (const entry of fs.readdirSync(libs).sort()) {
    let real;
    try {
      real = fs.realpathSync(path.join(libs, entry));
      if (!fs.statSync(real).isDirectory()) {
        continue;
      }
    } catch {
      continue;  // a broken link
    }
    // Assets/libs/<app> -> <app>/Assets/bin/<app>; the manifest is <app>/Assets/sdc_app.json
    const file = path.join(real, '..', '..', 'sdc_app.json');
    if (fs.existsSync(file)) {
      result.push({app: entry, file, peers: readJson(file).peerDependencies || {}});
    }
  }
  return result;
}

/** True if both ranges can be satisfied by one version (invalid ranges, e.g. git URLs, are accepted). */
function compatible(a, b) {
  if (!semver.validRange(a) || !semver.validRange(b)) {
    return true;
  }
  return semver.intersects(a, b);
}

/** The installed version of ``name`` in the project's node_modules, or null. */
function installedVersion(projectRoot, name) {
  try {
    return readJson(path.join(projectRoot, 'node_modules', name, 'package.json')).version || null;
  } catch {
    return null;
  }
}

/**
 * Checks the project against the apps' peerDependencies; adds missing packages to its package.json.
 *
 * @param {string} projectRoot - directory of the project's package.json
 * @return {{added: Array<string>, conflicts: Array<string>, missing: Array<string>}} what was added and what
 * is wrong; the check passed if all lists are empty
 */
function checkDependencies(projectRoot) {
  const packageFile = path.join(projectRoot, 'package.json');
  const project = readJson(packageFile);
  const declared = Object.assign({}, ...DEPENDENCY_KEYS.map((key) => project[key] || {}));
  const added = [];
  const conflicts = [];
  const missing = [];
  // name -> [{app, range}] of the apps that need it
  const needed = {};
  for (const {app, peers} of appManifests(projectRoot)) {
    for (const [name, range] of Object.entries(peers)) {
      (needed[name] = needed[name] || []).push({app, range});
    }
  }
  for (const [name, users] of Object.entries(needed)) {
    const describe = users.map((u) => `${u.app} needs ${u.range}`).join(', ');
    // Several apps: their ranges must have a common version
    const clash = users.some((u, i) => users.slice(i + 1).some((v) => !compatible(u.range, v.range)));
    if (clash) {
      conflicts.push(`${name}: the apps need incompatible versions (${describe})`);
      continue;
    }
    if (!(name in declared)) {
      project.dependencies = project.dependencies || {};
      project.dependencies[name] = users[0].range;
      declared[name] = users[0].range;
      added.push(`${name}@${users[0].range} (${describe})`);
      continue;
    }
    const wrong = users.filter((u) => !compatible(declared[name], u.range));
    if (wrong.length) {
      conflicts.push(`${name}: the project has ${declared[name]}, but ${describe}`);
      continue;
    }
    const version = installedVersion(projectRoot, name);
    const outside = version && users.find((u) => semver.validRange(u.range) && semver.valid(version)
      && !semver.satisfies(version, u.range, {includePrerelease: true}));
    if (!version) {
      missing.push(`${name} is not installed (${describe})`);
    } else if (outside) {
      missing.push(`${name} ${version} is installed, but ${describe}`);
    }
  }
  if (added.length) {
    const indent = (fs.readFileSync(packageFile, 'utf8').match(/^[ \t]+(?=")/m) || ['  '])[0];
    fs.writeFileSync(packageFile, JSON.stringify(project, null, indent) + '\n');
  }
  return {added, conflicts, missing};
}

/** The install command of the project (from its lock file). */
function installCommand(projectRoot) {
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    return 'yarn install';
  }
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm install';
  }
  return 'npm install';
}

/** The error message of a failed check, or null if it passed. */
function checkMessage(result, projectRoot) {
  const lines = [];
  if (result.conflicts.length) {
    lines.push('SDC apps need npm package versions that package.json does not allow. Change the ranges in '
      + 'package.json (or update the apps):', ...result.conflicts.map((c) => `  - ${c}`));
  }
  if (result.added.length) {
    lines.push('Added to package.json for the installed SDC apps:', ...result.added.map((a) => `  - ${a}`));
  }
  if (result.missing.length) {
    lines.push('Not installed:', ...result.missing.map((m) => `  - ${m}`));
  }
  if (!lines.length) {
    return null;
  }
  if (result.added.length || result.missing.length) {
    lines.push(`Run "${installCommand(projectRoot)}" and build again.`);
  }
  return lines.join('\n');
}

/**
 * Gulp task: runs the check in the project (the parent of the gulpfile's ``Assets`` directory) and fails the
 * build if it did not pass.
 */
function check_dependencies(cb) {
  const projectRoot = path.resolve(process.cwd(), '..');
  let message;
  try {
    message = checkMessage(checkDependencies(projectRoot), projectRoot);
  } catch (e) {
    return cb(new Error(`The dependency check of the SDC apps failed: ${e.message}`));
  }
  if (message) {
    console.error(message);
    const error = new Error('The npm dependencies of the SDC apps are not installed (see above).');
    error.showStack = false;
    return cb(error);
  }
  cb();
}

module.exports = {appManifests, checkDependencies, checkMessage, check_dependencies};

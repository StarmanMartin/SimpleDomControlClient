
import {createRequire} from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';

const require = createRequire(import.meta.url);
const {appManifests, checkDependencies, checkMessage} = require('../gulp/check_dependencies.cjs');

const write = (file, data) => {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
};

/**
 * A project with ``deps`` in its package.json, the ``installed`` packages in node_modules and one pip-like app
 * per entry of ``apps`` ({name: peerDependencies}), linked as Assets/libs/<app> -> <app>/Assets/bin/<app>.
 */
const roots = [];
afterAll(() => roots.forEach((root) => fs.rmSync(root, {recursive: true, force: true})));

function project({deps = {}, devDeps = {}, installed = {}, apps = {}, lock = null}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdc-deps-'));
    roots.push(root);
    const site = path.join(root, 'site-packages');
    write(path.join(root, 'project', 'package.json'), {name: 'p', dependencies: deps, devDependencies: devDeps});
    for (const [name, version] of Object.entries(installed)) {
        write(path.join(root, 'project', 'node_modules', name, 'package.json'), {name, version});
    }
    for (const [app, peers] of Object.entries(apps)) {
        write(path.join(site, app, 'Assets', 'bin', app, `${app}.organizer.js`), '');
        if (peers) {
            write(path.join(site, app, 'Assets', 'sdc_app.json'), {peerDependencies: peers});
        }
        fs.mkdirSync(path.join(root, 'project', 'Assets', 'libs'), {recursive: true});
        fs.symlinkSync(path.join(site, app, 'Assets', 'bin', app), path.join(root, 'project', 'Assets', 'libs', app));
    }
    if (lock) {
        write(path.join(root, 'project', lock), '');
    }
    return path.join(root, 'project');
}

const packageJson = (root) => JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

describe('check_dependencies', () => {
    test('installed and compatible packages pass; apps without a manifest are skipped', () => {
        const root = project({
            deps: {sdc_client: '^0.161.0'}, devDeps: {jquery: '^3.7.0'},
            installed: {sdc_client: '0.161.2', jquery: '3.7.1'},
            apps: {charts: {sdc_client: '^0.161.0', jquery: '^3.6.0'}, plain: null},
        });
        expect(appManifests(root).map((m) => m.app)).toEqual(['charts']);
        const result = checkDependencies(root);
        expect(result).toEqual({added: [], conflicts: [], missing: []});
        expect(checkMessage(result, root)).toBeNull();
    });

    test('missing packages are added to package.json and the build asks for an install', () => {
        const root = project({
            deps: {sdc_client: '^0.161.0'}, installed: {sdc_client: '0.161.0'},
            apps: {charts: {sdc_client: '^0.161.0', 'chart.js': '^4.4.0'}}, lock: 'yarn.lock',
        });
        const result = checkDependencies(root);
        expect(result.added).toEqual(['chart.js@^4.4.0 (charts needs ^4.4.0)']);
        expect(packageJson(root).dependencies).toEqual({sdc_client: '^0.161.0', 'chart.js': '^4.4.0'});
        expect(checkMessage(result, root)).toContain('Run "yarn install" and build again.');
        // After adding, the package is declared but still not installed
        expect(checkDependencies(root)).toEqual({added: [], conflicts: [],
            missing: ['chart.js is not installed (charts needs ^4.4.0)']});
    });

    test('an incompatible range in package.json is reported and not changed', () => {
        const root = project({
            deps: {sdc_client: '^0.160.4'}, installed: {sdc_client: '0.160.4'},
            apps: {charts: {sdc_client: '^0.161.0'}},
        });
        const before = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
        const result = checkDependencies(root);
        expect(result.conflicts).toEqual(['sdc_client: the project has ^0.160.4, but charts needs ^0.161.0']);
        expect(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).toBe(before);
        const message = checkMessage(result, root);
        expect(message).toContain('Change the ranges in package.json');
        expect(message).not.toContain('Run "');
    });

    test('an installed version outside the app\'s range needs an install', () => {
        const root = project({
            deps: {'chart.js': '>=4.0.0'}, installed: {'chart.js': '4.1.0'},
            apps: {charts: {'chart.js': '^4.4.0'}},
        });
        expect(checkDependencies(root).missing).toEqual(['chart.js 4.1.0 is installed, but charts needs ^4.4.0']);
        expect(checkMessage(checkDependencies(root), root)).toContain('Run "npm install"');
    });

    test('apps that need incompatible versions of the same package conflict', () => {
        const root = project({apps: {a: {'chart.js': '^3.0.0'}, b: {'chart.js': '^4.0.0'}}});
        expect(checkDependencies(root).conflicts).toEqual(
            ['chart.js: the apps need incompatible versions (a needs ^3.0.0, b needs ^4.0.0)']);
        expect(packageJson(root).dependencies).toEqual({});
    });

    test('a project without Assets/libs has nothing to check', () => {
        const root = project({});
        expect(checkDependencies(root)).toEqual({added: [], conflicts: [], missing: []});
    });
});

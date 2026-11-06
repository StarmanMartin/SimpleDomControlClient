/**
 * @jest-environment jsdom
 */

import {TestItem, TestList} from "./utils.js";
import {reconcile, cleanCache, loadFilesFromController, VIEW_REDIRECT} from "../src/simpleDomControl/sdc_view.js";
import {runControlFlowFunctions} from "../src/simpleDomControl/sdc_controller.js";
import {on, allOff} from "../src/simpleDomControl/sdc_events.js";
import {app} from "../src/index.js";
import $ from "jquery";

window.$ = $;

describe('View redirects', () => {
    let controller, listener;
    const link = '<a href=".~login~&next=..">Redirector</a>';

    beforeEach(() => {
        cleanCache();
        controller = {
            contentUrl: '/protected', _tagName: 'protected-view', _urlParams: [],
            $container: $('<protected-view></protected-view>'), contentReload: true,
            onLoad: jest.fn(), willShow: jest.fn(), confirmPageLoaded: jest.fn(),
        };
        listener = {navLoaded: jest.fn()};
        on('navLoaded', listener);
        jest.spyOn($, 'get').mockRejectedValue({status: 301, responseJSON: {'url-link': link}});
    });

    afterEach(() => {
        allOff(listener);
        jest.restoreAllMocks();
        cleanCache();
    });

    test('redirect skips rendering and the view lifecycle, notifying navigation once', async () => {
        await runControlFlowFunctions(controller);
        expect(controller.autoRedirect).toBe(link);
        expect(listener.navLoaded).toHaveBeenCalledTimes(1);
        expect(listener.navLoaded).toHaveBeenCalledWith(controller);
        expect(controller.onLoad).not.toHaveBeenCalled();
        expect(controller.willShow).not.toHaveBeenCalled();
        expect(controller.$container.text()).toBe('');
    });

    test('redirect is not cached and a subsequent successful load clears it', async () => {
        controller.contentReload = false;
        expect(await loadFilesFromController(controller)).toBe(VIEW_REDIRECT);
        $.get.mockResolvedValueOnce('<div>Allowed</div>');
        expect((await loadFilesFromController(controller)).text()).toBe('Allowed');
        expect($.get).toHaveBeenCalledTimes(2);
        expect(controller.autoRedirect).toBeNull();
    });
});

describe('Test reconcile', () => {

    beforeAll(() => {
        app.updateJquery();
    });

    test('Load Content', async () => {
        const a = '<div>' +
            '<h1>Test</h1>' +
            '<ul>' +
            '<li>B</li>' +
            '<li><input name="TEST" /></li>' +
            '<li>D</li>' +
            '</ul>' +
            '</div>';

        const b = '<div class="class.1">' +
            '<p>UPS</p>' +
            '<p>UPS</p>' +
            '<h1>Test 1</h1>' +
            '<ul>' +
            '<li>A</li>' +
            '<li>A1 <input name="TEST" type="text"/></li>' +
            '<li>B</li>' +
            '<li><input name="TEST" type="text"/></li>' +
            '<li>D</li>' +
            '</ul>' +
            '</div>';
        const $b = $(b);
        const $a = $(a);
        const input_a = $a.find('[name=TEST]')[0]
        reconcile($b, $a);
        expect($a.html()).toBe($(b).html());
        expect($a[0].className).toBe('class.1');
        expect(input_a).toBe($a.find('[name=TEST]')[0]);

    });

    test('Load Content 2', async () => {
        const a = '<div>' +
            '<p>UPS</p>' +
            '<p>UPS</p>' +
            '<h1>Test</h1>' +
            '<ul>' +
            '<li>B</li>' +
            '<li><input name="TEST" /></li>' +
            '<li>D</li>' +
            '</ul>' +
            '</div>';

        const b = '<div class="class.1">' +
            '<h1>Test 1</h1>' +
            '<ul>' +
            '<li>A</li>' +
            '<li>A1 <input name="TEST" type="text"/></li>' +
            '<li>B</li>' +
            '<li><input name="TEST" type="text"/></li>' +
            '<li>D</li>' +
            '</ul>' +
            '</div>';
        const $b = $(b);
        const $a = $(a);
        const input_a = $a.find('[name=TEST]')[0]
        reconcile($b, $a);
        expect($a.html()).toBe($(b).html());
        expect($a[0].className).toBe('class.1');
        expect(input_a).toBe($a.find('[name=TEST]')[0]);

    });

    test('Load content 3', () => {
        const a = '<div>' +
            '<div><p>A1</p><p>B1</p></div>' +
            '<div><p>A2</p><p>B2</p></div>' +
            '</div>';

        const b = '<div>' +
            '<div><p>A2</p><p>B3</p></div>' +
            '<div><p>A2</p><p>B4</p></div>' +
            '</div>';
        const $b = $(b);
        const $a = $(a);
        reconcile($b, $a);
        expect($a.html()).toBe($(b).html());

    });


    test('Load Content Split', async () => {
        const a = '<div>' +
            '<ul>' +
            '<li>X<input name="TEST" /></li>' +
            '</ul>' +
            '</div>';

        const b = '<div class="class.1">' +
            '<ul>' +
            '<li>A1 <input name="TEST" type="text"/></li>' +
            '<li>X</li>' +
            '</ul>' +
            '</div>';
        const $b = $(b);
        const $a = $(a);
        const input_a = $a.find('[name=TEST]')[0]
        reconcile($b, $a);
        expect($a.html()).toBe($(b).html());
        expect($a[0].className).toBe('class.1');
        expect(input_a).toBe($a.find('[name=TEST]')[0]);

    });
});

describe('Controller reconcile', () => {
    let ajaxSpy;
    beforeEach(async () => {
        ajaxSpy = jest.spyOn($, 'ajax');
        ajaxSpy.mockImplementation(() => {
            return Promise.resolve('<div></div>');
        });
        app.register(TestList);
        app.register(TestItem);
        const $body = $('body');
        const $ctr_div = $(document.createElement('test-list'));
        $body.append($ctr_div);
        await app.init_sdc();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        $('body').safeEmpty();
    });

    test('Load Content Split', async () => {
        const oldList = $('body').find('input').toArray();
        const controller = app.getController($('body').children());
        controller.number = 5;
        await controller.refresh();
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const newList = $('body').find('input').toArray();
        expect(newList.length).toBe(5);

        newList.forEach((x, i) => {
            expect(x).toBe(oldList[i]);
        });


    });
});
// Regression: reconcile kept nodes but did not update their data-* attributes.
// After a delete in <sdc-list-view>, the kept "Remove" buttons still pointed
// (data-bs-target) to the modal of another row or to a modal that no longer
// existed.
describe('Reconcile data-* attributes (list delete)', () => {
    let lid = 0;

    // Output of the list templates: one row per instance with a "Remove"
    // button that opens the row's confirm modal.
    function renderList(items, idOf) {
        const rows = items.map(([pk, name]) => {
            const id = idOf(pk);
            return `<tr><td>${name}</td><td>` +
                `<button type="button" data-bs-toggle="modal" data-bs-target="#delete-model-modal-${id}">Remove</button>` +
                `<div class="modal" id="delete-model-modal-${id}"><div class="modal-footer">` +
                `<button sdc_click="removeInstance" data-instance-pk="${pk}" type="button">Remove ${name}</button>` +
                `</div></div></td></tr>`;
        }).join('');
        return $(`<div class="container-fluid"><table class="table"><tbody>${rows}</tbody></table></div>`);
    }

    beforeAll(() => {
        app.updateJquery();
    });

    test.each([
        ['ids per render (sdc_tools list template)', () => `uuid-${++lid}`],
        ['ids by pk (generated list template)', (pk) => `${pk}`],
    ])('every "Remove" button opens the modal of its own row (%s)', (_, idOf) => {
        const items = [[1, 'A'], [2, 'B'], [3, 'C']];
        const $real = renderList(items, idOf);
        $('body').empty().append($real);
        const oldButtons = $real.find('[data-bs-toggle=modal]').toArray();

        // delete A
        reconcile(renderList(items.slice(1), idOf), $real);

        const $rows = $real.find('tr');
        expect($rows.length).toBe(2);
        // The buttons are kept nodes (only then their attributes are synced).
        $real.find('[data-bs-toggle=modal]').each((_, btn) => {
            expect(oldButtons).toContain(btn);
        });
        $rows.each((i, tr) => {
            const $tr = $(tr);
            const [pk, name] = items[i + 1];
            const target = $tr.find('[data-bs-toggle=modal]').attr('data-bs-target');
            expect($tr.find('td').first().text()).toBe(name);
            expect($real.find(target).length).toBe(1);
            expect($tr.find(target).length).toBe(1);
            const $confirm = $tr.find(target).find('[sdc_click=removeInstance]');
            expect($confirm.attr('data-instance-pk')).toBe(`${pk}`);
            expect($confirm.data('instance-pk')).toBe(pk);
        });
    });
});

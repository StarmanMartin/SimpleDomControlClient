/**
 * @jest-environment jsdom
 */

import {TestItem, TestList} from "./utils.js";
import {reconcile} from "../src/simpleDomControl/sdc_view.js";
import {app} from "../src/index.js";
import $ from "jquery";

window.$ = $;

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
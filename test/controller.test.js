/**
 * @jest-environment jsdom
 */


import * as sdc from '../dist/index.js';
import * as sdc_view from '../simpleDomControl/sdc_view.js';
import {app} from '../simpleDomControl/sdc_main.js';
import {jest} from '@jest/globals'
import $ from 'jquery';
window.$ = $;

class TestCtr extends sdc.AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtr'; //<test-ctr>
        this.events.unshift({});
    }

    sayA() {
        return 'A'
    }

    onInit() {}
}

class TestCtrA extends sdc.AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtrA'; //<test-ctr-a>
        this.events.unshift({});
    }

    sayA() {
        return 'B'
    }

    sayB() {
        return 'B'
    }

    onInit() {}
}

describe('Controller', () => {
    let ajaxSpy;
    beforeEach(() => {
        ajaxSpy = jest.spyOn($, 'ajax');
        ajaxSpy.mockImplementation(()=> {
            return Promise.resolve('<div></div>');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Load Content', async () => {
        let ctr = new TestCtr();
        ctr.$container = $('<test-ctr></test-ctr>');
        let files = await sdc_view.loadFilesFromController(ctr);
        expect(ajaxSpy).toBeCalledWith({
            type: 'get',
            url: 'TestCtr',
            data: {
                "VERSION": "0.0",
                "_method": "content",
            }
        });

        expect(files[0]).toStrictEqual(document.createElement('div'));
    });

    test('register', async () => {
        app.register(TestCtr).addMixin('test-ctr-a');
        app.register(TestCtrA);
        const $body = $('body');
        const $ctr_div = $(document.createElement('test-ctr'));
        $body.append($ctr_div);
        await app.init_sdc();
        expect($ctr_div.find('div').length).toBe(1)
        let testCtr = app.rootController._childController.testCtr[0]
        expect(testCtr.sayA()).toBe('A');
        expect(testCtr.sayB()).toBe('B');
    });

    test('basics', () => {
        let ctr = new TestCtr();
        expect(ctr.contentUrl).toBe("TestCtr");
        expect(ctr.contentReload).toBe(false);
        expect(ctr.hasSubnavView).toBe(false);
    });

});
/**
 * @jest-environment jsdom
 */


import * as sdc from '../dist/index.js';
import * as sdc_view from '../simpleDomControl/sdc_view.js';
import {jest} from '@jest/globals'
import $ from 'jquery';
window.$ = $;

class TestCtr extends sdc.AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtr'; //<test-ctr>
        this.events.unshift({});
    }

    //-------------------------------------------------//
    // Lifecycle handler                               //
    // - onInit (tag parameter)                        //
    // - onLoad (DOM not set)                          //
    // - willShow  (DOM set)                           //
    // - afterShow  (recalled on reload)               //
    //-------------------------------------------------//
    // - onRefresh                                     //
    //-------------------------------------------------//
    // - onRemove                                      //
    //-------------------------------------------------//

    onInit() {
    }

    onLoad($html) {
        return super.onLoad($html);
    }

    willShow() {
        return super.willShow();
    }

    afterShow() {
        return super.afterShow();
    }

    onRefresh() {
        return super.onRefresh();
    }
}

describe('Controller', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('Load Content', async () => {
        let ctr = new TestCtr();
        ctr.$container = $('<test-ctr></test-ctr>');
        const ajaxSpy = jest.spyOn($, 'ajax');
        ajaxSpy.mockImplementation(()=> {
            return Promise.resolve('<div></div>');
        });
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

    test('basics', () => {
        let ctr = new TestCtr();
        expect(ctr.contentUrl).toBe("TestCtr");
        expect(ctr.contentReload).toBe(false);
        expect(ctr.hasSubnavView).toBe(false);
    });

});
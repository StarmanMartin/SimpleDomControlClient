/**
 * @jest-environment jsdom
 */


import {app, AbstractSDC, setEvent, on, allOff, trigger} from '../dist/index.js';
import * as sdc_view from '../src/simpleDomControl/sdc_view.js';


import $ from 'jquery';
window.$ = $;

class TestCtr extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtr'; //<test-ctr>
        this.events.unshift({});
        this.val = 0;
        this.contentReload = true;
    }

    sayA() {
        return 'A'
    }

    onInit() {}
}

class TestCtrA extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtrA'; //<test-ctr-a>
        this.events.unshift({});
        this.val = 1;
        this.val_2 = 2;
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
        expect($ctr_div.find('div').length).toBe(1);
        let testCtr = app.rootController._childController.testCtr[0];
        expect(testCtr.sayA()).toBe('A');
        expect(testCtr.sayB()).toBe('B');
        expect(testCtr.val).toBe(0);
        expect(testCtr.val_2).toBe(2);
        expect(testCtr.mixins.TestCtrA.val).toBe(1);
        ajaxSpy.mockClear();
        testCtr.reload();
        expect(ajaxSpy).toHaveBeenCalledTimes(1);
        testCtr.refresh();
        expect(ajaxSpy).toHaveBeenCalledTimes(1);
    });

    test('events', async () => {
        let val = 0;
        class Test{
           test(value) {
               val = value;
               return value;
           }
        }
        let a = new Test();

        setEvent('test');
        setEvent('test', 'abc');
        on('test', new Test());
        on('test', a);
        let res = await trigger('test', 1);
        expect(val).toBe(1);
        expect(res.length).toBe(2);
        allOff(a);
        let res_new = await trigger('test', 1);
        expect(res_new).toStrictEqual([1]);
    });

    test('basics', () => {
        let ctr = new TestCtr();
        expect(ctr.contentUrl).toBe("TestCtr");
        expect(ctr.contentReload).toBe(true);
    });

});
import {AbstractSDC} from "../src/index.js";


export const TestControllerInfo = {
    name: 'TestCtr',
    tag: 'test-ctr'
};

export class TestCtr extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = TestControllerInfo.name; //<test-ctr>
        this.events.unshift({});
        this.val = 0;
        this.contentReload = true;
    }

    sayA() {
        return 'A'
    }

    onInit() {
    }
}

export class TestCtrA extends AbstractSDC {
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

    onInit() {
    }
}

export class TestList extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtrA'; //<test-ctr-a>
        this.events.unshift({});
        this.number = 0;
    }

    onInit(number = 10) {
        this.number = number;
    }

    onLoad(html) {
        $(html).append('<div><this.listview></this.listview></div>');
        return super.onLoad(html);
    }

    listview() {
        const listItems = [];
        for (let i = 0; i < this.number; i++) {
            listItems.push(`<test-item data-idx="${i}"></test-item>`);
        }

        return `<div>${listItems.join('\n')}</div>`;
    }
}

export class TestItem extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = 'TestCtrA'; //<test-item>
        this.events.unshift({});
    }

    onInit(idx) {
        this.idx = idx;
    }

    onLoad(html) {
        $(html).append(`<input name="i_${this.idx}" />`);
        return super.onLoad(html);
    }
}
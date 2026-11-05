/**
 * @jest-environment jsdom
 */

import {app, AbstractSDC} from "../src/index.js";
import {
    CONTROLLER_CLASS,
    DATA_CONTROLLER_KEY,
    getController,
} from "../src/simpleDomControl/sdc_view.js";
import {TestCtr} from "./utils.js";
import $ from "jquery";

window.$ = $;

// Regression: app.reconcile(controller, $html) (used by reloadController)
// stripped the controller class and data from the live container, and threw
// when the container was not the first child of its parent.
describe("app.reconcile on the controller container", () => {
    beforeAll(() => {
        app.updateJquery();
    });

    function mountController(siblingBefore) {
        document.body.innerHTML =
            `<div id="root">${siblingBefore ? "<p>before</p>" : ""}` +
            `<test-ctr class="${CONTROLLER_CLASS} keep-me"><span>old</span></test-ctr></div>`;
        const controller = new TestCtr();
        controller.$container = $("#root > test-ctr");
        controller.$container.data(DATA_CONTROLLER_KEY, controller);
        return controller;
    }

    test.each([
        ["first child", false],
        ["after a sibling", true],
    ])("keeps the container linked to its controller (%s)", async (_, siblingBefore) => {
        const controller = mountController(siblingBefore);
        const container = controller.$container[0];

        await app.reconcile(controller, $("<span>new</span>"));

        const $live = $("#root > test-ctr");
        expect($live.length).toBe(1);
        expect($live[0]).toBe(container);
        expect(controller.$container[0]).toBe(container);
        expect($live.html()).toBe("<span>new</span>");
        expect($live.hasClass(CONTROLLER_CLASS)).toBe(true);
        expect($live.hasClass("keep-me")).toBe(true);
        expect(getController($live)).toBe(controller);
        expect(getController($live.children())).toBe(controller);
        if (siblingBefore) {
            expect($("#root").children().first().is("p")).toBe(true);
        }
    });
});

// Regression: a kept child-controller node got the new child controller's data
// on reload, but the old child controller was never removed (onRemove did not
// run, its models and events stayed alive).
const removed = [];

class ReloadParent extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = "ReloadParent";
        this.events.unshift({});
    }
}

class ReloadChild extends AbstractSDC {
    constructor() {
        super();
        this.contentUrl = "ReloadChild";
        this.events.unshift({});
    }

    onRemove() {
        removed.push(this);
        return true;
    }
}

describe("reloadController with a child controller", () => {
    beforeEach(async () => {
        removed.length = 0;
        jest.spyOn($, "ajax").mockImplementation(({url}) =>
            Promise.resolve(
                url === "ReloadParent"
                    ? "<div><reload-child></reload-child></div>"
                    : "<span>child</span>",
            ),
        );
        app.updateJquery();
        app.register(ReloadParent);
        app.register(ReloadChild);
        document.body.innerHTML = "<reload-parent></reload-parent>";
        await app.init_sdc();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        $("body").safeEmpty();
    });

    test("removes the replaced child controller once and keeps its node", async () => {
        const parent = app.getController($("reload-parent"));
        const oldChild = app.getController($("reload-child"));
        const childNode = $("reload-child")[0];
        expect(parent._tagName).toBe("reload-parent");
        expect(oldChild._tagName).toBe("reload-child");

        await app.reloadController(parent);

        const $child = $("reload-child");
        const newChild = app.getController($child);
        expect($child.length).toBe(1);
        expect($child[0]).toBe(childNode);
        expect(document.contains(childNode)).toBe(true);
        expect($child.html()).toBe("<span>child</span>");

        expect(newChild._tagName).toBe("reload-child");
        expect(newChild).not.toBe(oldChild);
        expect(newChild.$container[0]).toBe(childNode);
        expect(parent._childController.reloadChild).toEqual([newChild]);

        expect(removed).toEqual([oldChild]);
        expect(oldChild.$container.length).toBe(0);
    });
});

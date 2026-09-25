/**
 * @jest-environment jsdom
 */

import { jest } from "@jest/globals";
import $ from "jquery";
import { app, AbstractSDC, SdcQuerySet, registerModel } from "../src/index.js";
import { resetChildren } from "../src/simpleDomControl/sdc_controller.js";
import { reconcile, CONTROLLER_CLASS, DATA_CONTROLLER_KEY } from "../src/simpleDomControl/sdc_view.js";
import Author from "./models/Author.js";
import Book from "./models/Book.js";

window.$ = $;
global.$ = $;

beforeAll(() => {
  registerModel("Author", Author);
  registerModel("Book", Book);
  app.updateJquery();
});

afterEach(() => {
  $("body").empty();
  jest.restoreAllMocks();
});

function mountController(controller, tagName, $element) {
  controller._tagName = tagName;
  controller.$container = $element;
  $element.addClass(CONTROLLER_CLASS).data(DATA_CONTROLLER_KEY, controller);
  return controller;
}

function messageEvent(payload) {
  return { data: JSON.stringify(payload) };
}

describe("controller runtime", () => {
  test("resetChildren registers direct child controllers only", () => {
    const $parent = $("<parent-ctr><div><child-ctr><grand-ctr></grand-ctr></child-ctr></div></parent-ctr>");
    const parent = mountController(new AbstractSDC(), "parent-ctr", $parent);
    const child = mountController(new AbstractSDC(), "child-ctr", $parent.find("child-ctr"));
    const grand = mountController(new AbstractSDC(), "grand-ctr", $parent.find("grand-ctr"));

    resetChildren(parent);

    expect(parent._childController).toEqual({ childCtr: [child] });
    expect(child._parentController).toBe(parent);
    expect(parent.iterateAllChildren()).toEqual([child]);
    void grand;
  });

  test("getEvents does not change event maps shared between instances", () => {
    const shared = { click: { ".a": () => "a" } };
    const first = new AbstractSDC();
    first.events = [shared];
    first._mixins = { mixin: { events: [{ click: { ".b": () => "b" } }] } };

    const events = first.getEvents();

    expect(Object.keys(events.click)).toEqual([".a", ".b"]);
    expect(Object.keys(shared.click)).toEqual([".a"]);
  });

  test("registerGlobal returns the registration so mixins can be added", () => {
    class RuntimeFixGlobalController extends AbstractSDC {}
    const registration = app.registerGlobal(RuntimeFixGlobalController);
    expect(typeof registration.addMixin).toBe("function");
  });

  test("reconcile moves sdcDom listeners to the node it keeps", () => {
    const first = jest.fn();
    const second = jest.fn();
    const $real = $("<div></div>").append(window.sdcDom("button", { onClick: first }, "Go"));
    const $virtual = $("<div></div>").append(window.sdcDom("button", { onClick: second }, "Go"));
    $("body").append($real);
    const keptButton = $real.find("button")[0];

    reconcile($virtual, $real);

    expect($real.find("button")[0]).toBe(keptButton);
    keptButton.click();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("model runtime", () => {
  test("static querySet uses the model name", () => {
    expect(Book.querySet().modelName).toBe("Book");
  });

  test("parseValue converts TextField and all integer field types", () => {
    const book = new Book();
    expect(book.parseValue(5, { type: "TextField" })).toBe("5");
    for (const type of ["BigAutoField", "SmallIntegerField", "PositiveIntegerField", "PositiveBigIntegerField"]) {
      expect(book.parseValue("7", { type })).toBe(7);
    }
    expect(() => book.validate("x", { type: "BigAutoField" })).toThrow("Must be an integer");
  });

  test("validate accepts JSON strings and enforces file limits", () => {
    const book = new Book();
    expect(() => book.validate('{"a": 1}', { type: "JSONField" })).not.toThrow();
    expect(() => book.validate("{broken", { type: "JSONField" })).toThrow("Must be valid JSON");

    const file = new File(["12345"], "a.txt", { type: "text/plain" });
    expect(() => book.validate(file, { type: "FileField", max_size: 3 })).toThrow("File too large");
    expect(() => book.validate(file, { type: "FileField", allowed_types: ["image/png"] })).toThrow("Invalid file type");
    expect(book.parseValue(file, { type: "FileField", max_size: 3 })).toBe(file);
  });

  test("setIds copies models and querysets", () => {
    const source = new SdcQuerySet("Book");
    source.new({ id: 11, title: "Notes" });
    source.new({ id: 12, title: "More notes" });

    const target = new SdcQuerySet("Book");
    target.setIds(source);
    expect(target.getIds()).toEqual([11, 12]);
    expect(target[0]).not.toBe(source[0]);
    expect(target[0].title).toBe("Notes");
    expect(target[0].querySet).toBe(target);

    const kept = target[0];
    target.setIds(source);
    expect(target[0]).toBe(kept);

    const book = new Book({ id: 1, title: "x", author: 2 });
    const author = book.author;
    book.setValues(new Book({ id: 1, title: "x", author: 2 }));
    expect(book.author).toBe(author);

    const single = new SdcQuerySet("Book");
    single.setIds(source[1]);
    expect(single.getIds()).toEqual([12]);
    expect(single.modelQuery).toEqual({ id__in: [12] });
  });

  test("syncModelToForm fills create forms and syncForm tolerates invalid values", () => {
    const book = new Book({ title: "Draft" });
    const $form = $(`<form class="${book.formId}"><input name="title"></form>`).data("model_pk", -1);
    $("body").append($form);

    book.syncModelToForm($form);
    expect($form.find("[name=title]").val()).toBe("Draft");

    $form.find("[name=title]").val("");
    let values;
    expect(() => {
      values = book.syncForm($form);
    }).not.toThrow();
    expect(values.title).toBe("");
    expect(book.title).toBe("Draft");
  });

  test("edits in one form are shown in the other forms of the model", () => {
    const book = new Book({ id: 3, title: "Old" });
    const $first = $('<form><input name="title" value="Old"></form>');
    const $second = $('<form><input name="title" value="Old"></form>');
    $("body").append($first, $second);
    book.addForm($first);
    book.addForm($second);

    $first.find("input").val("New").trigger("input");

    expect(book.title).toBe("New");
    expect($second.find("input").val()).toBe("New");
  });

  test("list_view responses fill the queryset", async () => {
    const books = new SdcQuerySet("Book");
    await books._onMessage(messageEvent({
      type: "list_view",
      event_id: "x",
      html: "<div></div>",
      args: { data: JSON.stringify([{ model: "main.book", pk: 11, fields: { title: "Notes" } }]) },
    }));
    expect(books.getIds()).toEqual([11]);
  });

  test("on_delete removes the rows and calls onDelete (or onUpdate)", async () => {
    const books = new SdcQuerySet("Book");
    books.new({ id: 11, title: "Notes" });
    books.new({ id: 12, title: "More" });
    const onUpdate = jest.fn();
    books.onUpdate = onUpdate;

    await books._onMessage(messageEvent({
      type: "on_delete",
      event_id: "none",
      args: { data: JSON.stringify([{ model: "main.book", pk: 11, fields: { title: "Notes" } }]) },
    }));

    expect(books.getIds()).toEqual([12]);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0].map((x) => x.id)).toEqual([11]);

    const onDelete = jest.fn();
    books.on_delete = onDelete;
    await books._onMessage(messageEvent({
      type: "on_delete",
      event_id: "none",
      args: { data: JSON.stringify([{ model: "main.book", pk: 12, fields: {} }]) },
    }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(books.getIds()).toEqual([]);
  });
});

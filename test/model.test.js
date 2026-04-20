/**
 * @jest-environment jsdom
 */

import { jest } from "@jest/globals";
import $ from "jquery";
import { registerModel } from "../src/index.js";
import Author from "./models/Author.js";
import Book from "./models/Book.js";
import BookContent from "./models/BookContent.js";
import SdcUser from "./models/SdcUser.js";

window.$ = $;
global.$ = $;

class MockModelSocket {
  static server = null;

  constructor(url) {
    this.url = url;
    this.sentMessages = [];
    queueMicrotask(() => {
      this.onopen && this.onopen();
    });
  }

  send(rawMessage) {
    this.sentMessages.push(JSON.parse(rawMessage));
    MockModelSocket.server.receive(this, JSON.parse(rawMessage));
  }

  close() {
    this.onclose && this.onclose({ code: 1000, reason: "client-close" });
  }
}

class MockModelSocketServer {
  constructor() {
    this.records = {
      Author: [
        { pk: 1, id: 1, fields: {name: "Ada Lovelace", age: 36, book_set: [11]} },
        { pk: 2, id: 2, fields: {name: "Grace Hopper", age: 85, book_set: [21, 22]} },
      ],
      Book: [
        { pk: 11, id: 11, fields: {title: "Notes", author: 1 }},
        { pk: 21, id: 21, fields: {title: "Compiler Notes", author: 2 }},
        { pk: 22, id: 22, fields: {title: "COBOL", author: 2 }},
      ],
      BookContent: [],
      SdcUser: [{ pk: 7, id: 7, fields: {username: "tester" }}],
    };
  }

  emit(socket, payload) {
    queueMicrotask(() => {
      socket.onmessage && socket.onmessage({ data: JSON.stringify(payload) });
    });
  }

  receive(socket, message) {
    const { event_type: eventType, event_id: eventId, args } = message;

    if (eventType === "connect") {
      this.emit(socket, {
        type: "connect",
        event_id: eventId,
        args: {},
      });
      return;
    }

    if (eventType === "load") {
      const rows = this.filterRows(args.model_name, args.model_query);
      this.emit(socket, {
        type: "load",
        event_id: eventId,
        args: {
          data: JSON.stringify(rows),
        },
      });
      return;
    }

    if (eventType === "save") {
      const saved = this.saveRow(args.model_name, args.data);
      this.emit(socket, {
        event_id: eventId,
        data: {
          instance: JSON.stringify([saved]),
        },
      });
      return;
    }

    if (eventType === "create") {
      const created = this.createRow(args.model_name, args.data);
      this.emit(socket, {
        event_id: eventId,
        data: {
          instance: JSON.stringify([created]),
        },
      });
    }
  }

  filterRows(modelName, query = {}) {
    return this.records[modelName].filter((row) =>
      Object.entries(query || {}).every(([key, value]) => row[key] === value || row.fields[key] === value),
    );
  }

  saveRow(modelName, data) {
    const records = this.records[modelName];
    const id = data.pk ?? data.id;
    const idx = records.findIndex((row) => row.id === id);

    records[idx].fields = {
      ...records[idx].fields,
      ...data
    };
    return records[idx];
  }

  createRow(modelName, data) {
    const records = this.records[modelName];
    const newId = Math.max(0, ...records.map((row) => row.id ?? 0)) + 1;
    if (data.hasOwnProperty('id')) {
      delete data.id;
    }
    const created = {
      fields: {...data},
      id: newId,
    };

    records.push(created);
    return created;
  }
}

describe("model fixtures", () => {
  beforeAll(() => {
    registerModel("Author", Author);
    registerModel("Book", Book);
    registerModel("BookContent", BookContent);
    registerModel("SdcUser", SdcUser);
  });

  beforeEach(() => {
    window.location.host = "localhost";
    window.location.protocol = "http:";
    MockModelSocket.server = new MockModelSocketServer();
    global.WebSocket = MockModelSocket;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    $("body").empty();
    delete global.WebSocket;
  });

  test("Author stores scalar fields and related book ids from fixture payloads", () => {
    const author = new Author({
      id: 3,
      name: "Ada Lovelace",
      age: 36,
      book_set: [11, 15],
    });

    expect(author.id).toBe(3);
    expect(author.name).toBe("Ada Lovelace");
    expect(author.age).toBe(36);
    expect(author.book_set.getIds()).toEqual([11, 15]);
    expect(author.book_set.modelName).toBe("Book");
  });

  test("Book serializes many-to-one relations as a single related id", () => {
    const book = new Book({
      id: 8,
      title: "Analytical Engine Notes",
    });

    book.author = 3;

    expect(book.author.id).toBe(3);
    expect(book.serialize()).toEqual({
      id: 8,
      title: "Analytical Engine Notes",
      author: 3,
    });
  });

  test("Author serializes one-to-many relations as an id list", () => {
    const author = new Author({
      id: 5,
      name: "Grace Hopper",
      age: 85,
    });
    const firstBook = new Book({ id: 21, title: "Compiler Notes" });
    const secondBook = new Book({ id: 22, title: "COBOL" });

    firstBook.author = 5;
    secondBook.author = 5;
    author.book_set.valuesList = [firstBook, secondBook];

    expect(author.serialize()).toEqual({
      book_set: [21, 22],
      id: 5,
      name: "Grace Hopper",
      age: 85,
    });
  });

  test("syncModelToForm copies model values into matching form elements", () => {
    const author = new Author({
      id: 9,
      name: "Margaret Hamilton",
      age: 33,
    });
    const $form = $(`
      <form class="${author.formId}">
        <input name="name" value="" />
        <input name="age" value="" />
      </form>
    `).data("model_pk", 9);

    $("body").append($form);
    author.syncModelToForm($form);

    expect($form.find("[name=name]").val()).toBe("Margaret Hamilton");
    expect($form.find("[name=age]").val()).toBe("33");
  });

  test("syncForm parses hidden ids and file uploads into the model", () => {
    const content = new BookContent();
    const file = new File(["chapter"], "chapter.txt", { type: "text/plain" });
    const $form = $(`
      <form class="${content.formId}">
        <input type="hidden" name="user" value="7" />
        <input type="file" name="text" />
      </form>
    `).data("model_pk", -1);
    const fileInput = $form.find("[name=text]")[0];

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [file],
    });

    $("body").append($form);
    const result = content.syncForm($form);

    expect(result.user).toBe(7);
    expect(result.text).toBe(file);
    expect(content.user.id).toBe(7);
    expect(content.text).toBe(file);
  });

  test("fixture validation still rejects invalid required values", () => {
    const author = new Author();

    expect(() => {
      author.name = "";
    }).toThrow("This field is required");
  });

  test("queryset load receives rows through the mocked socket receiver", async () => {
    const books = new Author({ id: 2 }).book_set;

    const result = await books.load();

    expect(result).toMatchObject({
      type: "load",
    });
    expect(books.getIds()).toEqual([21, 22]);
    expect(books[0].title).toBe("Compiler Notes");
    expect(books[1].author.id).toBe(2);
    expect(books.socket.sentMessages.map((x) => x.event_type)).toEqual([
      "connect",
      "load",
    ]);
  });

  test("queryset save sends model payloads and updates cached rows from the socket response", async () => {
    const books = new Author({ id: 2 }).book_set;

    await books.load({ author: 2 });
    books[0].title = "Compiler Notes Revised";

    const [response] = await books.save({ pk: 21 });

    expect(response.data.instance).toHaveLength(1);
    expect(response.data.instance[0].title).toBe("Compiler Notes Revised");
    expect(books.byId(21).title).toBe("Compiler Notes Revised");
    expect(books.socket.sentMessages.at(-1)).toMatchObject({
      event_type: "save",
      args: {
        pk: 21,
        data: {
          id: 21,
          title: "Compiler Notes Revised",
          author: 2,
          pk: 21,
        },
      },
    });
  });

  test("queryset create uses the mocked socket receiver to append new rows", async () => {
    const books = new Author({ id: 2 }).book_set;
    const newBook = new Book({
      title: "New Language Manual",
    });

    newBook.author = 2;

    const response = await books.create({ elem: newBook });

    expect(response.data.instance.id).toBe(23);
    expect(response.data.instance.title).toBe("New Language Manual");
    expect(books.byId(23).author.id).toBe(2);
    expect(books.socket.sentMessages.at(-1)).toMatchObject({
      event_type: "create",
      args: {
        data: {
          id: null,
          title: "New Language Manual",
          author: 2,
        },
      },
    });
  });
});

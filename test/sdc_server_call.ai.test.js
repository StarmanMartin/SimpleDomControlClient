/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import $ from "jquery";

window.$ = $;
global.$ = $;

const FROZEN_NOW = new Date("2026-04-03T10:15:30.000Z");

class EventSink {
  constructor() {
    this.calls = [];
  }

  pushMsg(...args) {
    this.calls.push(["pushMsg", ...args]);
  }

  pushErrorMsg(...args) {
    this.calls.push(["pushErrorMsg", ...args]);
  }

  onNavLink(...args) {
    this.calls.push(["onNavLink", ...args]);
  }

  serverEvent(...args) {
    this.calls.push(["serverEvent", ...args]);
  }
}

class MockWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.send = jest.fn();
    this.close = jest.fn(() => {
      if (this.onclose) {
        this.onclose({ code: 1000, reason: "client-close" });
      }
    });
    MockWebSocket.instances.push(this);
  }

  emitOpen() {
    this.onopen && this.onopen();
  }

  emitMessage(data) {
    this.onmessage && this.onmessage({ data: JSON.stringify(data) });
  }

  emitClose(event = { code: 1006, reason: "server-close" }) {
    this.onclose && this.onclose(event);
  }
}

async function loadFreshModules() {
  jest.resetModules();
  window.$ = $;
  global.$ = $;
  const events = await import("../src/simpleDomControl/sdc_events.js");
  const serverCall = await import("../src/simpleDomControl/sdc_server_call.js");
  return { events, serverCall };
}

async function createEventSink(events) {
  const sink = new EventSink();
  ["pushMsg", "pushErrorMsg", "onNavLink", "serverEvent"].forEach((eventName) => {
    events.setEvent(eventName);
    events.on(eventName, sink);
  });
  return sink;
}

describe("sdc_server_call", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FROZEN_NOW);
    jest.restoreAllMocks();
    window.CSRF_TOKEN = "csrf-token";
    window.SERVER_CALL_VIA_WEB_SOCKET = false;
    MockWebSocket.instances = [];
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.WebSocket;
  });

  test("posts server calls and forwards success messages", async () => {
    const { events, serverCall } = await loadFreshModules();
    const sink = await createEventSink(events);
    const postSpy = jest.spyOn($, "post").mockImplementation((options) => {
      const xhr = { setRequestHeader: jest.fn() };
      options.beforeSend(xhr, options);
      expect(xhr.setRequestHeader).toHaveBeenCalledWith("X-CSRFToken", "csrf-token");
      return Promise.resolve({
        _return_data: {
          header: "Saved",
          msg: "Server accepted request",
          data: { id: 7 },
        },
      });
    });

    const result = await serverCall.callServer(
      "demo_app",
      "demo-controller",
      "/sdc_view/demo_app",
      "saveItem",
      { name: "Ada" },
    );

    expect(postSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/sdc_view/demo_app",
        data: {
          data: JSON.stringify({ name: "Ada" }),
          _sdc_func_name: "saveItem",
          _method: "sdc_server_call",
        },
      }),
    );
    expect(result).toEqual({
      header: "Saved",
      msg: "Server accepted request",
      data: { id: 7 },
    });
    expect(sink.calls).toEqual([["pushMsg", "Saved", "Server accepted request"]]);
  });

  test("marks failed post responses as errors and forwards error messages", async () => {
    const { events, serverCall } = await loadFreshModules();
    const sink = await createEventSink(events);
    const responseError = {
      responseJSON: {
        header: "Invalid",
        msg: "Payload was rejected",
      },
    };

    jest.spyOn($, "post").mockRejectedValue(responseError);

    await expect(
      serverCall.callServer(
        "demo_app",
        "demo-controller",
        "/sdc_view/demo_app",
        "saveItem",
        { bad: true },
      ),
    ).rejects.toBe(responseError);

    expect(responseError.responseJSON.is_error).toBe(true);
    expect(sink.calls).toEqual([["pushErrorMsg", "Invalid", "Payload was rejected"]]);
  });

  test("sends websocket calls, resolves recalls, and forwards server events", async () => {
    window.SERVER_CALL_VIA_WEB_SOCKET = true;
    const { events, serverCall } = await loadFreshModules();
    const sink = await createEventSink(events);

    const connection = serverCall.isConnected();
    expect(MockWebSocket.instances).toHaveLength(1);
    const socket = MockWebSocket.instances[0];
    expect(socket.url).toBe("ws://localhost/sdc_ws/ws/");
    socket.emitOpen();
    await connection;

    const responsePromise = serverCall.callServer(
      "demo_app",
      "demo-controller",
      "/ignored",
      "loadDashboard",
      { filter: "recent" },
    );

    await Promise.resolve();

    expect(socket.send).toHaveBeenCalledTimes(1);
    const requestPayload = JSON.parse(socket.send.mock.calls[0][0]);
    expect(requestPayload).toMatchObject({
      event: "sdc_call",
      controller: "demo-controller",
      app: "demo_app",
      function: "loadDashboard",
      args: { filter: "recent" },
    });

    socket.emitMessage({
      header: "Ready",
      msg: "Dashboard loaded",
      type: "sdc_event",
      event: "serverEvent",
      payload: { generatedAt: FROZEN_NOW.toISOString() },
    });
    socket.emitMessage({
      id: requestPayload.id,
      type: "sdc_recall",
      data: {
        rows: 3,
        generatedAt: FROZEN_NOW.toISOString(),
      },
    });

    await expect(responsePromise).resolves.toEqual({
      rows: 3,
      generatedAt: "2026-04-03T10:15:30.000Z",
    });
    expect(sink.calls).toEqual([
      ["pushMsg", "Ready", "Dashboard loaded"],
      ["serverEvent", { generatedAt: "2026-04-03T10:15:30.000Z" }],
    ]);
  });

  test("forwards websocket redirects through onNavLink", async () => {
    window.SERVER_CALL_VIA_WEB_SOCKET = true;
    const { events, serverCall } = await loadFreshModules();
    const sink = await createEventSink(events);

    const connection = serverCall.isConnected();
    const socket = MockWebSocket.instances[0];
    socket.emitOpen();
    await connection;

    socket.emitMessage({
      type: "sdc_redirect",
      link: "/target/path",
    });

    expect(sink.calls).toEqual([["onNavLink", "/target/path"]]);
  });

  test("rejects open websocket requests on close and reconnects after one second", async () => {
    window.SERVER_CALL_VIA_WEB_SOCKET = true;
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { serverCall } = await loadFreshModules();

    const pendingResponse = serverCall.callServer(
      "demo_app",
      "demo-controller",
      "/ignored",
      "loadDashboard",
      { filter: "recent" },
    );

    const firstSocket = MockWebSocket.instances[0];
    firstSocket.emitOpen();
    await Promise.resolve();

    firstSocket.emitClose({ code: 1011, reason: "server-failure" });

    await expect(pendingResponse).rejects.toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalledWith("SDC Socket closed unexpectedly");

    expect(MockWebSocket.instances).toHaveLength(1);
    jest.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
  });
});

/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import $ from "jquery";

window.$ = $;
global.$ = $;

const { test_utils } = await import("../src/index.js");

describe("test_utils login/logout", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    document.cookie =
      "sessionid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  afterEach(() => {
    delete globalThis.SDC_TEST_USER;
    jest.restoreAllMocks();
  });

  test("login does not throw when SDC_TEST_USER is undefined", () => {
    expect(test_utils.login("alice")).toBe(false);
    expect(document.cookie).not.toContain("sessionid");
  });

  test("login sets the session cookie of a known user", () => {
    globalThis.SDC_TEST_USER = { alice: "abc123" };
    expect(test_utils.login("alice")).toBe(true);
    expect(document.cookie).toContain("sessionid=abc123");
  });

  test("logout removes the session cookie", () => {
    globalThis.SDC_TEST_USER = { alice: "abc123" };
    test_utils.login("alice");
    test_utils.logout();
    expect(document.cookie).not.toContain("sessionid");
  });
});

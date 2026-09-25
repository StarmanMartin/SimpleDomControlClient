/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import SdcModel from "../src/simpleDomControl/sdc_model.js";

const FROZEN_NOW = new Date("2026-04-03T10:15:30.000Z");

describe("SdcModel date parsing and validation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("parseValue converts ISO datetime strings to Date objects deterministically", () => {
    const model = new SdcModel("AuditLog");

    const parsed = model.parseValue("2026-04-03T10:15:30.000Z", {
      type: "DateTimeField",
    });

    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.getTime()).toBe(FROZEN_NOW.getTime());
  });

  test("parseValue reads date-only strings as local dates", () => {
    const model = new SdcModel("AuditLog");

    const parsed = model.parseValue("2026-04-03", { type: "DateField" });

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(3);
    expect(parsed.getDate()).toBe(3);
  });

  test("parseValue returns null for empty or invalid dates", () => {
    const model = new SdcModel("AuditLog");

    expect(model.parseValue("", { type: "DateField" })).toBeNull();
    expect(model.parseValue("not-a-date", { type: "DateTimeField" })).toBeNull();
  });

  test("validate accepts valid date and datetime payloads from the server", () => {
    const model = new SdcModel("AuditLog");

    expect(() =>
      model.validate("2026-04-03", {
        type: "DateField",
        required: true,
      }),
    ).not.toThrow();
    expect(() =>
      model.validate("2026-04-03T10:15:30.000Z", {
        type: "DateTimeField",
        required: true,
      }),
    ).not.toThrow();
  });

  test("validate rejects invalid date payloads with a stable error", () => {
    const model = new SdcModel("AuditLog");

    expect(() =>
      model.validate("not-a-date", {
        type: "DateTimeField",
        required: true,
      }),
    ).toThrow("Must be a valid date");
  });
});

/**
 * @jest-environment jsdom
 */
import $ from "jquery";
import {
  formatDate,
  formatDateTimeLocal,
  setValueInField,
  toDate,
} from "../src/simpleDomControl/sdc_utils.js";

window.$ = $;
global.$ = $;

function input(type) {
  const el = document.createElement("input");
  el.type = type;
  el.name = "when";
  return el;
}

describe("date helpers", () => {
  test("toDate handles Date, strings, empty and invalid values", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate("not-a-date")).toBeNull();
    expect(toDate(new Date(NaN))).toBeNull();
    expect(toDate("2026-04-03").getDate()).toBe(3);
    expect(toDate("2026-04-03T10:15").getHours()).toBe(10);
  });

  test("formatDate and formatDateTimeLocal use local time", () => {
    const date = new Date(2026, 3, 3, 9, 5);
    expect(formatDate(date)).toBe("2026-04-03");
    expect(formatDateTimeLocal(date)).toBe("2026-04-03T09:05");
    expect(formatDateTimeLocal(null)).toBe("");
  });

  test("setValueInField fills datetime-local and date inputs", () => {
    const dt = input("datetime-local");
    setValueInField(dt, new Date(2026, 3, 3, 9, 5));
    expect(dt.value).toBe("2026-04-03T09:05");

    const d = input("date");
    setValueInField(d, "2026-04-03");
    expect(d.value).toBe("2026-04-03");
  });

  test("setValueInField clears date inputs for null values", () => {
    const dt = input("datetime-local");
    dt.value = "2026-04-03T09:05";
    setValueInField(dt, null);
    expect(dt.value).toBe("");
  });
});

import { test, expect } from "vitest";
import en from "../locales/en.json";
import am from "../locales/am.json";

test("English and Amharic dictionaries have matching keys", () => {
  expect(Object.keys(am)).toEqual(Object.keys(en));

  Object.keys(en).forEach((section) => {
    expect(Object.keys(am[section])).toEqual(Object.keys(en[section]));
  });
});

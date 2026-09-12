import { describe, expect, it, test } from "vitest";
import i18n from "../i18n";
import en from "../locales/en.json";
import am from "../locales/am.json";

describe("internationalization", () => {
	it("contains English and Amharic authentication translations", () => {
		expect(i18n.getResource("en", "translation", "auth.login")).toBe("Login");
		expect(i18n.getResource("am", "translation", "auth.login")).toBe("ግባ");
	});
});

test("English and Amharic dictionaries have matching keys", () => {
  expect(Object.keys(am)).toEqual(Object.keys(en));

  Object.keys(en).forEach((section) => {
    expect(Object.keys(am[section])).toEqual(Object.keys(en[section]));
  });
});

import { describe, expect, it } from "vitest";
import i18n from "../i18n";

describe("internationalization", () => {
	it("contains English and Amharic authentication translations", () => {
		expect(i18n.getResource("en", "translation", "auth.login")).toBe("Login");
		expect(i18n.getResource("am", "translation", "auth.login")).toBe("ግባ");
	});
});

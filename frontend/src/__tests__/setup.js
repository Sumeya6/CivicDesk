import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import i18n from "../i18n";

beforeEach(() => {
	localStorage.setItem("civicdesk_language", "EN");
	i18n.changeLanguage("en");
});

afterEach(() => {
	cleanup();
});

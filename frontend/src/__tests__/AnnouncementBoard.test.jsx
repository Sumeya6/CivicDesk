import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import AnnouncementBoard from "../components/AnnouncementBoard";
import { store } from "../store/store";
import axios from "../api/axios";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe("AnnouncementBoard", () => {
  it("renders active announcements from Redux API flow", async () => {
    axios.get.mockImplementation((url) => url === "/announcements" ? Promise.resolve({ data: { announcements: [{ id: "1", title: "Planned maintenance", content: "Network maintenance tonight.", createdAt: "2026-09-05T00:00:00.000Z" }] } }) : Promise.reject(new Error("unexpected request")));
    render(<Provider store={store}><MemoryRouter><AuthProvider><AnnouncementBoard /></AuthProvider></MemoryRouter></Provider>);
    expect(await screen.findByText("Planned maintenance")).toBeTruthy();
    expect(screen.getByText("Network maintenance tonight.")).toBeTruthy();
  });
});
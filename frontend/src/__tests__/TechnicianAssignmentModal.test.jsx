import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import TechnicianAssignmentModal from "../components/TechnicianAssignmentModal";
import { store } from "../store/store";
import axios from "../api/axios";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe("TechnicianAssignmentModal", () => {
  it("loads and toggles technician offices", async () => {
    axios.get.mockResolvedValue({ data: { officeIds: ["office-1"] } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <TechnicianAssignmentModal
            technician={{ id: "tech-1", fullName: "Technician" }}
            offices={[
              { id: "office-1", nameEn: "IT Office", nameAm: "የIT ቢሮ" },
            ]}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      </Provider>,
    );
    const office = await screen.findByRole("button", { name: /IT Office/ });
    expect(office.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(office);
    expect(office.getAttribute("aria-pressed")).toBe("false");
  });
});

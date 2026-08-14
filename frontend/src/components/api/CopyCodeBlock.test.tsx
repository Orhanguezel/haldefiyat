import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CopyCodeBlock from "./CopyCodeBlock";

afterEach(cleanup);

describe("CopyCodeBlock", () => {
  it("copies the exact live endpoint example", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CopyCodeBlock code="curl https://haldefiyat.com/api/v1/prices" />);

    fireEvent.click(screen.getByRole("button", { name: "Kopyala" }));
    expect(writeText).toHaveBeenCalledWith("curl https://haldefiyat.com/api/v1/prices");
    expect(await screen.findByRole("button", { name: "Kopyalandı" })).toBeInTheDocument();
  });
});

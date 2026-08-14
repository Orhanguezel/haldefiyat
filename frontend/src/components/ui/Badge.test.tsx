import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "./Badge";

afterEach(cleanup);

describe("Badge", () => {
  it("keeps semantic text and the icon in one readable status label", () => {
    render(<Badge color="warning" icon={<span aria-hidden="true">!</span>}>Gecikmeli veri</Badge>);

    const badge = screen.getByText("Gecikmeli veri").closest("span");
    expect(badge).toHaveTextContent("Gecikmeli veri");
    expect(badge?.className).toContain("text-warning");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

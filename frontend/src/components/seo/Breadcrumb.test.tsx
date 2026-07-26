import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Breadcrumb from "./Breadcrumb";

const items = [
  { name: "Ana Sayfa", href: "/" },
  { name: "Fiyatlar", href: "/fiyatlar" },
];

describe("Breadcrumb", () => {
  it("uses the same ordered items for visible navigation and JSON-LD", () => {
    const { container } = render(<Breadcrumb visible items={items} />);

    const nav = screen.getByRole("navigation", { name: "Sayfa yolu" });
    expect(nav.textContent).toContain("Ana Sayfa");
    expect(nav.textContent).toContain("Fiyatlar");
    expect(screen.getByText("Fiyatlar")).toHaveAttribute("aria-current", "page");

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script?.textContent ?? "{}");

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: "https://haldefiyat.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Fiyatlar",
        item: "https://haldefiyat.com/fiyatlar",
      },
    ]);
  });

  it("can emit schema without rendering a duplicate navigation landmark", () => {
    const { container } = render(<Breadcrumb items={items} />);

    expect(container.querySelector("nav")).not.toBeInTheDocument();
    expect(container.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JsonLd, { serializeJsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("escapes values that could leave the HTML script context", () => {
    const unsafe = "Domates </script><script>alert('x')</script> & fiyat\u2028satırı\u2029";
    const serialized = serializeJsonLd({ name: unsafe });

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).not.toContain("\u2028");
    expect(serialized).not.toContain("\u2029");
    expect(JSON.parse(serialized)).toEqual({ name: unsafe });
  });

  it("emits one parseable schema.org script", () => {
    const { container } = render(
      <JsonLd type="Dataset" data={{ name: "Hal </script> fiyatları" }} />,
    );
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const schema = JSON.parse(scripts[0]?.textContent ?? "{}");

    expect(scripts).toHaveLength(1);
    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Hal </script> fiyatları",
    });
  });
});

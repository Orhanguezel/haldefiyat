import { describe, expect, test } from "bun:test";

import { classifyMailFailure, renderPressCampaign } from "./delivery";

describe("press delivery rendering", () => {
  test("creates safe html and a complete plain text alternative", () => {
    const rendered = renderPressCampaign("Merhaba <Editör>,\n\n• İlk veri\nhttps://haldefiyat.com/endeks", "editor@example.com");
    expect(rendered.html).toContain("Merhaba &lt;Editör&gt;,");
    expect(rendered.html).toContain("<li");
    expect(rendered.html).toContain("https://haldefiyat.com/endeks");
    expect(rendered.html).toContain("/abonelik?e=");
    expect(rendered.html).toContain("logohaldefiyat_light.png");
    expect(rendered.html).not.toContain("background:#166534");
    expect(rendered.html).toContain("HaldeFiyat Veri Ekibi");
    expect(rendered.text).toContain("Merhaba <Editör>");
    expect(rendered.text).toContain("abonelikten çıkabilirsiniz");
  });

  test("replaces a legacy typed signature with the managed brand signature", () => {
    const rendered = renderPressCampaign("İçerik\n\nSaygılarımızla,\nHaldeFiyat Veri Ekibi\nhttps://haldefiyat.com\ninfo@gzlteknoloji.com");
    expect(rendered.text.match(/Saygılarımızla,/g)).toHaveLength(1);
    expect(rendered.html.match(/HaldeFiyat Veri Ekibi/g)).toHaveLength(1);
  });

  test("renders an embedded CID logo for real mail without changing browser previews", () => {
    const rendered = renderPressCampaign("İçerik", "editor@example.com", undefined, "cid:haldefiyat-logo@haldefiyat.com");
    expect(rendered.html).toContain('src="cid:haldefiyat-logo@haldefiyat.com"');
    expect(rendered.html).not.toContain('src="https://haldefiyat.com/logohaldefiyat_light.png"');
  });
});

describe("press mail failure classification", () => {
  test("suppresses a hard bounce", () => {
    expect(classifyMailFailure({ response: "550 5.1.1 user unknown", responseCode: 550 })).toEqual({
      class: "hard_bounce", retryable: false, suppress: true, pauseCampaign: false,
    });
  });

  test("does not retry an uncertain SMTP handoff", () => {
    expect(classifyMailFailure({ message: "socket timeout after DATA", responseCode: 550 })).toEqual({
      class: "uncertain", retryable: false, suppress: false, pauseCampaign: false,
    });
  });

  test("pauses the campaign on authentication errors", () => {
    expect(classifyMailFailure({ response: "535 Authentication failed" })).toEqual({
      class: "auth", retryable: false, suppress: false, pauseCampaign: true,
    });
  });
});

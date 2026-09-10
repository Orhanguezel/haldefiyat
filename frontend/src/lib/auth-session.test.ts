import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "./api-client";
import { loginWithEmail, rehydrateAuthSession } from "./auth";

const user = { id: "qa", email: "qa@example.invalid", full_name: "QA", role: "customer" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fetchMock = vi.fn();
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("vs_access_token", "expired");
  localStorage.setItem("app-auth", JSON.stringify({ user }));
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("returning user session", () => {
  it("renews an expired token and retries the original request", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "invalid_token" }, 401))
      .mockResolvedValueOnce(json({ access_token: "renewed" }))
      .mockResolvedValueOnce(json({ user }));
    expect(await rehydrateAuthSession()).toEqual(user);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/token/refresh");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer renewed");
    expect(localStorage.getItem("vs_access_token")).toBe("renewed");
  });
  it("restores a cookie session when local storage has no access token", async () => {
    localStorage.clear();
    fetchMock.mockResolvedValueOnce(json({ access_token: "cookie-token", user }));
    expect(await rehydrateAuthSession()).toEqual(user);
    expect(fetchMock.mock.calls[0][0]).toContain("/auth/session/bootstrap");
    expect(localStorage.getItem("vs_access_token")).toBe("cookie-token");
  });
  it.each(["network", "server", "refresh-server"])("preserves the session during %s failures", async (failure) => {
    if (failure === "network") fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    else if (failure === "server") fetchMock.mockResolvedValueOnce(json({}, 503));
    else fetchMock.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json({}, 503));
    expect(await rehydrateAuthSession()).toEqual(user);
    expect(localStorage.getItem("vs_access_token")).toBe("expired");
  });
  it("clears the session only after refresh is rejected", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json({}, 401));
    expect(await rehydrateAuthSession()).toBeNull();
    expect(localStorage.getItem("app-auth")).toBeNull();
  });
  it("does not refresh or erase another session for incorrect login credentials", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: { message: "invalid_credentials" } }, 401));
    await expect(loginWithEmail({ email: "qa@example.invalid", password: "wrong-password" })).rejects.toMatchObject({ code: "invalid_credentials" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("app-auth")).not.toBeNull();
  });
  it("shares token refresh across concurrent requests", async () => {
    fetchMock.mockImplementation(async (url: string, options: RequestInit) => {
      if (url.endsWith("/token/refresh")) {
        await new Promise(resolve => setTimeout(resolve, 10));
        return json({ access_token: "renewed" });
      }
      return (options.headers as Record<string, string>).Authorization === "Bearer renewed" ? json({ ok: true }) : json({}, 401);
    });
    await expect(Promise.all([apiGet("/profiles/me"), apiGet("/auth/user")])).resolves.toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/token/refresh"))).toHaveLength(1);
  });
});

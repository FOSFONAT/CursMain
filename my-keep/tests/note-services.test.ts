import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authService,
  authSessionExpiredEvent,
  notesService,
  type User,
} from "../app/lib/note-services";

const accessTokenKey = "my-keep:api:access-token";
const sessionData = new Map<string, string>();
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionData.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    sessionData.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    sessionData.delete(key);
  }),
};
const dispatchEventMock = vi.fn();
const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  sessionData.clear();
  vi.clearAllMocks();
  vi.stubGlobal("window", {
    sessionStorage: sessionStorageMock,
    dispatchEvent: dispatchEventMock,
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API services", () => {
  it("logs in, returns the user, and stores the access token", async () => {
    const user: User = {
      id: "user-1",
      name: "Olena",
      email: "olena@example.com",
    };
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ user, accessToken: "token-123" }),
    );

    await expect(
      authService.login("olena@example.com", "password123"),
    ).resolves.toEqual(user);

    const [url, request] = fetchMock.mock.calls[0];
    expect(new URL(url.toString()).pathname).toBe("/api/auth/login");
    expect(request?.method).toBe("POST");
    expect(JSON.parse(String(request?.body))).toEqual({
      email: "olena@example.com",
      password: "password123",
    });
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      accessTokenKey,
      "token-123",
    );
  });

  it("clears an expired session and dispatches the expiry event on a 401", async () => {
    sessionData.set(accessTokenKey, "expired-token");
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ detail: "Сеанс завершився." }, 401),
    );

    await expect(notesService.list()).rejects.toThrow("Сеанс завершився.");

    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(accessTokenKey);
    expect(dispatchEventMock).toHaveBeenCalledOnce();
    expect(dispatchEventMock.mock.calls[0][0]).toMatchObject({
      type: authSessionExpiredEvent,
    });
  });
});

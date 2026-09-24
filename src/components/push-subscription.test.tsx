import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PushMenuItem, releasePushSubscription } from "./push-subscription";

describe("PushMenuItem", () => {
  it("offers an enable button that calls enable() when the browser supports push", async () => {
    const enable = vi.fn();
    render(<PushMenuItem supported status="idle" enable={enable} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktifkan Notifikasi" }));
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it("disables the button while enabling", () => {
    render(<PushMenuItem supported status="loading" enable={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Mengaktifkan..." })).toBeDisabled();
  });

  it("shows a status line instead of a button once subscribed", () => {
    render(<PushMenuItem supported status="subscribed" enable={vi.fn()} />);
    expect(screen.getByText("Notifikasi aktif")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("explains an unsupported browser without offering the button", () => {
    render(<PushMenuItem supported={false} status="idle" enable={vi.fn()} />);
    expect(screen.getByText("Notifikasi tidak didukung browser ini")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the button and shows the permission hint after an error", () => {
    render(<PushMenuItem supported status="error" enable={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Aktifkan Notifikasi" })).toBeEnabled();
    expect(screen.getByText(/Izin notifikasi ditolak/)).toBeInTheDocument();
  });
});

describe("releasePushSubscription", () => {
  const endpoint = "https://push.example/abc";

  function stubBrowser(getSubscription: () => Promise<unknown>, hasRegistration = true) {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistration: async () => (hasRegistration ? { pushManager: { getSubscription } } : undefined) },
    });
    Object.defineProperty(window, "PushManager", { configurable: true, value: function PushManager() {} });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    // @ts-expect-error -- lepas stub supaya tes lain melihat browser tanpa push
    delete navigator.serviceWorker;
    // @ts-expect-error -- idem
    delete window.PushManager;
  });

  // Bug sweep 24 Sep: logout gak melepas langganan, HP bekas login tetap
  // menerima notifikasi akun sebelumnya.
  it("tells the server to drop this browser's subscription before logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    stubBrowser(async () => ({ endpoint }));
    await releasePushSubscription();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/push/unsubscribe");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ endpoint });
  });

  it("does nothing when the browser never subscribed", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    stubBrowser(async () => null);
    await releasePushSubscription();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when no service worker is registered", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    stubBrowser(async () => ({ endpoint }), false);
    await releasePushSubscription();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when the browser has no push support", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await releasePushSubscription();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never blocks logout when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    stubBrowser(async () => ({ endpoint }));
    await expect(releasePushSubscription()).resolves.toBeUndefined();
  });

  it("gives up after 3 seconds when the request hangs", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    stubBrowser(async () => ({ endpoint }));
    let done = false;
    const p = releasePushSubscription().then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(2900);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    await p;
    expect(done).toBe(true);
  });
});

import { afterEach, describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Reveal } from "./reveal";

type Callback = (entries: { isIntersecting: boolean }[]) => void;

function mockObserver() {
  const state = { cb: null as Callback | null, disconnect: vi.fn<() => void>() };
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: Callback) {
        state.cb = cb;
      }
      observe() {}
      disconnect() {
        state.disconnect();
      }
    },
  );
  return state;
}

afterEach(() => vi.unstubAllGlobals());

describe("Reveal", () => {
  it("markup awal sama untuk semua pengguna: ada data-reveal, belum data-visible (server = browser)", () => {
    mockObserver();
    const { container } = render(<Reveal delay={120}>isi</Reveal>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.hasAttribute("data-reveal")).toBe(true);
    expect(el.dataset.visible).toBeUndefined();
    expect(el.style.getPropertyValue("--reveal-delay")).toBe("120ms");
    expect(el.textContent).toBe("isi");
  });

  it("belum masuk layar: tetap belum ditandai; masuk layar: ditandai dan pengamat dilepas", () => {
    const s = mockObserver();
    const { container } = render(<Reveal>isi</Reveal>);
    const el = container.firstElementChild as HTMLElement;
    s.cb?.([{ isIntersecting: false }]);
    expect(el.dataset.visible).toBeUndefined();
    s.cb?.([{ isIntersecting: true }]);
    expect(el.dataset.visible).toBe("true");
    expect(s.disconnect).toHaveBeenCalled();
  });

  it("browser tanpa IntersectionObserver: langsung ditandai terlihat (tidak tertinggal tersembunyi)", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<Reveal>isi</Reveal>);
    expect((container.firstElementChild as HTMLElement).dataset.visible).toBe("true");
  });
});

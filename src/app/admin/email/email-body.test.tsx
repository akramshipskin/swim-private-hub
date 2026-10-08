import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EmailBody, { fitFrame } from "./email-body";

function fakeDoc(scrollHeight: number, scrollWidth = 300, bodyHeight = scrollHeight) {
  return {
    body: { scrollHeight: bodyHeight },
    documentElement: { scrollHeight, scrollWidth },
    fonts: undefined,
    querySelectorAll: () => [],
  } as unknown as Document;
}

describe("fitFrame", () => {
  it("memakai tinggi isi asli ditambah jarak", () => {
    const el = document.createElement("iframe");
    Object.defineProperty(el, "contentDocument", { value: fakeDoc(400) });
    fitFrame(el);
    expect(el.style.height).toBe("408px");
  });

  it("tidak mengecil di bawah 60 px dan tidak melewati 8000 px", () => {
    const el = document.createElement("iframe");
    Object.defineProperty(el, "contentDocument", { value: fakeDoc(10), configurable: true });
    fitFrame(el);
    expect(el.style.height).toBe("60px");
    Object.defineProperty(el, "contentDocument", { value: fakeDoc(99999), configurable: true });
    fitFrame(el);
    expect(el.style.height).toBe("8000px");
  });

  it("email lebih lebar dari bingkai: bingkai melebar, bukan dipotong", () => {
    const el = document.createElement("iframe");
    Object.defineProperty(el, "clientWidth", { value: 250 });
    Object.defineProperty(el, "contentDocument", { value: fakeDoc(400, 624) });
    fitFrame(el);
    expect(el.style.width).toBe("624px");
  });

  it("dokumen belum ada: tidak melakukan apa-apa", () => {
    const el = document.createElement("iframe");
    el.style.height = "120px";
    Object.defineProperty(el, "contentDocument", { value: null });
    fitFrame(el);
    expect(el.style.height).toBe("120px");
  });
});

describe("EmailBody", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("tinggi tetap disesuaikan walau event load bingkai terlewat (selesai sebelum halaman hidup)", () => {
    const spy = vi.spyOn(HTMLIFrameElement.prototype, "contentDocument", "get").mockReturnValue(fakeDoc(500));
    const { container } = render(<EmailBody srcDoc="<p>x</p>" />);
    const frame = container.querySelector("iframe")!;
    expect(frame.style.height).toBe("120px"); // tidak ada event load sama sekali
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(frame.style.height).toBe("508px");
    spy.mockRestore();
  });

  it("memakai sandbox tanpa izin skrip dan form", () => {
    const { container } = render(<EmailBody srcDoc="<p>x</p>" />);
    const sandbox = container.querySelector("iframe")!.getAttribute("sandbox")!;
    expect(sandbox).not.toMatch(/allow-scripts|allow-forms/);
  });
});

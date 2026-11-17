import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the function after the delay", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced("hello");

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(callback).toHaveBeenCalledExactlyOnceWith("hello");
  });

  it("resets the timer when called again before the delay", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced("first");
    vi.advanceTimersByTime(200);
    debounced("second");
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledExactlyOnceWith("second");
  });

  it("preserves the latest arguments", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced("old", 1);
    debounced("latest", 2);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledExactlyOnceWith("latest", 2);
  });

  it("cancels a pending invocation", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced("pending");
    debounced.cancel();
    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it("flushes the latest invocation immediately and only once", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced("first");
    debounced("latest");
    debounced.flush();
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledExactlyOnceWith("latest");
  });
});

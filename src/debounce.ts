export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  cancel(): void;
  flush(): void;
}

export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): DebouncedFunction<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: Args | undefined;

  const invoke = (): void => {
    if (latestArgs === undefined) return;
    const args = latestArgs;
    latestArgs = undefined;
    timer = undefined;
    callback(...args);
  };

  const debounced = ((...args: Args): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }

    latestArgs = args;
    timer = setTimeout(invoke, delay);
  }) as DebouncedFunction<Args>;

  debounced.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    latestArgs = undefined;
  };

  debounced.flush = (): void => {
    if (timer === undefined) return;
    clearTimeout(timer);
    invoke();
  };

  return debounced;
}

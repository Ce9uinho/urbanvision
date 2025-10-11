/**
 * A simple debounce function that delays invoking a function until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
  // Fix: Use `ReturnType<typeof setTimeout>` for browser compatibility instead of `NodeJS.Timeout`.
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
};
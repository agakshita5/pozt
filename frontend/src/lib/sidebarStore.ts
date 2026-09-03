const KEY = "postStudio.sidebarCollapsed";

let listeners: Array<() => void> = [];

/**
 * The collapsed flag lives in localStorage, which React cannot see. Reading it
 * in an effect would set state on mount and cascade a render, so it is exposed
 * as an external store instead and read with useSyncExternalStore.
 */
export const sidebarStore = {
  subscribe(callback: () => void) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  },

  getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  },

  // The server has no localStorage; start expanded and let the client correct it.
  getServerSnapshot(): boolean {
    return false;
  },

  toggle() {
    const next = !sidebarStore.getSnapshot();
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* private browsing, fall back to in-memory only */
    }
    listeners.forEach((l) => l());
  },
};

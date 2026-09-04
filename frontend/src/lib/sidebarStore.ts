const KEY = "pozt.sidebarCollapsed";

let listeners: Array<() => void> = [];

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

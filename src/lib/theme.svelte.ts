// src/lib/theme.svelte.ts
export type Theme = "light" | "dark" | "system";

let userTheme = $state<Theme>("system");

export const theme = {
  get current() {
    return userTheme;
  },
  set: (t: Theme) => {
    userTheme = t;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("theme", t);
    }
    updateDom(t);
  },
  init: () => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) userTheme = stored;
    }
    updateDom(userTheme);
  },
};

function updateDom(t: Theme) {
  if (typeof document === "undefined") return;

  const isDark =
    t === "dark" ||
    (t === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
}

"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cvopencode-theme";
const CHANGE_EVENT = "cvopencode-theme-change";
const query = "(prefers-color-scheme: dark)";

function subscribe(callback) {
  const media = window.matchMedia(query);
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia(query).matches ? "dark" : "light";
}

function getServerSnapshot() {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? "Ativar tema claro" : "Ativar tema escuro";

  function toggle() {
    const next = isDark ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Sun
        aria-hidden="true"
        className="size-4 transition-opacity dark:opacity-0"
      />
      <Moon
        aria-hidden="true"
        className="absolute size-4 opacity-0 transition-opacity dark:opacity-100"
      />
    </Button>
  );
}

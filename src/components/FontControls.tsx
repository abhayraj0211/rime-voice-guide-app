import { useEffect, useState } from "react";
import { ALargeSmall } from "lucide-react";

const STORAGE_KEY = "voiceguide-font-scale";

/** Dynamic type control — the whole page scales from the root font size. */
export function FontControls() {
  const [scale, setScale] = useState(100);

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved >= 80 && saved <= 200) setScale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-scale", `${scale}%`);
    localStorage.setItem(STORAGE_KEY, String(scale));
  }, [scale]);

  return (
    <div className="flex items-center gap-3">
      <ALargeSmall className="size-5 text-primary" aria-hidden="true" />
      <label htmlFor="font-scale" className="text-sm text-muted-foreground">
        Text size
      </label>
      <input
        id="font-scale"
        type="range"
        min={80}
        max={180}
        step={10}
        value={scale}
        onChange={(event) => setScale(Number(event.target.value))}
        className="h-11 w-32 accent-[var(--color-primary)]"
      />
      <span className="w-12 text-sm text-muted-foreground">{scale}%</span>
    </div>
  );
}

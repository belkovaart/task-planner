import type { Dispatch, SetStateAction } from "react";

interface Tweaks {
  accent: "amber" | "blue" | "plum" | "moss";
  density: "compact" | "comfortable";
}

interface TweaksPanelProps {
  open: boolean;
  tweaks: Tweaks;
  setTweaks: Dispatch<SetStateAction<Tweaks>>;
}

export type { Tweaks };

export default function TweaksPanel({ open, tweaks, setTweaks }: TweaksPanelProps) {
  if (!open) return null;

  const accents = [
    { key: "amber", color: "#2563eb" },
    { key: "blue", color: "#0891b2" },
    { key: "plum", color: "#7c3aed" },
    { key: "moss", color: "#059669" },
  ] as const;

  return (
    <div className="tweaks-panel open">
      <h4>Настройки интерфейса</h4>
      <div className="tweak-row">
        <label>Акцент выбора</label>
        <div className="tweak-swatches">
          {accents.map((accent) => (
            <div
              key={accent.key}
              className={`tweak-sw ${tweaks.accent === accent.key ? "active" : ""}`}
              style={{ background: accent.color }}
              onClick={() => setTweaks((prev) => ({ ...prev, accent: accent.key }))}
            />
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Плотность</label>
        <div className="tweak-seg">
          {["compact", "comfortable"].map((density) => (
            <button
              key={density}
              className={tweaks.density === density ? "active" : ""}
              onClick={() => setTweaks((prev) => ({ ...prev, density: density as Tweaks["density"] }))}
            >
              {density === "compact" ? "Компакт" : "Комфорт"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

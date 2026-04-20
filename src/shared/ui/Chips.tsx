import type { CSSProperties } from "react";

interface ChipOption {
  key: string;
  label: string;
}

interface ChipsProps {
  value: string;
  options: ChipOption[];
  onChange: (value: string) => void;
  scheme?: "status" | "priority";
}

export default function Chips({ value, options, onChange, scheme }: ChipsProps) {
  const schemeFor = (key: string) => {
    if (scheme === "status") {
      return {
        planned: {
          bg: "var(--planned-bg)",
          border: "var(--planned-border)",
          ink: "var(--ink-2)",
          dot: "var(--planned)",
        },
        progress: {
          bg: "var(--progress-bg)",
          border: "var(--progress-border)",
          ink: "var(--progress-ink)",
          dot: "var(--progress)",
        },
        done: {
          bg: "var(--done-bg)",
          border: "var(--done-border)",
          ink: "var(--done-ink)",
          dot: "var(--done)",
        },
        paused: {
          bg: "var(--paused-bg)",
          border: "var(--line-3)",
          ink: "var(--ink-3)",
          dot: "var(--paused)",
        },
      }[key];
    }

    if (scheme === "priority") {
      return {
        low: {
          bg: "var(--bg)",
          border: "var(--line-3)",
          ink: "var(--ink-2)",
          dot: "var(--p-low)",
        },
        med: {
          bg: "var(--progress-bg)",
          border: "var(--progress-border)",
          ink: "var(--progress-ink)",
          dot: "var(--p-med)",
        },
        high: {
          bg: "var(--conflict-bg)",
          border: "var(--conflict-border)",
          ink: "var(--conflict)",
          dot: "var(--p-high)",
        },
      }[key];
    }

    return {
      bg: "var(--selection-bg)",
      border: "var(--selection)",
      ink: "var(--selection)",
      dot: "var(--selection)",
    };
  };

  return (
    <div className="chips">
      {options.map((option) => {
        const active = value === option.key;
        const style = schemeFor(option.key);

        return (
          <button
            key={option.key}
            type="button"
            className={`chip ${active ? "active" : ""}`}
            style={
              {
                "--chip-dot": style?.dot,
                "--chip-active-bg": style?.bg,
                "--chip-active-border": style?.border,
                "--chip-active-ink": style?.ink,
              } as CSSProperties
            }
            onClick={() => onChange(option.key)}
          >
            <span className="dot" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

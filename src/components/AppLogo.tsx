import { getThemeSettings } from "@/lib/theme";
import { useMemo } from "react";

interface AppLogoProps {
  size?: "sm" | "lg";
  className?: string;
}

const FONT_MAP: Record<string, string> = {
  "Syne": "'Syne', sans-serif",
  "Space Grotesk": "'Space Grotesk', sans-serif",
  "DM Sans": "'DM Sans', sans-serif",
  "Inter": "'Inter', sans-serif",
  "monospace": "'JetBrains Mono', monospace",
};

export function AppLogo({ size = "sm", className = "" }: AppLogoProps) {
  const branding = useMemo(() => getThemeSettings().branding, []);
  const name = branding.name || "SYNTRA";
  const split = branding.splitPoint ?? 3;
  const font = FONT_MAP[branding.font] || FONT_MAP["Syne"];

  const part1 = name.slice(0, split);
  const part2 = name.slice(split);

  const isLg = size === "lg";

  return (
    <span
      className={`font-extrabold tracking-[-0.04em] ${className}`}
      style={{
        fontFamily: font,
        fontSize: isLg ? "52px" : "24px",
        lineHeight: 1,
      }}
    >
      <span className="text-primary" style={isLg ? { textShadow: "0 0 30px hsl(var(--green) / 0.6)" } : undefined}>
        {part1}
      </span>
      <span className="text-foreground">{part2}</span>
      {!isLg && (
        <span className="font-mono text-[9px] text-syntra-text3 tracking-[0.1em] ml-1.5 align-middle font-normal">
          v2
        </span>
      )}
    </span>
  );
}

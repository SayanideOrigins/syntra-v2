import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      navigate("/home", { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Radial glow backgrounds */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(34,197,94,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(34,197,94,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Pulsing orb */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full top-1/2 left-1/2"
        style={{
          background: "radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)",
          animation: "pulse-orb 3s ease-in-out infinite",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 text-center">
        <h1 className="font-head text-[52px] font-extrabold tracking-[-0.04em] leading-none">
          <span className="text-primary" style={{ textShadow: "0 0 30px rgba(34,197,94,0.6)" }}>
            SYN
          </span>
          <span className="text-foreground">TRA</span>
        </h1>
        <p className="font-mono text-[11px] text-syntra-text3 uppercase tracking-[0.25em] mt-2.5">
          AI Orchestration · v2
        </p>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-12 flex gap-1.5 z-10">
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary"
          style={{ animation: "dot-bounce 1.4s ease-in-out infinite" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: "rgba(34,197,94,0.5)",
            animation: "dot-bounce 1.4s ease-in-out infinite",
            animationDelay: "0.2s",
          }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: "rgba(34,197,94,0.25)",
            animation: "dot-bounce 1.4s ease-in-out infinite",
            animationDelay: "0.4s",
          }}
        />
      </div>
    </div>
  );
}

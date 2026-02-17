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
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-primary">SYN</span>
          <span className="text-foreground">TRA</span>
        </h1>
        <p className="text-muted-foreground text-sm text-center mt-2">v2</p>
      </div>
    </div>
  );
}

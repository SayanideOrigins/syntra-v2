import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      navigate("/home", { replace: true });
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-syntra-text2 mb-4">Loading recovery session...</p>
          <button onClick={() => navigate("/auth")} className="text-primary font-mono text-[12px] hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="font-head text-[42px] font-extrabold tracking-[-0.04em]">
            <span className="text-primary" style={{ textShadow: "0 0 30px hsl(var(--green) / 0.6)" }}>SYN</span>
            <span className="text-foreground">TRA</span>
          </h1>
        </div>
        <div className="bg-surface border border-border rounded-[16px] p-5">
          <h2 className="font-head text-lg font-bold mb-4">Reset Password</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-mono text-[10px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
              />
            </div>
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 bg-primary rounded-[12px] font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all disabled:opacity-50"
              style={{ boxShadow: "0 4px 20px hsl(var(--green) / 0.35)" }}
            >
              {loading ? "..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

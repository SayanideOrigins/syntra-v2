import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/home", { replace: true });
    });
  }, [navigate]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/home", { replace: true });
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      setSignupSuccess(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (result.error) {
      toast({ title: "Google sign in failed", description: String(result.error), variant: "destructive" });
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email for a password reset link" });
      setShowForgot(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-surface border border-border rounded-[16px] p-6 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="font-head text-lg font-bold mb-2">Check your email</h2>
          <p className="text-sm text-syntra-text2 font-light mb-4">
            We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>. Click the link to activate your account.
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setTab("signin"); }}
            className="text-primary font-mono text-[12px] hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-head text-[42px] font-extrabold tracking-[-0.04em]">
            <span className="text-primary" style={{ textShadow: "0 0 30px hsl(var(--green) / 0.6)" }}>SYN</span>
            <span className="text-foreground">TRA</span>
          </h1>
          <p className="font-mono text-[11px] text-syntra-text3 uppercase tracking-[0.25em] mt-1">
            AI Orchestration · v2
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface border border-border rounded-[16px] p-5">
          {/* Tabs */}
          <div className="flex gap-1 mb-5">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 py-2 rounded-[10px] font-mono text-[12px] font-medium transition-all ${
                tab === "signin"
                  ? "bg-primary text-black"
                  : "bg-surface-2 text-syntra-text2 hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-2 rounded-[10px] font-mono text-[12px] font-medium transition-all ${
                tab === "signup"
                  ? "bg-primary text-black"
                  : "bg-surface-2 text-syntra-text2 hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-mono text-[10px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && tab === "signin" && handleSignIn()}
              />
            </div>

            {tab === "signup" && (
              <div>
                <label className="font-mono text-[10px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
            )}

            <button
              onClick={tab === "signin" ? handleSignIn : handleSignUp}
              disabled={loading}
              className="w-full py-3 bg-primary rounded-[12px] font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all disabled:opacity-50"
              style={{ boxShadow: "0 4px 20px hsl(var(--green) / 0.35)" }}
            >
              {loading ? "..." : tab === "signin" ? "Sign In" : "Create Account"}
            </button>

            {tab === "signin" && (
              <button
                onClick={() => showForgot ? handleForgotPassword() : setShowForgot(true)}
                className="text-[12px] text-syntra-text2 hover:text-primary font-mono transition-colors"
              >
                {showForgot ? "Send reset link" : "Forgot password?"}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[10px] text-syntra-text3 uppercase">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-2 border border-border rounded-[10px] text-[13px] font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

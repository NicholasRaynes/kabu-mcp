import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { safeRedirectPath, supabase } from "./supabase";

export function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectPath = safeRedirectPath(params.get("redirect"));

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate(redirectPath, { replace: true });
    });
  }, [navigate, redirectPath]);

  const returnUrl = `${window.location.origin}${redirectPath}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: returnUrl },
        });
        if (error) throw error;
        if (data.session) {
          navigate(redirectPath, { replace: true });
        } else {
          setNotice("Check your email to confirm your account, then return to this browser.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <h1>Kabu MCP</h1>
      <p className="muted">{mode === "signin" ? "Sign in to continue" : "Create your account"}</p>

      <form onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <p className="muted">
        {mode === "signin" ? "No account?" : "Already have an account?"}{" "}
        <button type="button" className="link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </main>
  );
}

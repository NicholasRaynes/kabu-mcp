import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AuthCard } from "@/components/AuthCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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

  const signin = mode === "signin";

  return (
    <AuthCard
      title={signin ? "Welcome!" : "Create your account"}
      description={
        signin
          ? "Sign in to connect Kabu MCP to your AI assistant."
          : "Sign up to connect Kabu MCP to your AI assistant."
      }
      footer={
        <span>
          {signin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => setMode(signin ? "signup" : "signin")}
          >
            {signin ? "Sign up" : "Sign in"}
          </Button>
        </span>
      }
    >
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={signin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Spinner />}
              {signin ? "Sign in" : "Sign up"}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
    </AuthCard>
  );
}

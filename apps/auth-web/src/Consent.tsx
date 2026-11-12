import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AuthCard } from "@/components/AuthCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "./supabase";

interface ConsentDetails {
  authorization_id: string;
  client: { name: string };
  redirect_uri: string;
  scope?: string;
}

export function Consent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id");

  const [details, setDetails] = useState<ConsentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authorizationId) {
      setError("Missing authorization_id.");
      return;
    }
    const id = authorizationId;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        const back = `/oauth/consent?authorization_id=${encodeURIComponent(id)}`;
        navigate(`/login?redirect=${encodeURIComponent(back)}`, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
      if (error || !data) {
        setError(error?.message ?? "Invalid authorization request.");
        return;
      }
      // Previously consented: Supabase returns only a redirect URL.
      if (!("authorization_id" in data)) {
        window.location.href = (data as { redirect_url: string }).redirect_url;
        return;
      }
      setDetails(data as unknown as ConsentDetails);
    }

    load();
  }, [authorizationId, navigate]);

  async function decide(approve: boolean) {
    if (!authorizationId) return;
    setBusy(true);
    const { data, error } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (error || !data) {
      setError(error?.message ?? "Request failed.");
      setBusy(false);
      return;
    }
    window.location.href = data.redirect_url;
  }

  async function switchAccount() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (error) {
    return (
      <AuthCard title="Authorization error">
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }
  if (!details) {
    return (
      <AuthCard>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Loading...
        </div>
      </AuthCard>
    );
  }

  const scopes = (details.scope ?? "").split(" ").filter(Boolean);

  return (
    <AuthCard
      title={`Authorize ${details.client.name}`}
      description="This application wants to access Kabu MCP on your behalf."
      footer={
        <span>
          Wrong account?{" "}
          <Button type="button" variant="link" className="h-auto p-0" onClick={switchAccount}>
            Sign out
          </Button>
        </span>
      }
    >
      <div className="grid gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground">Redirects to</span>
        <code className="break-all text-xs">{details.redirect_uri}</code>
      </div>

      {scopes.length > 0 && (
        <>
          <Separator />
          <div className="grid gap-3 text-sm">
            <span className="font-medium">Requested permissions</span>
            <ul className="grid gap-2">
              {scopes.map((s) => (
                <li key={s} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="size-4 text-foreground" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" disabled={busy} onClick={() => decide(false)}>
          Deny
        </Button>
        <Button type="button" disabled={busy} onClick={() => decide(true)}>
          {busy && <Spinner />}
          Approve
        </Button>
      </div>
    </AuthCard>
  );
}

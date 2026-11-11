import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
      <main className="card">
        <h1>Authorization error</h1>
        <p className="error">{error}</p>
      </main>
    );
  }
  if (!details) {
    return (
      <main className="card">
        <p className="muted">Loading...</p>
      </main>
    );
  }

  const scopes = (details.scope ?? "").split(" ").filter(Boolean);

  return (
    <main className="card">
      <h1>Authorize {details.client.name}</h1>
      <p className="muted">This application wants to access Kabu MCP on your behalf.</p>
      <p>
        <strong>Redirects to:</strong> <code>{details.redirect_uri}</code>
      </p>
      {scopes.length > 0 && (
        <>
          <strong>Requested permissions:</strong>
          <ul>
            {scopes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      )}
      <div className="row">
        <button type="button" disabled={busy} onClick={() => decide(true)}>
          Approve
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={() => decide(false)}>
          Deny
        </button>
      </div>
      <p className="muted">
        Wrong account?{" "}
        <button type="button" className="link" onClick={switchAccount}>
          Sign out
        </button>
      </p>
    </main>
  );
}

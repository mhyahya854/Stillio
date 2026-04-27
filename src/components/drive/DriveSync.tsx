import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type User = { id?: string; email?: string; name?: string; picture?: string } | null;

const DriveSync = () => {
  const AUTH_URL = (import.meta.env.VITE_AUTH_URL as string) || "http://localhost:3000";
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  }, [AUTH_URL]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const onSignIn = () => {
    window.location.href = `${AUTH_URL}/api/auth/login`;
  };

  const onSignOut = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${AUTH_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
      if (res.ok) {
        setUser(null);
        setStatus("Signed out");
      } else {
        setStatus("Sign out failed");
      }
    } catch (err) {
      setStatus("Sign out error");
    }
    setLoading(false);
  };

  const onSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const payload = { message: "test save from app", timestamp: Date.now() };
      const res = await fetch(`${AUTH_URL}/api/drive/save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        setStatus(`Saved (fileId: ${json.fileId})`);
      } else {
        const txt = await res.text();
        setStatus(`Save failed: ${txt}`);
      }
    } catch (err) {
      setStatus("Save exception");
    }
    setLoading(false);
  };

  const onLoad = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${AUTH_URL}/api/drive/load`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setStatus("Loaded");
      } else {
        const txt = await res.text();
        setStatus(`Load failed: ${txt}`);
      }
    } catch (err) {
      setStatus("Load exception");
    }
    setLoading(false);
  };

  const onDelete = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${AUTH_URL}/api/drive/delete`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setStatus("Deleted");
        setData(null);
      } else {
        const txt = await res.text();
        setStatus(`Delete failed: ${txt}`);
      }
    } catch (err) {
      setStatus("Delete exception");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/72 px-3 py-2 text-right backdrop-blur-xl">
      {user ? (
        <div>
          <div className="text-xs text-slate-300">Signed in as {user.email}</div>
          <div className="mt-2 flex gap-2 justify-end">
            <Button size="sm" onClick={onSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to Drive"}
            </Button>
            <Button size="sm" onClick={onLoad} disabled={loading}>
              Load
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete} disabled={loading}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={onSignOut} disabled={loading}>
              Sign out
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-400">{status}</div>
          {data && (
            <pre className="mt-2 text-xs text-left max-h-40 overflow-auto text-slate-300">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      ) : (
        <div>
          <div className="text-xs text-slate-300">Not signed in</div>
          <div className="mt-2 flex gap-2 justify-end">
            <Button size="sm" onClick={onSignIn}>
              Sign in with Google
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-400">{status}</div>
        </div>
      )}
    </div>
  );
};

export default DriveSync;

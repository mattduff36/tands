"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";

  useEffect(() => {
    // Add cache-busting timestamp to prevent cached responses
    const timestamp = Date.now();
    fetch(`/api/csrf?t=${timestamp}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.token))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Add cache-busting and force fresh request
      const timestamp = Date.now();
      const res = await fetch(`/api/login?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({ username, password, csrfToken }),
      });

      if (res.status === 204) {
        setIsRedirecting(true);
        // Keep loading state active during redirect
        // Small delay to ensure session is fully established, then redirect
        setTimeout(() => {
          // Clear any cached data and force a fresh page load
          if ("caches" in window) {
            caches.keys().then((names) => {
              names.forEach((name) => caches.delete(name));
            });
          }
          // Use window.location for a more reliable redirect with cache busting
          window.location.href = `${next}?t=${Date.now()}`;
        }, 300);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Login failed");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Login failed");
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        padding: "48px 16px",
      }}
    >
      <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          T&S Admin Portal
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "32px" }}>
          Sign in to access the admin dashboard
        </p>

        <div
          style={{
            backgroundColor: "white",
            padding: "32px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "24px",
            }}
          >
            Admin Sign In
          </h2>

          <form onSubmit={onSubmit} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
                }
                placeholder="username (no spaces, lowercase only)"
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "16px",
                  textTransform: "lowercase",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "16px",
                }}
              />
            </div>

            <input type="hidden" value={csrfToken} readOnly />

            <button
              type="submit"
              disabled={isLoading || isRedirecting}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor: isRedirecting ? "#10b981" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: isLoading || isRedirecting ? "not-allowed" : "pointer",
                opacity: isLoading || isRedirecting ? 0.7 : 1,
              }}
            >
              {isRedirecting
                ? "Success! Redirecting..."
                : isLoading
                  ? "Signing in..."
                  : "Sign in"}
            </button>
          </form>

          {error ? (
            <p
              style={{ marginTop: "16px", fontSize: "14px", color: "#dc2626" }}
            >
              {error}
            </p>
          ) : null}

          <p style={{ marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
            Only authorized administrators can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

const TABLE_CANDIDATES = [
  "onboarding_submissions",
  "onboarding",
  "onboarding_forms",
  "onboarding_form",
  "rep_onboarding",
  "rep_onboarding_forms",
];

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [row, setRow] = useState<any>(null);
  const [message, setMessage] = useState("Checking access...");
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", user.email)
      .single();

    if (profileError || !profile?.role) {
      setChecking(false);
      setMessage("Could not load role.");
      return;
    }

    const role = profile.role;

    if (role === "admin" || role === "assistant_admin") {
      setAuthorized(true);
      setChecking(false);
      fetchRow(String(params.id));
      return;
    }

    if (role === "team_leader") {
      router.push("/team-dashboard");
      return;
    }

    if (role === "rep") {
      router.push("/rep-dashboard");
      return;
    }

    router.push("/login");
  }

  async function findWorkingTableForId(id: string) {
    const fromQuery = searchParams.get("table");
    const candidates = fromQuery
      ? [fromQuery, ...TABLE_CANDIDATES.filter((t) => t !== fromQuery)]
      : TABLE_CANDIDATES;

    for (const candidate of candidates) {
      const { data, error } = await supabase
        .from(candidate)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) return data;

      const msg = String(error?.message || "").toLowerCase();
      const missingTable =
        msg.includes("could not find the table") ||
        msg.includes("schema cache");

      if (error && !missingTable) {
        setMessage(error.message);
        return null;
      }
    }

    return null;
  }

  async function fetchRow(id: string) {
    setMessage("Loading submission...");
    const found = await findWorkingTableForId(id);

    if (!found) {
      setMessage("Submission not found.");
      return;
    }

    setRow(found);
    setMessage("");
  }

  if (checking) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: "24px", fontFamily: "system-ui" }}>{message}</div>
      </div>
    );
  }

  if (!authorized) return null;

  if (!row) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: "24px", fontFamily: "system-ui" }}>{message}</div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />
      <div style={{ padding: "24px", marginTop: "10px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <button
            onClick={() => router.push("/admin")}
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Back
          </button>

          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "22px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <h1 style={{ fontSize: "28px", fontWeight: 700, marginTop: 0, marginBottom: "18px" }}>
              Submission Details
            </h1>

            <div style={{ display: "grid", gap: "10px" }}>
              <div><strong>Name:</strong> {row.name || "-"}</div>
              <div><strong>Email:</strong> {row.email || "-"}</div>
              <div><strong>Phone:</strong> {row.phone || "-"}</div>
              <div><strong>Coordinator:</strong> {row.coordinator || "-"}</div>
              <div><strong>Team:</strong> {row.team || "-"}</div>
              <div><strong>ISP:</strong> {row.isp || "-"}</div>
              <div><strong>Status:</strong> {row.status || "-"}</div>
              <div><strong>Created:</strong> {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
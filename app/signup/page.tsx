"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

const TABLE_CANDIDATES = [
  "onboarding_forms",
  "onboarding_submissions",
  "onboarding",
  "onboarding_forms",
  "onboarding_form",
  "rep_onboarding",
  "rep_onboarding_forms",
];

export default function Page() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("Checking access...");
  const [tableName, setTableName] = useState("");

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
      fetchRows();
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

  async function findWorkingTable() {
    for (const candidate of TABLE_CANDIDATES) {
      const { error } = await supabase.from(candidate).select("*").limit(1);

      if (!error) return candidate;

      const msg = String(error.message || "").toLowerCase();
      const missingTable =
        msg.includes("could not find the table") ||
        msg.includes("schema cache");

      if (!missingTable) return candidate;
    }

    return null;
  }

  async function fetchRows() {
    const workingTable = await findWorkingTable();

    if (!workingTable) {
      setMessage("Could not find onboarding table.");
      return;
    }

    setTableName(workingTable);

    const { data, error } = await supabase
      .from(workingTable)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const list = data || [];
    setRows(list);
    setMessage(`Loaded ${list.length} submission(s) from ${workingTable}.`);
  }

  async function updateStatus(id: string, status: string) {
    if (!tableName) return;

    const { error } = await supabase
      .from(tableName)
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    fetchRows();
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

  return (
    <div>
      <TopNav />
      <div style={{ padding: "24px", marginTop: "10px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, margin: 0, marginBottom: "6px" }}>
            Onboarding Admin Review
          </h1>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
            Review onboarding submissions and update statuses
          </div>

          <div style={msgBox}>{message}</div>

          <div style={card}>
            <div style={cardHeader}>Submissions</div>
            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr style={theadRow}>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Coordinator</th>
                    <th style={th}>Team</th>
                    <th style={th}>ISP</th>
                    <th style={th}>Status</th>
                    <th style={th}>Created</th>
                    <th style={th}>View</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={tbodyRow}>
                      <td style={td}>{row.full_name || row.name || "-"}</td>
                      <td style={td}>{row.email || "-"}</td>
                      <td style={td}>{row.phone || "-"}</td>
                      <td style={td}>
                        {row.onboarding_coordinator || row.coordinator || "-"}
                      </td>
                      <td style={td}>{row.team_name || row.team || "-"}</td>
                      <td style={td}>{row.isp || "-"}</td>
                      <td style={td}>
                        <span style={statusPill(row.status)}>
                          {row.status || "pending"}
                        </span>
                      </td>
                      <td style={td}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td style={td}>
                        <button
                          onClick={() =>
                            router.push(`/admin/${row.id}?table=${encodeURIComponent(tableName)}`)
                          }
                          style={tinyBtn("#111", "white")}
                        >
                          View
                        </button>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => updateStatus(row.id, "pending")}
                            style={tinyBtn("#e5e7eb", "#111")}
                          >
                            Pending
                          </button>
                          <button
                            onClick={() => updateStatus(row.id, "approved")}
                            style={tinyBtn("#16a34a", "white")}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(row.id, "needs_info")}
                            style={tinyBtn("#eab308", "white")}
                          >
                            Needs Info
                          </button>
                          <button
                            onClick={() => updateStatus(row.id, "rejected")}
                            style={tinyBtn("#dc2626", "white")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        style={{ padding: "24px", textAlign: "center", color: "#666" }}
                      >
                        No submissions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const msgBox = {
  marginBottom: "16px",
  fontSize: "14px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#334155",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
};

const cardHeader = {
  padding: "18px 20px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "16px",
  fontWeight: 600,
};

const table = {
  width: "100%",
  minWidth: "1100px",
  borderCollapse: "collapse" as const,
  fontSize: "14px",
};

const theadRow = {
  textAlign: "left" as const,
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const tbodyRow = {
  borderBottom: "1px solid #f1f5f9",
};

const th = {
  padding: "14px 16px",
  fontWeight: 600,
  color: "#374151",
};

const td = {
  padding: "14px 16px",
  color: "#111827",
};

function statusPill(status: string) {
  if (status === "approved") return pill("#dcfce7", "#166534");
  if (status === "rejected") return pill("#fee2e2", "#b91c1c");
  if (status === "needs_info") return pill("#fef3c7", "#92400e");
  return pill("#f3f4f6", "#374151");
}

function pill(bg: string, color: string) {
  return {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    background: bg,
    color,
  };
}

function tinyBtn(bg: string, color: string) {
  return {
    padding: "6px 10px",
    fontSize: "12px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };
}
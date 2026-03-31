"use client";

import { useEffect, useMemo, useState } from "react";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

export default function TeamDashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setMessage("Could not load user.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .single();

    if (profileError || !profile) {
      setMessage("Could not load team.");
      return;
    }

    const currentTeam = profile.team || "";
    setTeamName(currentTeam);

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const teamDeals = (data || []).filter((deal) => {
      return String(deal.team || "").toLowerCase() === String(currentTeam).toLowerCase();
    });

    setDeals(teamDeals);
  }

  const stats = useMemo(() => {
    return {
      total: deals.length,
      pending: deals.filter((d) => d.status === "pending").length,
      approved: deals.filter((d) => d.status === "approved").length,
      installed: deals.filter((d) => d.status === "installed").length,
    };
  }, [deals]);

  return (
    <div>
      <TopNav />

      <div
        style={{
          padding: "24px",
          marginTop: "10px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                margin: 0,
                marginBottom: "6px",
              }}
            >
              Team Dashboard
            </h1>

            <div style={{ fontSize: "14px", color: "#666" }}>
              {teamName ? `Team: ${teamName}` : "Loading team..."}
            </div>
          </div>

          {message && (
            <div
              style={{
                marginBottom: "16px",
                color: "red",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "14px",
              marginBottom: "22px",
            }}
          >
            <StatCard label="Total Deals" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Approved" value={stats.approved} />
            <StatCard label="Installed" value={stats.installed} />
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Team Deals
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1000px",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <th style={th}>Rep</th>
                    <th style={th}>Customer</th>
                    <th style={th}>Phone</th>
                    <th style={th}>ISP</th>
                    <th style={th}>Package</th>
                    <th style={th}>Address</th>
                    <th style={th}>Install</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={td}>{deal.rep || deal.rep_name || deal.email || "-"}</td>
                      <td style={td}>{deal.customer || deal.customer_name || "-"}</td>
                      <td style={td}>{deal.phone || "-"}</td>
                      <td style={td}>{deal.isp || "-"}</td>
                      <td style={td}>{deal.package || "-"}</td>
                      <td style={td}>{deal.address || "-"}</td>
                      <td style={td}>{deal.install_date || deal.installDate || "-"}</td>
                      <td style={td}>
                        <span style={statusPill(deal.status)}>
                          {deal.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {deals.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        No team deals yet.
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "30px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

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
  if (status === "approved") {
    return {
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "installed") {
    return {
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      background: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  if (status === "chargeback") {
    return {
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      background: "#fee2e2",
      color: "#b91c1c",
    };
  }

  return {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    background: "#f3f4f6",
    color: "#374151",
  };
}
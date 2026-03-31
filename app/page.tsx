"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

export default function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading...");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    loadHome();
  }, []);

  async function loadHome() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        router.push("/login");
        return;
      }

      setEmail(user.email);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (profileError) {
        setMessage("Could not load profile.");
        setLoading(false);
        return;
      }

      setName(profile?.full_name || profile?.name || "User");
      setRole(profile?.role || "");
      setTeam(profile?.team || "");

      const { data: allDeals, error: dealsError } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (dealsError) {
        setMessage(dealsError.message);
        setLoading(false);
        return;
      }

      setDeals(allDeals || []);
      setMessage("");
      setLoading(false);
    } catch (error) {
      console.error("Home load error:", error);
      setMessage("Something went wrong loading the dashboard.");
      setLoading(false);
    }
  }

  function roleLabel(value: string) {
    if (value === "team_leader") return "Team Leader";
    if (value === "assistant_admin") return "Assistant Admin";
    if (value === "admin") return "Admin";
    if (value === "rep") return "Rep";
    return value || "-";
  }

  const visibleDeals = useMemo(() => {
    if (role === "admin" || role === "assistant_admin") return deals;

    if (role === "team_leader") {
      return deals.filter(
        (deal) =>
          String(deal.team || "").toLowerCase() ===
          String(team || "").toLowerCase()
      );
    }

    if (role === "rep") {
      return deals.filter((deal) => {
        const emailField = String(deal.email || "").toLowerCase();
        const repEmailField = String(deal.rep_email || "").toLowerCase();
        const repField = String(deal.rep || "").toLowerCase();
        const repNameField = String(deal.rep_name || "").toLowerCase();
        const currentEmail = String(email || "").toLowerCase();

        return (
          emailField === currentEmail ||
          repEmailField === currentEmail ||
          repField === currentEmail ||
          repNameField === currentEmail
        );
      });
    }

    return [];
  }, [deals, role, team, email]);

  const stats = useMemo(() => {
    return {
      total: visibleDeals.length,
      pending: visibleDeals.filter((d) => d.status === "pending").length,
      approved: visibleDeals.filter((d) => d.status === "approved").length,
      installed: visibleDeals.filter((d) => d.status === "installed").length,
    };
  }, [visibleDeals]);

  return (
    <div>
      <TopNav />

      <div style={{ padding: "24px", marginTop: "10px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {loading ? (
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              {message}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <h1
                  style={{
                    fontSize: "34px",
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: "6px",
                  }}
                >
                  Welcome back, {name}
                </h1>

                <div style={{ fontSize: "14px", color: "#666" }}>
                  {roleLabel(role)} {team ? `• ${team}` : ""}{" "}
                  {email ? `• ${email}` : ""}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "14px",
                  marginBottom: "20px",
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
                  Recent Deals
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: "900px",
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
                        <th style={th}>Customer</th>
                        <th style={th}>ISP</th>
                        <th style={th}>Package</th>
                        <th style={th}>Rep</th>
                        <th style={th}>Team</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleDeals.slice(0, 8).map((deal) => (
                        <tr key={deal.id} style={tbodyRow}>
                          <td style={td}>{deal.customer || "-"}</td>
                          <td style={td}>{deal.isp || "-"}</td>
                          <td style={td}>{deal.package || "-"}</td>
                          <td style={td}>
                            {deal.rep_name || deal.rep_email || deal.email || deal.rep || "-"}
                          </td>
                          <td style={td}>{deal.team || "-"}</td>
                          <td style={td}>
                            <span style={statusPill(deal.status)}>
                              {deal.status || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {visibleDeals.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              padding: "24px",
                              textAlign: "center",
                              color: "#666",
                            }}
                          >
                            No deals found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
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

const tbodyRow = {
  borderBottom: "1px solid #f1f5f9",
};

function statusPill(status: string) {
  if (status === "approved") return pill("#dcfce7", "#166534");
  if (status === "installed") return pill("#dbeafe", "#1d4ed8");
  if (status === "chargeback") return pill("#fee2e2", "#b91c1c");
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
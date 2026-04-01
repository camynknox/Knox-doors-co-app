"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

export default function Page() {
  const router = useRouter();

  const [repEmail, setRepEmail] = useState("");
  const [repName, setRepName] = useState("");
  const [deals, setDeals] = useState<any[]>([]);
  const [message, setMessage] = useState("Loading dashboard...");
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      router.push("/login");
      return;
    }

    const cleanEmail = user.email.trim().toLowerCase();
    setRepEmail(cleanEmail);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
      setCheckingAccess(false);
      return;
    }

    const role = profile?.role || "";

    if (role === "admin" || role === "assistant_admin") {
      router.push("/admin-deals");
      return;
    }

    if (role === "team_leader") {
      router.push("/team-dashboard");
      return;
    }

    setRepName(profile?.full_name || "");

    const { data: onboarding, error: onboardingError } = await supabase
      .from("onboarding_forms")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (onboardingError) {
      setMessage(onboardingError.message);
      setCheckingAccess(false);
      return;
    }

    const onboardingComplete =
      !!onboarding &&
      !!onboarding.full_name &&
      !!onboarding.phone &&
      !!onboarding.onboarding_coordinator &&
      !!onboarding.team_name &&
      !!onboarding.isp &&
      !!onboarding.street_address &&
      !!onboarding.city &&
      !!onboarding.state &&
      !!onboarding.zip_code &&
      !!onboarding.country &&
      !!onboarding.shirt_size &&
      !!onboarding.bank_name &&
      !!onboarding.routing_number &&
      !!onboarding.account_number &&
      !!onboarding.date_of_birth &&
      !!onboarding.ssn &&
      !!onboarding.signature &&
      !!onboarding.background_check_consent;

    if (!onboardingComplete) {
      router.push("/onboarding");
      return;
    }

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setCheckingAccess(false);
      return;
    }

    const myDeals = (data || []).filter((deal) => {
      const emailField = String(deal.email || "").toLowerCase();
      const repField = String(deal.rep || "").toLowerCase();
      const repNameField = String(deal.rep_name || "").toLowerCase();
      const currentEmail = cleanEmail;

      return (
        emailField === currentEmail ||
        repField === currentEmail ||
        repNameField === currentEmail
      );
    });

    setDeals(myDeals);
    setMessage(`Loaded ${myDeals.length} deal(s).`);
    setCheckingAccess(false);
  }

  const stats = useMemo(() => {
    return {
      total: deals.length,
      pending: deals.filter((d) => d.status === "pending").length,
      approved: deals.filter((d) => d.status === "approved").length,
      installed: deals.filter((d) => d.status === "installed").length,
    };
  }, [deals]);

  if (checkingAccess) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: "24px", marginTop: "10px", fontFamily: "system-ui" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                color: "#334155",
              }}
            >
              Checking dashboard access...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />

      <div style={{ padding: "24px", marginTop: "10px", fontFamily: "system-ui" }}>
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
              My Dashboard
            </h1>

            <div style={{ fontSize: "14px", color: "#666" }}>
              {repName || "Rep"} {repEmail ? `• ${repEmail}` : ""}
            </div>
          </div>

          <div
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              color: "#334155",
            }}
          >
            {message}
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
              My Pipeline
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
                    <tr key={deal.id} style={tbodyRow}>
                      <td style={td}>{deal.customer || "-"}</td>
                      <td style={td}>{deal.phone || "-"}</td>
                      <td style={td}>{deal.isp || "-"}</td>
                      <td style={td}>{deal.package || "-"}</td>
                      <td style={td}>{deal.address || "-"}</td>
                      <td style={td}>{deal.install_date || deal.installDate || "-"}</td>
                      <td style={td}>
                        <span style={statusPill(deal.status)}>{deal.status || "-"}</span>
                      </td>
                    </tr>
                  ))}

                  {deals.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ padding: "24px", textAlign: "center", color: "#666" }}
                      >
                        No deals found.
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
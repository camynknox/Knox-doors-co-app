"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

const STATUS_OPTIONS = ["all", "pending", "approved", "installed", "chargeback"];
const UPDATE_OPTIONS = ["pending", "approved", "installed", "chargeback"];

export default function Page() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [deals, setDeals] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [message, setMessage] = useState("Checking access...");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");

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
      .maybeSingle();

    if (profileError || !profile?.role) {
      setChecking(false);
      setMessage("Could not load role.");
      return;
    }

    const role = profile.role;

    if (role === "admin" || role === "assistant_admin") {
      setAuthorized(true);
      setChecking(false);
      await Promise.all([fetchDeals(), fetchProfiles()]);
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

  async function fetchDeals() {
    setMessage("Loading deals...");

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const list = data || [];
    setDeals(list);
    setMessage(`Loaded ${list.length} deal(s).`);
  }

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, name");

    if (error) {
      return;
    }

    setProfiles(data || []);
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("deals")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setMessage("Update error: " + error.message);
      return;
    }

    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === id ? { ...deal, status: newStatus } : deal
      )
    );

    setMessage(`Status updated to ${newStatus}.`);
  }

  function getProfileNameByEmail(email: string) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) return "";

    const match = profiles.find(
      (p) => String(p.email || "").trim().toLowerCase() === cleanEmail
    );

    return String(match?.full_name || match?.name || "").trim();
  }

  function getRepDisplay(deal: any) {
    const repName = String(deal.rep_name || "").trim();
    if (repName) return repName;

    const repEmail = String(deal.rep_email || deal.email || "").trim().toLowerCase();
    const profileName = getProfileNameByEmail(repEmail);
    if (profileName) return profileName;

    const repFallback = String(deal.rep || "").trim();
    if (repFallback && !repFallback.includes("@")) return repFallback;

    return repEmail || "-";
  }

  const teamOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        deals
          .map((d) => String(d.team || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["all", ...values];
  }, [deals]);

  const repOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        deals
          .map((d) => getRepDisplay(d))
          .filter((v) => v && v !== "-" && !v.includes("@"))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["all", ...values];
  }, [deals, profiles]);

  const filteredDeals = useMemo(() => {
    const term = search.toLowerCase().trim();

    return deals.filter((deal) => {
      const repDisplay = getRepDisplay(deal).toLowerCase();
      const customer = String(deal.customer || "").toLowerCase();
      const customerEmail = String(deal.customer_email || "").toLowerCase();
      const phone = String(deal.phone || "").toLowerCase();
      const isp = String(deal.isp || "").toLowerCase();
      const packageName = String(deal.package || "").toLowerCase();
      const address = String(deal.address || "").toLowerCase();
      const team = String(deal.team || "").toLowerCase();
      const status = String(deal.status || "").toLowerCase();
      const vas = String(deal.vas || "").toLowerCase();

      const matchesSearch =
        term === ""
          ? true
          : repDisplay.includes(term) ||
            customer.includes(term) ||
            customerEmail.includes(term) ||
            phone.includes(term) ||
            isp.includes(term) ||
            packageName.includes(term) ||
            address.includes(term) ||
            team.includes(term) ||
            vas.includes(term);

      const matchesStatus =
        statusFilter === "all" ? true : status === statusFilter;

      const matchesTeam =
        teamFilter === "all"
          ? true
          : String(deal.team || "").trim() === teamFilter;

      const matchesRep =
        repFilter === "all"
          ? true
          : getRepDisplay(deal) === repFilter;

      return matchesSearch && matchesStatus && matchesTeam && matchesRep;
    });
  }, [deals, search, statusFilter, teamFilter, repFilter, profiles]);

  const stats = useMemo(() => {
    return {
      total: deals.length,
      pending: deals.filter((d) => d.status === "pending").length,
      approved: deals.filter((d) => d.status === "approved").length,
      installed: deals.filter((d) => d.status === "installed").length,
      chargeback: deals.filter((d) => d.status === "chargeback").length,
    };
  }, [deals]);

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

      <div
        style={{
          padding: "24px",
          marginTop: "10px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "34px",
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: "6px",
                }}
              >
                Admin Deals
              </h1>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                Review submissions, filter the pipeline, and update statuses fast.
              </div>
            </div>

            <button
              onClick={() => {
                fetchDeals();
                fetchProfiles();
              }}
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
                background: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          <div
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              padding: "12px 14px",
              borderRadius: "12px",
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
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <StatCard label="Total Deals" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Approved" value={stats.approved} />
            <StatCard label="Installed" value={stats.installed} />
            <StatCard label="Chargebacks" value={stats.chargeback} />
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "18px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "14px",
                color: "#111827",
              }}
            >
              Filters
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "12px",
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rep, customer, phone, ISP, package, address..."
                style={inputStyle}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {prettyStatus(option)}
                  </option>
                ))}
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={inputStyle}
              >
                {teamOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All Teams" : option}
                  </option>
                ))}
              </select>

              <select
                value={repFilter}
                onChange={(e) => setRepFilter(e.target.value)}
                style={inputStyle}
              >
                {repOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All Reps" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
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
              Pipeline
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1500px",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <th style={th}>Rep</th>
                    <th style={th}>Team</th>
                    <th style={th}>Customer</th>
                    <th style={th}>Customer Email</th>
                    <th style={th}>Phone</th>
                    <th style={th}>ISP</th>
                    <th style={th}>Package</th>
                    <th style={th}>VAS</th>
                    <th style={th}>Voice / TV</th>
                    <th style={th}>Address</th>
                    <th style={th}>Order #</th>
                    <th style={th}>Install</th>
                    <th style={th}>Status</th>
                    <th style={th}>Update</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} style={rowStyle}>
                      <td style={tdStrong}>{getRepDisplay(deal)}</td>

                      <td style={td}>
                        <span style={teamPill()}>{deal.team || "-"}</span>
                      </td>

                      <td style={td}>{deal.customer || "-"}</td>
                      <td style={td}>{deal.customer_email || "-"}</td>
                      <td style={td}>{deal.phone || "-"}</td>
                      <td style={td}>{deal.isp || "-"}</td>
                      <td style={td}>{deal.package || "-"}</td>

                      <td style={td}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {formatVas(deal.vas).length > 0 ? (
                            formatVas(deal.vas).map((item) => (
                              <span key={item} style={miniPill("#f3f4f6", "#374151")}>
                                {item}
                              </span>
                            ))
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>

                      <td style={td}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <span style={miniPill("#eef2ff", "#3730a3")}>
                            Voice: {extractVoice(deal)}
                          </span>
                          <span style={miniPill("#fdf2f8", "#9d174d")}>
                            TV: {extractTv(deal)}
                          </span>
                        </div>
                      </td>

                      <td style={td}>{deal.address || "-"}</td>
                      <td style={td}>{deal.order_number || "-"}</td>
                      <td style={td}>{deal.install_date || "-"}</td>

                      <td style={td}>
                        <span style={statusPill(deal.status)}>
                          {prettyStatus(deal.status)}
                        </span>
                      </td>

                      <td style={td}>
                        <select
                          value={deal.status || "pending"}
                          onChange={(e) => updateStatus(deal.id, e.target.value)}
                          style={{
                            padding: "10px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "10px",
                            background: "white",
                            fontSize: "13px",
                            minWidth: "130px",
                          }}
                        >
                          {UPDATE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {prettyStatus(option)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}

                  {filteredDeals.length === 0 && (
                    <tr>
                      <td
                        colSpan={14}
                        style={{
                          padding: "28px",
                          textAlign: "center",
                          color: "#64748b",
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
      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "30px", fontWeight: 700, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function prettyStatus(value: string) {
  if (value === "all") return "All Statuses";
  if (value === "chargeback") return "Chargeback";
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatVas(value: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractVoice(deal: any) {
  if (deal.voice && String(deal.voice).includes("Voice:")) {
    const match = String(deal.voice).match(/Voice:\s*([^,]+)/i);
    return match ? match[1].trim() : "-";
  }

  if (deal.voice) return String(deal.voice);
  return "No";
}

function extractTv(deal: any) {
  if (deal.tv) return String(deal.tv);

  if (deal.voice && String(deal.voice).includes("TV:")) {
    const match = String(deal.voice).match(/TV:\s*([^,]+)/i);
    return match ? match[1].trim() : "No";
  }

  return "No";
}

function statusPill(status: string) {
  if (status === "approved") return miniPill("#dcfce7", "#166534");
  if (status === "installed") return miniPill("#dbeafe", "#1d4ed8");
  if (status === "chargeback") return miniPill("#fee2e2", "#b91c1c");
  return miniPill("#f3f4f6", "#374151");
}

function teamPill() {
  return miniPill("#f8fafc", "#334155");
}

function miniPill(bg: string, color: string) {
  return {
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    background: bg,
    color,
    whiteSpace: "nowrap" as const,
  };
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  background: "white",
};

const th = {
  padding: "14px 16px",
  fontWeight: 600,
  color: "#374151",
};

const td = {
  padding: "14px 16px",
  color: "#111827",
  verticalAlign: "top" as const,
};

const tdStrong = {
  padding: "14px 16px",
  color: "#111827",
  verticalAlign: "top" as const,
  fontWeight: 600,
};

const rowStyle = {
  borderBottom: "1px solid #f1f5f9",
};
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

const ISP_OPTIONS = [
  "Brightspeed",
  "Vyve",
  "Zito",
  "Point Broadband",
  "Clearwave",
  "Kinetic",
  "T Fiber",
  "Ripple",
  "Frontier",
  "Xfinity",
  "MaxxSouth",
  "Loop",
  "Sparklight",
];

type DealRow = {
  id: string;
  team?: string | null;
  customer?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  phone?: string | null;
  isp?: string | null;
  package?: string | null;
  vas?: string | null;
  voice?: string | null;
  tv?: string | null;
  address?: string | null;
  order_number?: string | null;
  installation_date?: string | null;
  install_date?: string | null;
  status?: string | null;
  created_at?: string | null;
  rep_name?: string | null;
  rep_email?: string | null;
};

export default function AdminDealsPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<DealRow[]>([]);
  const [message, setMessage] = useState("Checking access...");
  const [loadingRows, setLoadingRows] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ispFilter, setIspFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

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

  async function fetchRows() {
    setLoadingRows(true);

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    setLoadingRows(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const list = (data || []) as DealRow[];
    setRows(list);
    setMessage(`Loaded ${list.length} deal(s).`);
  }

  async function updateStatus(id: string, status: string) {
    const previousRows = rows;

    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    setMessage(`Updating status to ${status}...`);

    const { error } = await supabase.from("deals").update({ status }).eq("id", id);

    if (error) {
      setRows(previousRows);
      setMessage(error.message);
      return;
    }

    setMessage(`Status updated to ${status}.`);
  }

  const teamOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.team).filter(Boolean))) as string[];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        q.length === 0
          ? true
          : [
              row.team,
              row.customer,
              row.customer_name,
              row.customer_email,
              row.customer_phone,
              row.phone,
              row.isp,
              row.package,
              row.vas,
              row.order_number,
              row.rep_name,
              row.rep_email,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q));

      const rowStatus = (row.status || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" ? true : rowStatus === statusFilter;
      const matchesIsp = ispFilter === "all" ? true : (row.isp || "") === ispFilter;
      const matchesTeam = teamFilter === "all" ? true : (row.team || "") === teamFilter;

      return matchesSearch && matchesStatus && matchesIsp && matchesTeam;
    });
  }, [rows, search, statusFilter, ispFilter, teamFilter]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((row) => (row.status || "pending") === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      installed: rows.filter((row) => row.status === "installed").length,
      chargebacks: rows.filter((row) => row.status === "chargeback").length,
    };
  }, [rows]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white">
        <TopNav />
        <div className="px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-zinc-300">{message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Deals</h1>
              <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
                Review submissions and update statuses.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRows}
              className="h-10 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              {loadingRows ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/90 px-4 py-2.5 text-sm text-slate-700">
            {message}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <StatCard label="Deals" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Approved" value={stats.approved} />
            <StatCard label="Installed" value={stats.installed} />
            <StatCard label="Chargebacks" value={stats.chargebacks} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-3 text-black shadow-sm sm:p-4">
            <div className="mb-2 text-lg font-semibold sm:text-xl">Filters</div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Search">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Customer, email, phone, order #..."
                  className="h-10 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-zinc-900"
                />
              </Field>

              <Field label="Status">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="installed">Installed</option>
                  <option value="chargeback">Chargebacks</option>
                </select>
              </Field>

              <Field label="ISP">
                <select
                  value={ispFilter}
                  onChange={(e) => setIspFilter(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                >
                  <option value="all">All ISPs</option>
                  {ISP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Team">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                >
                  <option value="all">All teams</option>
                  {teamOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRows.map((row) => {
              const customer = row.customer_name || row.customer || "-";
              const phone = row.customer_phone || row.phone || "-";
              const install = row.installation_date || row.install_date || "-";
              const saleDate = row.created_at
                ? new Date(row.created_at).toLocaleDateString()
                : "-";
              const agent = row.rep_name || row.rep_email || "-";

              return (
                <div
                  key={row.id}
                  className="rounded-3xl border border-white/10 bg-white p-3 text-black shadow-sm sm:p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Team" value={row.team || "-"} />
                        <CompactItem label="ISP" value={row.isp || "-"} />
                        <CompactItem label="Agent" value={agent} />
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Customer" value={customer} />
                        <CompactItem label="Phone" value={phone} />
                        <CompactItem label="Email" value={row.customer_email || "-"} />
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Package" value={row.package || "-"} />
                        <CompactItem label="VAS" value={row.vas || "-"} />
                        <CompactItem label="Voice" value={row.voice || "-"} />
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Sale Date" value={saleDate} />
                        <CompactItem label="Install Date" value={install} />
                        <CompactItem label="Order #" value={row.order_number || "-"} />
                      </div>
                    </div>

                    <div className="lg:w-[260px] lg:pl-4">
                      <div className="mb-2 flex lg:justify-end">
                        <StatusPill status={row.status || "pending"} />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <ActionButton
                          label="Pending"
                          onClick={() => updateStatus(row.id, "pending")}
                          variant="light"
                        />
                        <ActionButton
                          label="Approve"
                          onClick={() => updateStatus(row.id, "approved")}
                          variant="green"
                        />
                        <ActionButton
                          label="Installed"
                          onClick={() => updateStatus(row.id, "installed")}
                          variant="blue"
                        />
                        <ActionButton
                          label="Chargeback"
                          onClick={() => updateStatus(row.id, "chargeback")}
                          variant="red"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRows.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm">
                No deals found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-black shadow-sm">
      <div className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold leading-none sm:text-2xl">{value}</div>
    </div>
  );
}

function CompactItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[11px]">
        {label}
      </div>
      <div className="mt-0.5 break-words text-sm font-medium text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Approved
      </span>
    );
  }

  if (normalized === "installed") {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Installed
      </span>
    );
  }

  if (normalized === "chargeback") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Chargeback
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
      Pending
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: "light" | "green" | "blue" | "red";
}) {
  const styles =
    variant === "green"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : variant === "blue"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : variant === "red"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200";

  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${styles}`}
    >
      {label}
    </button>
  );
}
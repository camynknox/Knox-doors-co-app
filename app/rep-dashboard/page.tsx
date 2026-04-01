"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

type Deal = {
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
  order_number?: string | null;
  installation_date?: string | null;
  install_date?: string | null;
  created_at?: string | null;
  status?: string | null;
  email?: string | null;
  rep?: string | null;
  rep_name?: string | null;
  rep_email?: string | null;
};

export default function RepDashboardPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [message, setMessage] = useState("Loading dashboard...");
  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);

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

    const currentEmail = user.email.trim().toLowerCase();
    setRepEmail(currentEmail);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role, team")
      .eq("email", currentEmail)
      .single();

    if (profileError || !profile) {
      setMessage("Could not load profile.");
      setCheckingAccess(false);
      return;
    }

    if (profile.role === "admin" || profile.role === "assistant_admin") {
      router.push("/admin-deals");
      return;
    }

    if (profile.role === "team_leader") {
      router.push("/team-dashboard");
      return;
    }

    setRepName(profile.full_name || "");

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setCheckingAccess(false);
      return;
    }

    const myDeals = ((data || []) as Deal[]).filter((deal) => {
      const repEmailField = String(deal.rep_email || "").toLowerCase();
      const emailField = String(deal.email || "").toLowerCase();
      const repField = String(deal.rep || "").toLowerCase();
      return (
        repEmailField === currentEmail ||
        emailField === currentEmail ||
        repField === currentEmail
      );
    });

    setDeals(myDeals);
    setMessage(`Loaded ${myDeals.length} deal(s).`);
    setCheckingAccess(false);
  }

  const stats = useMemo(() => {
    return {
      total: deals.length,
      pending: deals.filter((d) => (d.status || "pending") === "pending").length,
      approved: deals.filter((d) => d.status === "approved").length,
      installed: deals.filter((d) => d.status === "installed").length,
    };
  }, [deals]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <TopNav />
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-zinc-300">{message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto max-w-7xl space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rep Dashboard</h1>
            <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">
              {repName || "Rep"}
              {repEmail ? ` • ${repEmail}` : ""}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/90 px-4 py-2.5 text-sm text-slate-700">
            {message}
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <StatCard label="Deals" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Approved" value={stats.approved} />
            <StatCard label="Installed" value={stats.installed} />
          </div>

          <div className="space-y-3">
            {deals.map((deal) => {
              const customer = deal.customer_name || deal.customer || "-";
              const phone = deal.customer_phone || deal.phone || "-";
              const install = deal.installation_date || deal.install_date || "-";
              const saleDate = deal.created_at
                ? new Date(deal.created_at).toLocaleDateString()
                : "-";

              return (
                <div
                  key={deal.id}
                  className="rounded-3xl border border-white/10 bg-white p-3 text-black shadow-sm sm:p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Team" value={deal.team || "-"} />
                        <CompactItem label="ISP" value={deal.isp || "-"} />
                        <CompactItem label="Status" value={deal.status || "pending"} pill />
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Customer" value={customer} />
                        <CompactItem label="Phone" value={phone} />
                        <CompactItem label="Email" value={deal.customer_email || "-"} />
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Package" value={deal.package || "-"} />
                        <CompactItem label="VAS" value={deal.vas || "-"} />
                        <CompactItem label="Voice" value={deal.voice || "-"} />
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                        <CompactItem label="Sale Date" value={saleDate} />
                        <CompactItem label="Install Date" value={install} />
                        <CompactItem label="Order #" value={deal.order_number || "-"} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {deals.length === 0 && (
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-1.5 py-2 text-black shadow-sm sm:px-2.5">
      <div className="text-center text-[8px] font-medium uppercase tracking-tight text-slate-500 sm:text-[10px]">
        {label}
      </div>
      <div className="mt-1 text-center text-lg font-bold leading-none sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

function CompactItem({
  label,
  value,
  pill = false,
}: {
  label: string;
  value: string;
  pill?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[11px]">
        {label}
      </div>
      {pill ? (
        <div className="mt-1">
          <StatusPill status={value} />
        </div>
      ) : (
        <div className="mt-0.5 break-words text-sm font-medium text-zinc-900">
          {value}
        </div>
      )}
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
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

type Deal = {
  id: string;
  customer?: string | null;
  phone?: string | null;
  isp?: string | null;
  package?: string | null;
  address?: string | null;
  install_date?: string | null;
  installDate?: string | null;
  status?: string | null;
  email?: string | null;
  rep?: string | null;
  rep_name?: string | null;
};

export default function Page() {
  const router = useRouter();

  const [repEmail, setRepEmail] = useState("");
  const [repName, setRepName] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
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

    const myDeals = ((data || []) as Deal[]).filter((deal) => {
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
        <div className="px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
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

      <div className="px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 sm:mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              My Dashboard
            </h1>
            <div className="mt-2 break-words text-sm text-zinc-500 sm:text-base">
              {repName || "Rep"}
              {repEmail ? ` • ${repEmail}` : ""}
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {message}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4">
            <StatCard label="Total Deals" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Approved" value={stats.approved} />
            <StatCard label="Installed" value={stats.installed} />
          </div>

          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-4 sm:px-5">
              <div className="text-base font-semibold text-zinc-900 sm:text-lg">
                My Pipeline
              </div>
            </div>

            {deals.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500 sm:px-5">
                No deals found.
              </div>
            ) : (
              <>
                <div className="block md:hidden">
                  <div className="space-y-3 p-3">
                    {deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <div className="mb-4">
                          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Customer
                          </div>
                          <div className="mt-1 text-lg font-semibold text-zinc-900">
                            {deal.customer || "-"}
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <InfoItem label="Phone" value={deal.phone || "-"} />
                          <InfoItem label="ISP" value={deal.isp || "-"} />
                          <InfoItem label="Package" value={deal.package || "-"} />
                          <InfoItem
                            label="Install"
                            value={deal.install_date || deal.installDate || "-"}
                          />
                          <InfoItem label="Address" value={deal.address || "-"} />
                          <InfoItem label="Status" value={deal.status || "-"} pill />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                        <th className="px-4 py-4 font-semibold text-zinc-700">Customer</th>
                        <th className="px-4 py-4 font-semibold text-zinc-700">Phone</th>
                        <th className="px-4 py-4 font-semibold text-zinc-700">ISP</th>
                        <th className="px-4 py-4 font-semibold text-zinc-700">Package</th>
                        <th className="px-4 py-4 font-semibold text-zinc-700">Address</th>
                        <th className="px-4 py-4 font-semibold text-zinc-700">Install</th>
                        <th className="px-4 py-4 font-semibold text-zinc-700">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {deals.map((deal) => (
                        <tr key={deal.id} className="border-b border-zinc-100">
                          <td className="px-4 py-4 text-zinc-900">{deal.customer || "-"}</td>
                          <td className="px-4 py-4 text-zinc-900">{deal.phone || "-"}</td>
                          <td className="px-4 py-4 text-zinc-900">{deal.isp || "-"}</td>
                          <td className="px-4 py-4 text-zinc-900">{deal.package || "-"}</td>
                          <td className="px-4 py-4 text-zinc-900">{deal.address || "-"}</td>
                          <td className="px-4 py-4 text-zinc-900">
                            {deal.install_date || deal.installDate || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                                deal.status || ""
                              )}`}
                            >
                              {deal.status || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="text-sm font-medium text-zinc-500">{label}</div>
      <div className="mt-3 text-3xl font-bold text-zinc-900 sm:text-4xl">{value}</div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  pill = false,
}: {
  label: string;
  value: string;
  pill?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>

      {pill ? (
        <div className="mt-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
              value
            )}`}
          >
            {value}
          </span>
        </div>
      ) : (
        <div className="text-base font-medium text-zinc-900">{value}</div>
      )}
    </div>
  );
}

function statusClasses(status: string) {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "installed") return "bg-blue-100 text-blue-800";
  if (status === "chargeback") return "bg-red-100 text-red-700";
  return "bg-zinc-100 text-zinc-700";
}
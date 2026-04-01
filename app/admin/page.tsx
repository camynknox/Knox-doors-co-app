"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type RowType = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  coordinator?: string | null;
  onboarding_coordinator?: string | null;
  team?: string | null;
  team_name?: string | null;
  isp?: string | null;
  nsp?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function AdminOnboardingPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rows, setRows] = useState<RowType[]>([]);
  const [message, setMessage] = useState("Checking access...");
  const [tableName, setTableName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [deletingId, setDeletingId] = useState("");

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
    setCurrentUserRole(role);

    if (role === "admin" || role === "assistant_admin") {
      setAuthorized(true);
      setChecking(false);
      await fetchRows();
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
        msg.includes("schema cache") ||
        msg.includes("does not exist");

      if (!missingTable) return candidate;
    }

    return null;
  }

  async function fetchRows() {
    setLoadingRows(true);

    const workingTable = await findWorkingTable();

    if (!workingTable) {
      setMessage("Could not find onboarding table.");
      setLoadingRows(false);
      return;
    }

    setTableName(workingTable);

    const { data, error } = await supabase
      .from(workingTable)
      .select("*")
      .order("created_at", { ascending: false });

    setLoadingRows(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const list = (data || []) as RowType[];
    setRows(list);
    setMessage(`Loaded ${list.length} submission(s).`);
  }

  async function updateStatus(id: string, status: string) {
    if (!tableName) return;

    const previousRows = rows;

    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    setMessage(`Updating status to ${status}...`);

    const { error } = await supabase.from(tableName).update({ status }).eq("id", id);

    if (error) {
      setRows(previousRows);
      setMessage(error.message);
      return;
    }

    setMessage(`Status updated to ${status}.`);
  }

  async function handleDeleteSubmission(id: string) {
    if (currentUserRole !== "admin") {
      setMessage("Only the Owner can delete submissions.");
      return;
    }

    if (!tableName) {
      setMessage("Could not find onboarding table.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this onboarding submission? This removes it from onboarding review."
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("Deleting submission...");

    const previousRows = rows;
    setRows((prev) => prev.filter((row) => row.id !== id));

    const { error } = await supabase.from(tableName).delete().eq("id", id);

    setDeletingId("");

    if (error) {
      setRows(previousRows);
      setMessage("Delete error: " + error.message);
      return;
    }

    setMessage("Submission deleted.");
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const currentStatus = (row.status || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" ? true : currentStatus === statusFilter;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        q.length === 0
          ? true
          : [
              row.name,
              row.full_name,
              row.email,
              row.phone,
              row.coordinator,
              row.onboarding_coordinator,
              row.team,
              row.team_name,
              row.isp,
              row.nsp,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [rows, statusFilter, search]);

  const counts = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => (r.status || "pending") === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const needsInfo = rows.filter((r) => r.status === "needs_info").length;

    return { total, pending, approved, needsInfo };
  }, [rows]);

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <TopNav />
        <div className="px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-zinc-500">{message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav />

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Onboarding Review
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Review submissions and update statuses.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total" value={counts.total} />
                <StatCard label="Pending" value={counts.pending} />
                <StatCard label="Approved" value={counts.approved} />
                <StatCard label="Needs Info" value={counts.needsInfo} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
            {message}
            {tableName ? <span className="ml-1 text-zinc-400">Table: {tableName}</span> : null}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-800">
                    Search
                  </label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, email, phone, team, ISP..."
                    className="h-11 w-full rounded-2xl border border-zinc-300 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-800">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-zinc-300 px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="needs_info">Needs Info</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchRows}
                className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:w-auto sm:self-start"
              >
                {loadingRows ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => {
              const displayName = row.name || row.full_name || "-";
              const displayIsp = row.isp || row.nsp || "-";
              const displayCoordinator = row.coordinator || row.onboarding_coordinator || "-";
              const displayTeam = row.team || row.team_name || "-";

              return (
                <div key={row.id} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-zinc-950">
                        {displayName}
                      </div>
                      <div className="mt-1 break-all text-sm text-zinc-500">
                        {row.email || "-"}
                      </div>
                    </div>
                    <StatusPill status={row.status || "pending"} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoItem label="Phone" value={row.phone || "-"} />
                    <InfoItem label="Coordinator" value={displayCoordinator} />
                    <InfoItem label="Team" value={displayTeam} />
                    <InfoItem label="ISP" value={displayIsp} />
                  </div>

                  <div className="mt-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Created
                    </div>
                    <div className="mt-1 text-sm text-zinc-800">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() =>
                        router.push(`/admin/${row.id}?table=${encodeURIComponent(tableName)}`)
                      }
                      className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      View Submission
                    </button>

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
                        label="Needs Info"
                        onClick={() => updateStatus(row.id, "needs_info")}
                        variant="yellow"
                      />
                      <ActionButton
                        label="Edit"
                        onClick={() =>
                          router.push(`/admin/${row.id}?table=${encodeURIComponent(tableName)}`)
                        }
                        variant="blue"
                      />
                    </div>

                    {currentUserRole === "admin" && (
                      <button
                        onClick={() => handleDeleteSubmission(row.id)}
                        disabled={deletingId === row.id}
                        className="w-full rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === row.id ? "Deleting..." : "Delete Submission"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredRows.length === 0 && (
              <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm">
                No submissions found.
              </div>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm md:block">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold text-zinc-900">Submissions</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full border-collapse text-sm">
                <thead className="bg-zinc-50">
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Phone</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Coordinator</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Team</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">ISP</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Created</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const displayName = row.name || row.full_name || "-";
                    const displayIsp = row.isp || row.nsp || "-";
                    const displayCoordinator = row.coordinator || row.onboarding_coordinator || "-";
                    const displayTeam = row.team || row.team_name || "-";

                    return (
                      <tr key={row.id} className="border-b border-zinc-100 align-top">
                        <td className="px-4 py-4 text-zinc-900">{displayName}</td>
                        <td className="px-4 py-4 text-zinc-700">{row.email || "-"}</td>
                        <td className="px-4 py-4 text-zinc-700">{row.phone || "-"}</td>
                        <td className="px-4 py-4 text-zinc-700">{displayCoordinator}</td>
                        <td className="px-4 py-4 text-zinc-700">{displayTeam}</td>
                        <td className="px-4 py-4 text-zinc-700">{displayIsp}</td>
                        <td className="px-4 py-4">
                          <StatusPill status={row.status || "pending"} />
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid w-[220px] grid-cols-2 gap-2">
                            <button
                              onClick={() =>
                                router.push(`/admin/${row.id}?table=${encodeURIComponent(tableName)}`)
                              }
                              className="col-span-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              View Submission
                            </button>

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
                              label="Needs Info"
                              onClick={() => updateStatus(row.id, "needs_info")}
                              variant="yellow"
                            />
                            <ActionButton
                              label="Edit"
                              onClick={() =>
                                router.push(`/admin/${row.id}?table=${encodeURIComponent(tableName)}`)
                              }
                              variant="blue"
                            />

                            {currentUserRole === "admin" && (
                              <button
                                onClick={() => handleDeleteSubmission(row.id)}
                                disabled={deletingId === row.id}
                                className="col-span-2 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === row.id ? "Deleting..." : "Delete Submission"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-500">
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 sm:px-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold leading-none text-zinc-950 sm:text-3xl">
        {value}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-zinc-900">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Approved
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }

  if (normalized === "needs_info") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Needs Info
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
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
  variant: "light" | "green" | "yellow" | "red" | "blue";
}) {
  const styles =
    variant === "green"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : variant === "yellow"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : variant === "red"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "blue"
      ? "bg-zinc-900 text-white hover:opacity-95"
      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200";

  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${styles}`}
    >
      {label}
    </button>
  );
}
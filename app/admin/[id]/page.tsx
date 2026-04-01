"use client";

import { useEffect, useMemo, useState } from "react";
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

type AnyRow = Record<string, any>;

export default function AdminSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = String(params?.id || "");
  const tableFromUrl = searchParams.get("table") || "";

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Checking access...");
  const [tableName, setTableName] = useState(tableFromUrl);
  const [row, setRow] = useState<AnyRow | null>(null);

  useEffect(() => {
    init();
  }, [id]);

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

    if (profile.role !== "admin" && profile.role !== "assistant_admin") {
      router.push("/login");
      return;
    }

    setAuthorized(true);
    setChecking(false);

    await loadSubmission();
  }

  async function findWorkingTable() {
    if (tableFromUrl) {
      return tableFromUrl;
    }

    for (const candidate of TABLE_CANDIDATES) {
      const { error } = await supabase.from(candidate).select("id").eq("id", id).maybeSingle();

      if (!error) return candidate;

      const msg = String(error.message || "").toLowerCase();
      const missingTable =
        msg.includes("could not find the table") ||
        msg.includes("schema cache") ||
        msg.includes("does not exist");

      if (!missingTable) {
        return candidate;
      }
    }

    return null;
  }

  async function loadSubmission() {
    setLoading(true);
    setMessage("Loading submission...");

    const workingTable = await findWorkingTable();

    if (!workingTable) {
      setLoading(false);
      setMessage("Could not find onboarding table.");
      return;
    }

    setTableName(workingTable);

    const { data, error } = await supabase
      .from(workingTable)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data) {
      setMessage("Submission not found.");
      setRow(null);
      return;
    }

    setRow(data);
    setMessage("Submission loaded.");
  }

  const title = useMemo(() => {
    if (!row) return "Submission Details";
    return row.name || row.full_name || row.email || "Submission Details";
  }, [row]);

  const knownTopFields = useMemo(() => {
    if (!row) return [];

    return [
      ["Name", row.name || row.full_name || "-"],
      ["Email", row.email || "-"],
      ["Phone", row.phone || row.phone_number || "-"],
      ["Coordinator", row.coordinator || "-"],
      ["Team", row.team || "-"],
      ["ISP", row.isp || row.nsp || "-"],
      ["Status", row.status || "pending"],
      ["Created", row.created_at ? new Date(row.created_at).toLocaleString() : "-"],
    ];
  }, [row]);

  const documentEntries = useMemo(() => {
    if (!row) return [];

    return Object.entries(row).filter(([key, value]) => {
      if (!value) return false;

      const normalized = key.toLowerCase();
      const likelyDocKey =
        normalized.includes("document") ||
        normalized.includes("upload") ||
        normalized.includes("file") ||
        normalized.includes("photo") ||
        normalized.includes("image") ||
        normalized.includes("license") ||
        normalized.includes("id_") ||
        normalized.includes("badge") ||
        normalized.includes("signature") ||
        normalized.includes("ssn") ||
        normalized.includes("w9") ||
        normalized.includes("bank");

      const looksLikeUrl =
        typeof value === "string" &&
        (value.startsWith("http://") ||
          value.startsWith("https://") ||
          value.startsWith("/storage/") ||
          value.includes("supabase.co/storage"));

      return likelyDocKey || looksLikeUrl;
    });
  }, [row]);

  const otherEntries = useMemo(() => {
    if (!row) return [];

    const skipKeys = new Set([
      "id",
      "created_at",
      "updated_at",
      "name",
      "full_name",
      "email",
      "phone",
      "phone_number",
      "coordinator",
      "team",
      "isp",
      "nsp",
      "status",
    ]);

    const docKeys = new Set(documentEntries.map(([key]) => key));

    return Object.entries(row).filter(([key, value]) => {
      if (skipKeys.has(key) || docKeys.has(key)) return false;
      if (value === null || value === undefined || value === "") return false;
      return true;
    });
  }, [row, documentEntries]);

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <TopNav />
        <div className="px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-zinc-500">{message}</div>
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
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Submission Details
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Review onboarding information and uploaded materials.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={loadSubmission}
                className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
            {message}
            {tableName ? <span className="ml-1 text-zinc-400">Table: {tableName}</span> : null}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <div className="text-xl font-semibold text-zinc-950">{title}</div>
              <div className="mt-1 text-sm text-zinc-500">ID: {id}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {knownTopFields.map(([label, value]) => (
                <InfoCard key={label} label={label} value={String(value)} />
              ))}
            </div>
          </div>

          {documentEntries.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-950">Uploaded Materials</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {documentEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {prettyLabel(key)}
                    </div>

                    <div className="mt-2 break-all text-sm text-zinc-700">
                      {typeof value === "string" ? value : JSON.stringify(value)}
                    </div>

                    {typeof value === "string" &&
                    (value.startsWith("http://") ||
                      value.startsWith("https://") ||
                      value.includes("supabase.co/storage")) ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Open File
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherEntries.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-950">Submission Data</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {otherEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {prettyLabel(key)}
                    </div>
                    <div className="mt-2 break-words text-sm text-zinc-800">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!row && !loading && (
            <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm">
              No submission data found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function prettyLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
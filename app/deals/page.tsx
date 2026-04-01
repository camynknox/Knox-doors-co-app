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

const PACKAGE_OPTIONS = [
  "200 Mbps",
  "500 Mbps",
  "1 Gig",
  "2 Gig",
  "5 Gig",
  "8 Gig",
  "Other",
];

const VAS_OPTIONS = [
  "WiFi Extender",
  "WiFi Protection",
  "Tech Protect",
];

const YES_NO_OPTIONS = ["Yes", "No"];

type ProfileLike = {
  id?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  team?: string | null;
  isp?: string | null;
  nsp?: string | null;
};

export default function DealsPage() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const [userId, setUserId] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repName, setRepName] = useState("");
  const [team, setTeam] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");

  const [isp, setIsp] = useState("");
  const [packageName, setPackageName] = useState("");

  const [vasSelections, setVasSelections] = useState<string[]>([]);
  const [voice, setVoice] = useState("");
  const [tv, setTv] = useState("");

  const [orderNumber, setOrderNumber] = useState("");
  const [installationDate, setInstallationDate] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setPageLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const email = user.email || "";
      setUserId(user.id);
      setRepEmail(email);

      const profile = await loadProfile(user.id, email);

      const resolvedName =
        profile?.full_name?.trim() ||
        profile?.name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        user.user_metadata?.name?.trim() ||
        (email ? email.split("@")[0] : "");

      const resolvedTeam = profile?.team?.trim() || "";
      const resolvedIsp = profile?.isp?.trim() || profile?.nsp?.trim() || "";

      setRepName(resolvedName);
      setTeam(resolvedTeam);
      setProfileLoaded(Boolean(profile));

      if (!isp && resolvedIsp) {
        setIsp(resolvedIsp);
      }

      setPageLoading(false);
    } catch {
      setMessageType("error");
      setMessage("Could not load deal page.");
      setPageLoading(false);
    }
  }

  async function loadProfile(userId: string, email: string): Promise<ProfileLike | null> {
    const attempts = [
      async () =>
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      async () =>
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      async () =>
        supabase.from("profiles").select("*").eq("email", email).maybeSingle(),
    ];

    for (const attempt of attempts) {
      const { data, error } = await attempt();
      if (!error && data) return data as ProfileLike;
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const vasValue = vasSelections.join(", ");

    const payload = {
      rep_name: repName || null,
      rep_email: repEmail || null,
      email: repEmail || null,
      user_id: userId || null,
      team: team || null,

      isp: isp || null,
      package: packageName || null,
      vas: vasValue || null,
      voice: voice || null,
      tv: tv || null,

      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      address: address || null,

      order_number: orderNumber || null,
      installation_date: installationDate || null,
      status: "pending",
    };

    const { error } = await supabase.from("deals").insert([payload]);

    setSubmitting(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setMessageType("success");
    setMessage("Deal submitted successfully");

    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setAddress("");
    setPackageName("");
    setVasSelections([]);
    setVoice("");
    setTv("");
    setOrderNumber("");
    setInstallationDate("");

    setTimeout(() => {
      router.push("/rep-dashboard");
    }, 900);
  }

  function toggleVas(option: string) {
    setVasSelections((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  }

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <TopNav />
        <div className="px-4 py-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm text-zinc-500">Loading deal form...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav />

      <div className="px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Submit Deal
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Enter customer info, service details, and order info.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                <InfoPill label="Rep" value={repName || "Not loaded"} />
                <InfoPill label="Team" value={team || "Not assigned"} />
                <InfoPill label="Profile" value={profileLoaded ? "Connected" : "Fallback mode"} />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <SectionCard
              title="Customer Information"
              description="Basic customer contact and service address."
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label="Customer Name"
                  value={customerName}
                  onChange={setCustomerName}
                  required
                  placeholder="Enter customer name"
                />
                <Input
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  required
                  placeholder="Enter install address"
                />
                <Input
                  label="Phone"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  required
                  placeholder="Enter phone number"
                />
                <Input
                  label="Email"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  placeholder="Enter customer email"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Service"
              description="Choose ISP and package for this deal."
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  label="ISP"
                  value={isp}
                  onChange={setIsp}
                  options={ISP_OPTIONS}
                  required
                />
                <Select
                  label="Package"
                  value={packageName}
                  onChange={setPackageName}
                  options={PACKAGE_OPTIONS}
                  required
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Add-Ons"
              description="Select VAS and any extra service options."
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm font-medium text-zinc-800">VAS</div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {VAS_OPTIONS.map((opt) => {
                      const active = vasSelections.includes(opt);

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleVas(opt)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            active
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Select
                    label="Voice"
                    value={voice}
                    onChange={setVoice}
                    options={YES_NO_OPTIONS}
                  />
                  <Select
                    label="TV"
                    value={tv}
                    onChange={setTv}
                    options={YES_NO_OPTIONS}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Order Details"
              description="Enter sale tracking and install info."
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label="Order Number"
                  value={orderNumber}
                  onChange={setOrderNumber}
                  placeholder="Enter order number"
                />
                <DateInput
                  label="Install Date"
                  value={installationDate}
                  onChange={setInstallationDate}
                  min={today}
                />
              </div>
            </SectionCard>

            <div className="sticky bottom-3 z-10">
              <div className="rounded-3xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Deal"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/rep-dashboard")}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-12 rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-zinc-900"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-12 rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-800">{label}</label>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
      />
    </div>
  );
}
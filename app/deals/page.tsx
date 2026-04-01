"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

const ISP_OPTIONS = [
  "Brightspeed","Vyve","Zito","Point Broadband","Clearwave","Kinetic",
  "T Fiber","Ripple","Frontier","Xfinity","MaxxSouth","Loop","Sparklight",
];

const PACKAGE_OPTIONS = [
  "200 Mbps","500 Mbps","1 Gig","2 Gig","5 Gig","Other",
];

const VAS_OPTIONS = [
  "WiFi Extender","WiFi Protection","Tech Protect",
];

const YES_NO_OPTIONS = ["Yes", "No"];

export default function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [repEmail, setRepEmail] = useState("");
  const [repName, setRepName] = useState("");
  const [team, setTeam] = useState("");

  const [customer, setCustomer] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [isp, setIsp] = useState("");
  const [packageName, setPackageName] = useState("");

  const [vasSelections, setVasSelections] = useState<string[]>([]);
  const [voice, setVoice] = useState("");
  const [tv, setTv] = useState("");

  const [orderNumber, setOrderNumber] = useState("");
  const [installDate, setInstallDate] = useState("");

  useEffect(() => {
    loadRepInfo();
  }, []);

  async function loadRepInfo() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return;

    setRepEmail(user.email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    setRepName(profile?.full_name || "");
    setTeam(profile?.team || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const vasValue = vasSelections.join(", ");

    const { error } = await supabase.from("deals").insert([
      {
        customer,
        customer_email: customerEmail,
        phone,
        address,
        isp,
        package: packageName,
        vas: vasValue,
        voice,
        tv,
        order_number: orderNumber,
        install_date: installDate,
        status: "pending",
        email: repEmail,
        rep_name: repName,
        team,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Deal submitted successfully");
    setTimeout(() => router.push("/rep-dashboard"), 1000);
  }

  function toggleVas(option: string) {
    setVasSelections((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  }

  return (
    <div>
      <TopNav />

      <div className="px-4 py-5">
        <div className="mx-auto max-w-3xl">
          
          <h1 className="text-3xl font-bold mb-2">Submit Deal</h1>
          <p className="text-sm text-zinc-500 mb-4">
            Enter customer details and submit order
          </p>

          {message && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Customer */}
            <Card title="Customer Information">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Customer Name" value={customer} onChange={setCustomer} required />
                <Input label="Address" value={address} onChange={setAddress} required />
                <Input label="Phone" value={phone} onChange={setPhone} required />
                <Input label="Email" value={customerEmail} onChange={setCustomerEmail} />
              </div>
            </Card>

            {/* Service */}
            <Card title="Service">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="ISP" value={isp} onChange={setIsp} options={ISP_OPTIONS} required />
                <Select label="Package" value={packageName} onChange={setPackageName} options={PACKAGE_OPTIONS} required />
              </div>
            </Card>

            {/* Add Ons */}
            <Card title="Add-Ons">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">VAS</div>
                  <div className="flex flex-col gap-2">
                    {VAS_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={vasSelections.includes(opt)}
                          onChange={() => toggleVas(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Voice" value={voice} onChange={setVoice} options={YES_NO_OPTIONS} />
                  <Select label="TV" value={tv} onChange={setTv} options={YES_NO_OPTIONS} />
                </div>
              </div>
            </Card>

            {/* Order */}
            <Card title="Order Details">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Order Number" value={orderNumber} onChange={setOrderNumber} />
                <DateInput label="Install Date" value={installDate} onChange={setInstallDate} />
              </div>
            </Card>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="w-full rounded-xl bg-black text-white py-3 font-semibold"
              >
                {loading ? "Submitting..." : "Submit Deal"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/rep-dashboard")}
                className="w-full rounded-xl border py-3 font-semibold"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

/* Components */

function Card({ title, children }: any) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, required = false }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="border rounded-lg px-3 py-3"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="border rounded-lg px-3 py-3"
      >
        <option value="">Select {label}</option>
        {options.map((o: string) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function DateInput({ label, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-3 py-3"
      />
    </div>
  );
}
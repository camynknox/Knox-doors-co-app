"use client";

import { useEffect, useState } from "react";
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
  "Other",
];

const VAS_OPTIONS = [
  "WiFi Extender",
  "WiFi Protection",
  "Tech Protect",
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
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setMessage("Could not load user.");
      return;
    }

    setRepEmail(user.email);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (profileError) {
      setMessage("Could not load profile.");
      return;
    }

    setRepName(profile?.full_name || profile?.name || "");
    setTeam(profile?.team || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const vasValue = vasSelections.join(", ");
    const combinedVoice = tv ? `Voice: ${voice || "No"}, TV: ${tv}` : voice;

    const { error } = await supabase.from("deals").insert([
      {
        customer,
        customer_email: customerEmail,
        phone,
        address,
        isp,
        package: packageName,
        vas: vasValue,
        voice: combinedVoice,
        tv,
        order_number: orderNumber,
        install_date: installDate,
        status: "pending",
        email: repEmail,
        rep_email: repEmail,
        rep_name: repName,
        team,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Deal submitted successfully. Redirecting...");

    setCustomer("");
    setCustomerEmail("");
    setPhone("");
    setAddress("");
    setIsp("");
    setPackageName("");
    setVasSelections([]);
    setVoice("");
    setTv("");
    setOrderNumber("");
    setInstallDate("");

    setTimeout(() => {
      router.push("/rep-dashboard");
    }, 1200);
  }

  function handlePhoneChange(value: string) {
    setPhone(formatPhone(value));
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

      <div
        style={{
          padding: "24px",
          marginTop: "10px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h1
              style={{
                fontSize: "34px",
                fontWeight: 700,
                margin: 0,
                marginBottom: "6px",
              }}
            >
              Submit Deal
            </h1>

            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Fill out the customer details below and submit the order.
            </div>
          </div>

          {message && (
            <div
              style={{
                marginBottom: "16px",
                color: message.includes("successfully") ? "#166534" : "#b91c1c",
                fontSize: "14px",
                background: message.includes("successfully") ? "#dcfce7" : "#fee2e2",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <InfoCard label="Rep" value={repName || "Loading..."} />
            <InfoCard label="Team" value={team || "Loading..."} />
          </div>

          <form onSubmit={handleSubmit}>
            <SectionCard
              title="Customer Information"
              subtitle="Basic customer and contact details"
            >
              <div style={gridTwo}>
                <Field
                  label="Customer Name"
                  value={customer}
                  onChange={setCustomer}
                  required
                />

                <Field
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  required
                />

                <Field
                  label="Phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />

                <Field
                  label="Email"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Service Selection"
              subtitle="Choose provider and package"
            >
              <div style={gridTwo}>
                <SelectField
                  label="ISP"
                  value={isp}
                  onChange={setIsp}
                  options={ISP_OPTIONS}
                  required
                />

                <SelectField
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
              subtitle="Choose VAS and TV or voice options"
            >
              <div style={{ display: "grid", gap: "16px" }}>
                <InlineCheckboxField
                  label="VAS"
                  options={VAS_OPTIONS}
                  selected={vasSelections}
                  onToggle={toggleVas}
                />

                <div style={gridTwo}>
                  <SelectField
                    label="Voice"
                    value={voice}
                    onChange={setVoice}
                    options={YES_NO_OPTIONS}
                  />

                  <SelectField
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
              subtitle="Optional order and install information"
            >
              <div style={gridTwo}>
                <Field
                  label="Order Number"
                  value={orderNumber}
                  onChange={setOrderNumber}
                />

                <DateField
                  label="Install Date"
                  value={installDate}
                  onChange={setInstallDate}
                />
              </div>
            </SectionCard>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "13px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#111",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loading ? "Submitting..." : "Submit Deal"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/rep-dashboard")}
                style={{
                  padding: "13px 20px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#111",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
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

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
        marginBottom: "16px",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "13px", color: "#64748b" }}>{subtitle}</div>
      </div>

      {children}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
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
      <div
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#111827",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={labelStyle}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={inputStyle}
      />
    </label>
  );
}

function SelectField({
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
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={labelStyle}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={inputStyle}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InlineCheckboxField({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <span style={labelStyle}>{label}</span>

      {selected.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {selected.map((item) => (
            <span
              key={item}
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                background: "#f3f4f6",
                color: "#111827",
                border: "1px solid #e5e7eb",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: "12px",
          padding: "16px 20px",
          background: "#fafafa",
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {options.map((option) => (
          <label
            key={option}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#111827",
              cursor: "pointer",
              minWidth: "170px",
              justifyContent: "center",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={labelStyle}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const gridTwo = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#374151",
  fontWeight: 500,
};

const inputStyle = {
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  background: "white",
};
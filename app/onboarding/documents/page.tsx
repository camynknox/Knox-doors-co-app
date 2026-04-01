"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function DocumentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");

  const [shirtSize, setShirtSize] = useState("");

  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ssn, setSsn] = useState("");

  const [idFile, setIdFile] = useState<File | null>(null);
  const [badgeFile, setBadgeFile] = useState<File | null>(null);

  const [backgroundCheckConsent, setBackgroundCheckConsent] = useState(false);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      router.push("/login");
      return;
    }

    setEmail(user.email.trim().toLowerCase());
  }

  async function uploadFile(file: File | null, prefix: string) {
    if (!file || !email) return "";

    const fileExt = file.name.split(".").pop() || "file";
    const filePath = `${prefix}-${email}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("onboarding-docs")
      .upload(filePath, file, { upsert: true });

    if (error) {
      throw new Error(error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("onboarding-docs")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const idPhotoUrl = await uploadFile(idFile, "id");
      const badgePhotoUrl = await uploadFile(badgeFile, "badge");

      const { error } = await supabase
        .from("onboarding_forms")
        .update({
          street_address: streetAddress,
          city,
          state: stateValue,
          zip_code: zipCode,
          country,
          shirt_size: shirtSize,
          bank_name: bankName,
          routing_number: routingNumber,
          account_number: accountNumber,
          date_of_birth: dateOfBirth,
          ssn,
          id_photo_url: idPhotoUrl || null,
          badge_photo_url: badgePhotoUrl || null,
          background_check_consent: backgroundCheckConsent,
          signature,
          status: "pending",
        })
        .eq("email", email);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      alert("Onboarding submitted successfully.");
      router.push("/rep-dashboard");
    } catch (err: any) {
      alert(err.message || "Upload failed.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo2.png"
            alt="Knox Doors Co"
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
            priority
          />
          <div className="mt-3 text-xs font-medium tracking-[0.35em] text-zinc-500">
            KNOX DOORS CO
          </div>
          <h1 className="mt-3 text-4xl font-bold text-zinc-900">
            Final Setup
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Upload docs and finish onboarding.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                Step 2 of 2
              </div>
              <div className="text-sm text-zinc-500">Documents</div>
            </div>

            <div className="h-2 w-24 rounded-full bg-zinc-200">
              <div className="h-2 w-24 rounded-full bg-zinc-800" />
            </div>
          </div>

          <form onSubmit={handleFinish} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Street Address
              </label>
              <input
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  State
                </label>
                <input
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Zip Code
                </label>
                <input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Country
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Shirt Size
              </label>
              <input
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Bank Name
              </label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Routing Number
              </label>
              <input
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Account Number
              </label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                SSN
              </label>
              <input
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                ID Upload
              </label>
              <input
                type="file"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Badge Upload
              </label>
              <input
                type="file"
                onChange={(e) => setBadgeFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={backgroundCheckConsent}
                onChange={(e) => setBackgroundCheckConsent(e.target.checked)}
              />
              I consent to a background check and potential drug test.
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Signature
              </label>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Finish Onboarding"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
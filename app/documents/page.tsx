"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const onboardingId = searchParams.get("onboardingId");

  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [backgroundCheckConsent, setBackgroundCheckConsent] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ssn, setSsn] = useState("");
  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [signature, setSignature] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFile(
    bucket: string,
    file: File,
    prefix: string
  ): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${prefix}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) {
      setMessage(`Upload error: ${uploadError.message}`);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!onboardingId) {
      setMessage("Missing onboarding record ID.");
      return;
    }

    if (!idFile) {
      setMessage("Please upload your ID.");
      return;
    }

    if (!badgeFile) {
      setMessage("Please upload your badge photo.");
      return;
    }

    setLoading(true);
    setMessage("");

    const idPhotoUrl = await uploadFile("id-uploads", idFile, "id");
    if (!idPhotoUrl) {
      setLoading(false);
      return;
    }

    const badgePhotoUrl = await uploadFile("badge-uploads", badgeFile, "badge");
    if (!badgePhotoUrl) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("onboarding_forms")
      .update({
        street_address: streetAddress,
        city,
        state: stateValue,
        zip_code: zipCode,
        country,
        shirt_size: shirtSize,
        background_check_consent: backgroundCheckConsent,
        date_of_birth: dateOfBirth,
        id_photo_url: idPhotoUrl,
        bank_name: bankName,
        routing_number: routingNumber,
        account_number: accountNumber,
        ssn,
        badge_photo_url: badgePhotoUrl,
        signature,
      })
      .eq("id", onboardingId);

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("Documents and details saved successfully.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo2.png"
            alt="Knox Doors Co"
            className="h-20 w-20 object-contain"
          />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
          Knox Doors Co
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Final Setup
        </h1>

        <p className="mt-3 text-neutral-500">
          Upload docs and finish onboarding.
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-[28px] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-left">
              <p className="font-semibold text-neutral-900">Step 2 of 2</p>
              <p className="text-sm text-neutral-500">Documents</p>
            </div>

            <div className="h-2 w-24 rounded-full bg-neutral-200">
              <div className="h-2 w-24 rounded-full bg-black"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Street Address
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  State
                </label>
                <input
                  type="text"
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Shirt Size
              </label>
              <input
                type="text"
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={backgroundCheckConsent}
                  onChange={(e) => setBackgroundCheckConsent(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-neutral-700">
                  I consent to a background check and potential drug test.
                </span>
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                ID Upload
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-neutral-300 p-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Routing Number
              </label>
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                SSN
              </label>
              <input
                type="text"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Badge Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBadgeFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-neutral-300 p-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full rounded-xl border border-neutral-300 p-3 outline-none focus:border-black"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Finish"}
            </button>

            {message && (
              <p className="text-sm text-neutral-700">{message}</p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
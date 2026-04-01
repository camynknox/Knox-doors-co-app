"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [onboardingCoordinator, setOnboardingCoordinator] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isp, setIsp] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      router.push("/login");
      return;
    }

    const cleanEmail = user.email.trim().toLowerCase();
    setEmail(cleanEmail);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    setFullName(profile?.full_name || "");
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase
      .from("onboarding_forms")
      .upsert(
        {
          email: cleanEmail,
          full_name: fullName,
          phone,
          onboarding_coordinator: onboardingCoordinator,
          team_name: teamName,
          isp,
          status: "pending",
        },
        {
          onConflict: "email",
        }
      );

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/onboarding/documents");
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
            Rep Onboarding
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Get set up and start closing deals.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                Step 1 of 2
              </div>
              <div className="text-sm text-zinc-500">Basic information</div>
            </div>

            <div className="h-2 w-24 rounded-full bg-zinc-200">
              <div className="h-2 w-12 rounded-full bg-zinc-800" />
            </div>
          </div>

          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                value={email}
                disabled
                className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Onboarding Coordinator
              </label>
              <input
                value={onboardingCoordinator}
                onChange={(e) => setOnboardingCoordinator(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Team Name
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Preferred ISP
              </label>
              <input
                value={isp}
                onChange={(e) => setIsp(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
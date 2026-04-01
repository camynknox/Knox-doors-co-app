"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function routeUserAfterLogin(userEmail: string) {
    const cleanEmail = userEmail.trim().toLowerCase();

    const { data: onboarding } = await supabase
      .from("onboarding_forms")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

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
      !!onboarding.signature;

    if (!onboardingComplete) {
      router.push("/onboarding");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", cleanEmail)
      .maybeSingle();

    const role = profile?.role || "";

    if (role === "admin" || role === "assistant_admin") {
      router.push("/admin-deals");
      return;
    }

    if (role === "team_leader") {
      router.push("/team-dashboard");
      return;
    }

    router.push("/rep-dashboard");
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    await routeUserAfterLogin(cleanEmail);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo2.png"
            alt="Knox Doors Co"
            width={88}
            height={88}
            className="h-20 w-20 object-contain brightness-0 invert opacity-90"
            priority
          />
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold">
          Log in to Knox Doors Co
        </h1>

        <p className="mb-6 text-center text-sm text-zinc-400">
          Welcome back
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-400 underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
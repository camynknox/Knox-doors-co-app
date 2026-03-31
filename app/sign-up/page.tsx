"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./lib/client";
import TopNav from "./components/top-nav";

export default function HomePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (error) {
        setMessage(`Error loading profile: ${error.message}`);
        setLoading(false);
        return;
      }

      setUserName(profile?.full_name || user.email || "User");
      setRole(profile?.role || "rep");
      setLoading(false);
    }

    loadUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm">
          Loading...
        </div>
      </main>
    );
  }

  const isAdmin = role === "admin" || role === "assistant_admin";
  const isTrueAdmin = role === "admin";
  const isTeamLeader = role === "team_leader";

  return (
    <main className="min-h-screen bg-[#f6f6f4] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <TopNav role={role} />

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Welcome, {userName}
          </h1>

          <p className="mt-3 text-neutral-500">
            Role: {role.replace("_", " ")}
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl bg-white p-4 text-sm text-neutral-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubCard
            title="Submit Deal"
            description="Create and submit a new sale."
            buttonLabel="Open Deals Form"
            onClick={() => router.push("/deals")}
          />

          <HubCard
            title="My Pipeline"
            description="Track your personal deals and statuses."
            buttonLabel="View Pipeline"
            onClick={() => router.push("/rep-dashboard")}
          />

          {isAdmin && (
            <HubCard
              title="Admin Deals"
              description="Review all submitted deals and update statuses."
              buttonLabel="Open Admin Deals"
              onClick={() => router.push("/admin-deals")}
            />
          )}

          {isAdmin && (
            <HubCard
              title="Onboarding Review"
              description="Review rep onboarding submissions and documents."
              buttonLabel="Open Onboarding Admin"
              onClick={() => router.push("/admin")}
            />
          )}

          {isTrueAdmin && (
            <HubCard
              title="Role Manager"
              description="Promote reps, team leaders, and admins."
              buttonLabel="Open Role Manager"
              onClick={() => router.push("/role-manager")}
            />
          )}

          {isTeamLeader && (
            <HubCard
              title="Team Dashboard"
              description="Team leader dashboard coming next."
              buttonLabel="Coming Soon"
              onClick={() => {}}
              disabled
            />
          )}
        </div>
      </div>
    </main>
  );
}

function HubCard({
  title,
  description,
  buttonLabel,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>

      <button
        onClick={onClick}
        disabled={disabled}
        className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
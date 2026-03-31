"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRole();
  }, []);

  async function loadRole() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        setRole("");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      if (profileError) {
        console.error("TopNav profile error:", profileError.message);
        setRole("");
        setLoading(false);
        return;
      }

      setRole(profile?.role || "");
      setLoading(false);
    } catch (error) {
      console.error("TopNav loadRole error:", error);
      setRole("");
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getHomeRoute(currentRole: string) {
    if (currentRole === "team_leader") return "/team-dashboard";
    if (currentRole === "assistant_admin" || currentRole === "admin") return "/admin-deals";
    return "/rep-dashboard";
  }

  const homeRoute = getHomeRoute(role);
  const links = getLinks(role);

  return (
    <div
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "20px 24px",
        fontFamily: "system-ui",
        background: "white",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={() => router.push(homeRoute)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Image
            src="/logo2.png"
            alt="Knox Doors Co"
            width={58}
            height={58}
          />
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "6px",
              color: "#555",
              fontWeight: 600,
            }}
          >
            KNOX DOORS CO
          </div>
        </button>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <NavButton
            label="Home"
            active={pathname === homeRoute}
            onClick={() => router.push(homeRoute)}
          />

          {!loading &&
            links.map((link) => (
              <NavButton
                key={link.href}
                label={link.label}
                active={pathname === link.href}
                onClick={() => router.push(link.href)}
              />
            ))}

          <NavButton label="Log Out" active={false} onClick={handleLogout} />
        </div>
      </div>
    </div>
  );
}

function getLinks(role: string) {
  if (role === "rep") {
    return [
      { label: "Submit Deal", href: "/deals" },
      { label: "My Pipeline", href: "/rep-dashboard" },
    ];
  }

  if (role === "team_leader") {
    return [
      { label: "Submit Deal", href: "/deals" },
      { label: "Team Dashboard", href: "/team-dashboard" },
      { label: "Role Manager", href: "/role-manager" },
    ];
  }

  if (role === "assistant_admin" || role === "admin") {
    return [
      { label: "Submit Deal", href: "/deals" },
      { label: "Admin Deals", href: "/admin-deals" },
      { label: "Role Manager", href: "/role-manager" },
      { label: "Onboarding", href: "/admin" },
    ];
  }

  return [];
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 18px",
        borderRadius: "16px",
        border: active ? "1px solid #111" : "1px solid #d1d5db",
        background: active ? "#111" : "white",
        color: active ? "white" : "#111",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        boxShadow: active ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {label}
    </button>
  );
}
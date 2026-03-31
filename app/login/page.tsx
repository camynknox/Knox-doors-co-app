"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Image from "next/image";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setMessage(error?.message || "Login failed");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", data.user.email)
      .maybeSingle();

    setLoading(false);

    if (profileError) {
      setMessage("Could not load profile role");
      return;
    }

    const role = profile?.role || "";

    if (role === "rep") {
      router.push("/rep-dashboard");
      return;
    }

    if (role === "team_leader") {
      router.push("/team-dashboard");
      return;
    }

    if (role === "assistant_admin" || role === "admin") {
      router.push("/admin-deals");
      return;
    }

    router.push("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        fontFamily: "system-ui",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "grid",
          gap: "14px",
          padding: "28px",
          borderRadius: "16px",
          background: "white",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/logo2.png"
            alt="Knox Doors Co"
            width={60}
            height={60}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Knox Doors Co
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#666",
            margin: 0,
          }}
        >
          Sales Portal Login
        </p>

        {message && (
          <div style={{ color: "red", fontSize: "13px" }}>{message}</div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "#111",
            color: "white",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  outline: "none",
};
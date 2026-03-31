"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/app/components/top-nav";
import { supabase } from "@/app/lib/supabase";

const ALL_ROLES = ["rep", "team_leader", "assistant_admin", "admin"];
const ASSISTANT_ADMIN_ALLOWED_ROLES = ["rep", "team_leader", "assistant_admin"];
const TEAM_LEADER_ALLOWED_ROLES = ["rep", "team_leader"];
const TEAMS = ["Internal", "Forsyth"];
const ROLE_FILTERS = ["all", "rep", "team_leader", "assistant_admin", "admin"];

export default function Page() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserTeam, setCurrentUserTeam] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("Checking access...");
  const [search, setSearch] = useState("");
  const [activeRoleFilter, setActiveRoleFilter] = useState("all");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      router.push("/login");
      return;
    }

    setCurrentUserEmail(user.email);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .single();

    if (profileError || !profile?.role) {
      setChecking(false);
      setMessage("Could not load role.");
      return;
    }

    setCurrentUserRole(profile.role || "");
    setCurrentUserTeam(profile.team || "");

    if (
      profile.role === "admin" ||
      profile.role === "assistant_admin" ||
      profile.role === "team_leader"
    ) {
      setAuthorized(true);
      setChecking(false);
      fetchUsers(profile.role, profile.team || "");
      return;
    }

    if (profile.role === "rep") {
      router.push("/rep-dashboard");
      return;
    }

    router.push("/login");
  }

  async function fetchUsers(roleOverride?: string, teamOverride?: string) {
    const actingRole = roleOverride || currentUserRole;
    const actingTeam = teamOverride || currentUserTeam;

    let query = supabase.from("profiles").select("*");

    if (actingRole === "team_leader") {
      query = query.eq("team", actingTeam);
    }

    const { data, error } = await query;

    if (error) {
      setMessage("Profiles fetch error: " + error.message);
      return;
    }

    const list = data || [];
    setUsers(list);
    setMessage(`Loaded ${list.length} user(s).`);
  }

  function getAllowedRoles() {
    if (currentUserRole === "admin") return ALL_ROLES;
    if (currentUserRole === "assistant_admin") return ASSISTANT_ADMIN_ALLOWED_ROLES;
    if (currentUserRole === "team_leader") return TEAM_LEADER_ALLOWED_ROLES;
    return [];
  }

  function canEditTarget(user: any) {
    if (currentUserRole === "admin") return true;

    if (currentUserRole === "assistant_admin") {
      if (user.role === "admin") return false;
      return true;
    }

    if (currentUserRole === "team_leader") {
      if (!currentUserTeam) return false;
      if (String(user.team || "") !== String(currentUserTeam || "")) return false;
      if (user.role === "assistant_admin" || user.role === "admin") return false;
      return true;
    }

    return false;
  }

  async function updateRole(id: string, newRole: string, targetUser: any) {
    const allowedRoles = getAllowedRoles();

    if (!allowedRoles.includes(newRole)) {
      setMessage("You do not have permission to assign that role.");
      return;
    }

    if (currentUserRole === "assistant_admin" && targetUser?.role === "admin") {
      setMessage("Assistant admins cannot modify admins.");
      return;
    }

    if (currentUserRole === "team_leader") {
      if (String(targetUser?.team || "") !== String(currentUserTeam || "")) {
        setMessage("Team leaders can only modify users on their own team.");
        return;
      }

      if (targetUser?.role === "assistant_admin" || targetUser?.role === "admin") {
        setMessage("Team leaders cannot modify assistant admins or admins.");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      setMessage("Update role error: " + error.message);
      return;
    }

    fetchUsers();
  }

  async function updateTeam(id: string, team: string, targetUser: any) {
    if (currentUserRole === "assistant_admin" && targetUser?.role === "admin") {
      setMessage("Assistant admins cannot modify admins.");
      return;
    }

    if (currentUserRole === "team_leader") {
      if (String(targetUser?.team || "") !== String(currentUserTeam || "")) {
        setMessage("Team leaders can only modify users on their own team.");
        return;
      }

      if (targetUser?.role === "assistant_admin" || targetUser?.role === "admin") {
        setMessage("Team leaders cannot modify assistant admins or admins.");
        return;
      }

      if (team !== currentUserTeam) {
        setMessage("Team leaders can only assign users to their own team.");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ team })
      .eq("id", id);

    if (error) {
      setMessage("Update team error: " + error.message);
      return;
    }

    fetchUsers();
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = String(user.full_name || user.name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const role = String(user.role || "").toLowerCase();
      const team = String(user.team || "").toLowerCase();
      const term = search.toLowerCase().trim();

      const matchesSearch =
        term === ""
          ? true
          : name.includes(term) ||
            email.includes(term) ||
            role.includes(term) ||
            team.includes(term);

      const matchesRole =
        activeRoleFilter === "all" ? true : role === activeRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, activeRoleFilter]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      rep: users.filter((u) => u.role === "rep").length,
      team_leader: users.filter((u) => u.role === "team_leader").length,
      assistant_admin: users.filter((u) => u.role === "assistant_admin").length,
      admin: users.filter((u) => u.role === "admin").length,
    };
  }, [users]);

  if (checking) {
    return (
      <div>
        <TopNav />
        <div style={{ padding: "24px", fontFamily: "system-ui" }}>{message}</div>
      </div>
    );
  }

  if (!authorized) return null;

  const allowedRoles = getAllowedRoles();

  return (
    <div>
      <TopNav />

      <div style={{ padding: "24px", marginTop: "10px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, margin: 0, marginBottom: "6px" }}>
              Role Manager
            </h1>
            <div style={{ fontSize: "14px", color: "#666" }}>
              Manage roles, teams, and access
            </div>
          </div>

          <div style={msgBox}>
            {message}
            {currentUserRole === "team_leader" && currentUserTeam
              ? ` You are limited to team: ${currentUserTeam}.`
              : ""}
          </div>

          <div style={toolbar}>
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRoleFilter(role)}
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  borderRadius: "999px",
                  border: activeRoleFilter === role ? "1px solid #111" : "1px solid #ddd",
                  background: activeRoleFilter === role ? "#111" : "#fff",
                  color: activeRoleFilter === role ? "#fff" : "#111",
                  cursor: "pointer",
                }}
              >
                {prettyFilter(role)} ({counts[role as keyof typeof counts]})
              </button>
            ))}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role, team..."
              style={searchInput}
            />
          </div>

          <div style={card}>
            <div style={cardHeader}>Team Members</div>

            <div style={{ overflowX: "auto" }}>
              <table style={table}>
                <thead>
                  <tr style={theadRow}>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Role</th>
                    <th style={th}>Team</th>
                    <th style={th}>Change Role</th>
                    <th style={th}>Assign Team</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const editable = canEditTarget(user);

                    return (
                      <tr key={user.id} style={tbodyRow}>
                        <td style={td}>{user.full_name || user.name || "-"}</td>
                        <td style={td}>{user.email || "-"}</td>

                        <td style={td}>
                          <span style={rolePill(user.role)}>{prettyRole(user.role)}</span>
                        </td>

                        <td style={td}>
                          <span style={teamPill()}>{user.team || "-"}</span>
                        </td>

                        <td style={td}>
                          {editable ? (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {allowedRoles.map((role) => (
                                <button
                                  key={role}
                                  onClick={() => updateRole(user.id, role, user)}
                                  style={tinyBtn(
                                    user.role === role ? "#111" : "#e5e7eb",
                                    user.role === role ? "white" : "#111"
                                  )}
                                >
                                  {prettyRole(role)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#666" }}>No access</span>
                          )}
                        </td>

                        <td style={td}>
                          {editable ? (
                            <select
                              value={user.team || ""}
                              onChange={(e) => updateTeam(user.id, e.target.value, user)}
                              style={{
                                padding: "10px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "10px",
                                background: "white",
                                fontSize: "13px",
                                minWidth: "140px",
                              }}
                            >
                              <option value="">Select team</option>
                              {TEAMS.map((team) => (
                                <option key={team} value={team}>
                                  {team}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#666" }}>No access</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#666" }}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const msgBox = {
  marginBottom: "16px",
  fontSize: "14px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#334155",
};

const toolbar = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  alignItems: "center",
  marginBottom: "16px",
};

const searchInput = {
  marginLeft: "auto",
  minWidth: "260px",
  padding: "10px 12px",
  fontSize: "13px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  outline: "none",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
};

const cardHeader = {
  padding: "18px 20px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "16px",
  fontWeight: 600,
};

const table = {
  width: "100%",
  minWidth: "1100px",
  borderCollapse: "collapse" as const,
  fontSize: "14px",
};

const theadRow = {
  textAlign: "left" as const,
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const tbodyRow = {
  borderBottom: "1px solid #f1f5f9",
};

const th = {
  padding: "14px 16px",
  fontWeight: 600,
  color: "#374151",
};

const td = {
  padding: "14px 16px",
  color: "#111827",
  verticalAlign: "top" as const,
};

function tinyBtn(bg: string, color: string) {
  return {
    padding: "6px 8px",
    fontSize: "11px",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };
}

function prettyRole(role: string) {
  if (role === "team_leader") return "Team Leader";
  if (role === "assistant_admin") return "Assistant Admin";
  if (role === "admin") return "Admin";
  if (role === "rep") return "Rep";
  return role || "-";
}

function prettyFilter(role: string) {
  if (role === "all") return "All";
  return prettyRole(role);
}

function rolePill(role: string) {
  if (role === "admin") return pill("#fee2e2", "#b91c1c");
  if (role === "assistant_admin") return pill("#fef3c7", "#92400e");
  if (role === "team_leader") return pill("#dbeafe", "#1d4ed8");
  return pill("#f3f4f6", "#374151");
}

function teamPill() {
  return pill("#f3f4f6", "#374151");
}

function pill(bg: string, color: string) {
  return {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    background: bg,
    color,
  };
}
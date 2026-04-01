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

type ProfileRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  team?: string | null;
};

export default function RoleManagerPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserTeam, setCurrentUserTeam] = useState("");

  const [users, setUsers] = useState<ProfileRow[]>([]);
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

    const { data, error } = await query.order("full_name", { ascending: true });

    if (error) {
      setMessage("Profiles fetch error: " + error.message);
      return;
    }

    const list = (data || []) as ProfileRow[];
    setUsers(list);
    setMessage(`Loaded ${list.length} user(s).`);
  }

  function getAllowedRoles() {
    if (currentUserRole === "admin") return ALL_ROLES;
    if (currentUserRole === "assistant_admin") return ASSISTANT_ADMIN_ALLOWED_ROLES;
    if (currentUserRole === "team_leader") return TEAM_LEADER_ALLOWED_ROLES;
    return [];
  }

  function canEditTarget(user: ProfileRow) {
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

  async function updateRole(id: string, newRole: string, targetUser: ProfileRow) {
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

    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);

    if (error) {
      setMessage("Update role error: " + error.message);
      return;
    }

    fetchUsers();
  }

  async function updateTeam(id: string, team: string, targetUser: ProfileRow) {
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

    const { error } = await supabase.from("profiles").update({ team }).eq("id", id);

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

      const matchesRole = activeRoleFilter === "all" ? true : role === activeRoleFilter;

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
      <div className="min-h-screen bg-zinc-50">
        <TopNav />
        <div className="px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-zinc-500">{message}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  const allowedRoles = getAllowedRoles();

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav />

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto max-w-7xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              Role Manager
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage roles, teams, and access.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
            {message}
            {currentUserRole === "team_leader" && currentUserTeam
              ? ` You are limited to team: ${currentUserTeam}.`
              : ""}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {ROLE_FILTERS.map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRoleFilter(role)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      activeRoleFilter === role
                        ? "border border-zinc-900 bg-zinc-900 text-white"
                        : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    {prettyFilter(role)} ({counts[role as keyof typeof counts]})
                  </button>
                ))}
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role, team..."
                className="h-11 w-full rounded-2xl border border-zinc-300 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-zinc-900"
              />
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredUsers.map((user) => {
              const editable = canEditTarget(user);

              return (
                <div key={user.id} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-zinc-950">
                        {user.full_name || user.name || "-"}
                      </div>
                      <div className="mt-1 break-all text-sm text-zinc-500">
                        {user.email || "-"}
                      </div>
                    </div>
                    <RolePill role={user.role || ""} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoItem label="Role" value={prettyRole(user.role || "")} />
                    <InfoItem label="Team" value={user.team || "-"} />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Assign Role
                      </div>
                      {editable ? (
                        <div className="flex flex-wrap gap-2">
                          {allowedRoles.map((role) => (
                            <button
                              key={role}
                              onClick={() => updateRole(user.id, role, user)}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                user.role === role
                                  ? "bg-zinc-900 text-white"
                                  : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                              }`}
                            >
                              {prettyRole(role)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500">No access</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Assign Team
                      </div>
                      {editable ? (
                        <select
                          value={user.team || ""}
                          onChange={(e) => updateTeam(user.id, e.target.value, user)}
                          className="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                        >
                          <option value="">Select team</option>
                          {TEAMS.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-zinc-500">No access</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm">
                No users found.
              </div>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm md:block">
            <div className="border-b border-zinc-200 px-5 py-4 text-base font-semibold text-zinc-900">
              Team Members
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-sm">
                <thead className="bg-zinc-50">
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Role</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Team</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Change Role</th>
                    <th className="px-4 py-3 font-semibold text-zinc-700">Assign Team</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const editable = canEditTarget(user);

                    return (
                      <tr key={user.id} className="border-b border-zinc-100 align-top">
                        <td className="px-4 py-4 text-zinc-900">{user.full_name || user.name || "-"}</td>
                        <td className="px-4 py-4 text-zinc-700">{user.email || "-"}</td>
                        <td className="px-4 py-4">
                          <RolePill role={user.role || ""} />
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            {user.team || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {editable ? (
                            <div className="flex flex-wrap gap-2">
                              {allowedRoles.map((role) => (
                                <button
                                  key={role}
                                  onClick={() => updateRole(user.id, role, user)}
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                                    user.role === role
                                      ? "bg-zinc-900 text-white"
                                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                                  }`}
                                >
                                  {prettyRole(role)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500">No access</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editable ? (
                            <select
                              value={user.team || ""}
                              onChange={(e) => updateTeam(user.id, e.target.value, user)}
                              className="h-10 min-w-[150px] rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                            >
                              <option value="">Select team</option>
                              {TEAMS.map((team) => (
                                <option key={team} value={team}>
                                  {team}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-zinc-500">No access</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
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

function RolePill({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Admin
      </span>
    );
  }

  if (role === "assistant_admin") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Assistant Admin
      </span>
    );
  }

  if (role === "team_leader") {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
        Team Leader
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
      Rep
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm text-zinc-900">{value}</div>
    </div>
  );
}
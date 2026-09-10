"use client";

import { useState, useTransition } from "react";
import {
  createStaffUser,
  deleteStaffUser,
  updateStaffUser,
} from "@/actions/users";
import type { PublicStaffUser } from "@/lib/users";
import { phDateTimeLabel } from "@/lib/datetime";
import type { LoginActivity, Session } from "@/lib/types";

const field =
  "w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900";

type UserManagerProps = {
  users: PublicStaffUser[];
  session: Session;
  loginActivity: LoginActivity[];
};

type SubTab = "manage" | "add" | "activity";
type StaffRole = "Admin" | "Barista" | "Manager" | "Cashier";

type CashierSession = {
  id: string;
  userId: string;
  username: string;
  name: string;
  loginAt: string | null;
  logoutAt: string | null;
};

function pairLoginSessions(records: LoginActivity[]): CashierSession[] {
  const chronological = [...records].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );
  const openByUser = new Map<string, CashierSession[]>();
  const sessions: CashierSession[] = [];

  for (const record of chronological) {
    const open = openByUser.get(record.userId) ?? [];
    if (record.type === "login") {
      const session: CashierSession = {
        id: record.id,
        userId: record.userId,
        username: record.username,
        name: record.name,
        loginAt: record.at,
        logoutAt: null,
      };
      sessions.push(session);
      open.push(session);
      openByUser.set(record.userId, open);
    } else {
      const unpaired = open.pop();
      if (unpaired) {
        unpaired.logoutAt = record.at;
      } else {
        sessions.push({
          id: record.id,
          userId: record.userId,
          username: record.username,
          name: record.name,
          loginAt: null,
          logoutAt: record.at,
        });
      }
    }
  }

  return sessions.sort((a, b) => {
    const aTime = a.loginAt ?? a.logoutAt ?? "";
    const bTime = b.loginAt ?? b.logoutAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

export function UserManager({ users, session, loginActivity }: UserManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("manage");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<StaffRole>("Barista");
  const [title, setTitle] = useState(""); 
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editing = users.find((user) => user.id === editingId) ?? null;

  function startCreate() {
    setEditingId("new");
    setName("");
    setUsername("");
    setRole("Barista");
    setTitle("");
    setPassword("");
    setNotice(null);
  }

  function startEdit(user: PublicStaffUser) {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setTitle(user.title ?? "");
    
    const lowerRole = user.role.toLowerCase();
    let mappedRole: StaffRole = "Barista";
    if (lowerRole === "admin") {
      mappedRole = "Admin";
    } else if (lowerRole === "manager") {
      mappedRole = "Manager";
    } else if (lowerRole === "cashier") {
      mappedRole = "Cashier";
    } else if (lowerRole === "barista") {
      mappedRole = "Barista";
    }

    setRole(mappedRole);
    setPassword("");
    setNotice(null);
  }

  function resetForm() {
    setEditingId(null);
    setPassword("");
  }

  return (
    <div className="min-h-screen bg-neutral-50/30 w-full">
      <div className="flex w-full gap-4 overflow-x-auto border-b border-neutral-200 bg-white px-4 text-sm sm:gap-8 sm:px-6">
        {(
          [
            { id: "manage", label: "Manage User" },
            { id: "add", label: "Add Staff" },
            { id: "activity", label: "Activity login for cashier" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSubTab(tab.id);
              if (tab.id === "add") {
                startCreate();
              } else if (tab.id === "manage" && editingId === "new") {
                resetForm();
              }
            }}
            className={`relative shrink-0 py-3 font-medium whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? "text-neutral-900 border-b-2 border-neutral-900 -mb-px"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
        {(activeSubTab === "manage" || activeSubTab === "add") && (
          <div className="space-y-6 w-full">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {activeSubTab === "add" ? "Add staff" : "Manage users"}
              </h1>
            </div>

            {(activeSubTab === "add" || (editingId !== null && editingId !== "new")) ? (
              <form
                className="space-y-4 border border-neutral-200 bg-white p-4 rounded-2xl shadow-sm transition-all w-full sm:p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  startTransition(async () => {
                    const dbRole = role.toLowerCase();
                    
                    const finalUsername = 
                      !username.trim() && role === "Barista"
                        ? name.toLowerCase().replace(/\s+/g, "") + "_barista"
                        : username;

                    const finalPassword = 
                      !password.trim() && editingId === "new" && role === "Barista"
                        ? "barista123" 
                        : password;

                    const payload = { 
                      name, 
                      username: finalUsername, 
                      title: title || (role === "Barista" ? "Barista" : role), 
                      role: dbRole, 
                      password: finalPassword 
                    };

                    const result =
                      editingId === "new"
                        ? await createStaffUser(payload)
                        : editingId
                          ? await updateStaffUser({ id: editingId, ...payload })
                          : { error: "Account not found." };

                    if (result && "error" in result && result.error) {
                      setNotice(result.error);
                      return;
                    }
                    if (editingId === "new") {
                      startCreate();
                      setNotice("Staff added successfully.");
                    } else {
                      resetForm();
                      setNotice("Account updated successfully.");
                    }
                  });
                }}
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                    {editingId === "new" ? "New Account" : `Edit account: ${editing?.name ?? ""}`}
                  </p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-medium text-neutral-600">
                    <span className="mb-1.5 block">Name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className={field}
                      placeholder="Full Name"
                      required
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-600">
                    <span className="mb-1.5 block">
                      Username {role === "Barista" && <span className="text-neutral-400 font-normal">(Optional for Barista)</span>}
                    </span>
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className={field}
                      placeholder={role === "Barista" ? "Auto-generated if left blank" : "login name"}
                      autoComplete="off"
                      required={role !== "Barista"}
                    />
                  </label>

                  <label className="text-xs font-medium text-neutral-600 sm:col-span-2">
                    <span className="mb-1.5 block">
                      Title {role === "Barista" && <span className="text-neutral-400 font-normal">(Optional, defaults to Barista)</span>}
                    </span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className={field}
                      placeholder={role === "Barista" ? "Head Barista, Senior Barista, etc." : "Barista, Manager, Cashier"}
                    />
                  </label>

                  <label className="text-xs font-medium text-neutral-600 sm:col-span-2">
                    <span className="mb-1.5 block">
                      Password {role === "Barista" && <span className="text-neutral-400 font-normal">(Defaults if left blank)</span>}
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={field}
                      placeholder={role === "Barista" ? "Default: barista123 if left blank" : "at least 4 characters"}
                      autoComplete="new-password"
                      required={editingId === "new" && role !== "Barista"}
                    />
                  </label>
                </div>

                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["Admin", "Manager", "Cashier", "Barista"] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRole(id)}
                        className={`rounded-xl border py-2.5 text-xs font-semibold tracking-wide transition-all ${
                          role === id
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>

                {notice ? <p className="text-xs font-medium text-red-600">{notice}</p> : null}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 disabled:opacity-40 transition-all"
                  >
                    {editingId === "new" ? "Add" : "Save Changes"}
                  </button>
                  {activeSubTab === "manage" ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 transition-all"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}

            {activeSubTab === "add" && notice ? (
              <p className="text-xs font-medium text-neutral-600 bg-neutral-100 p-3 rounded-xl">{notice}</p>
            ) : null}

            {activeSubTab === "manage" && !editingId && notice ? (
              <p className="text-xs font-medium text-neutral-600 bg-neutral-100 p-3 rounded-xl">{notice}</p>
            ) : null}

            {activeSubTab === "manage" ? (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-neutral-100 w-full">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 px-4 py-4 transition-all hover:bg-neutral-50/50 sm:px-6"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {user.name}
                      </p>
                      {user.id === session.userId ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 uppercase">
                          you
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {user.username} <span className="text-neutral-300">·</span> {user.title || user.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${user.name}`}
                      onClick={() => startEdit(user)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path
                          d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <path d="M13.5 6.5l3 3" strokeWidth="1.7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${user.name}`}
                      disabled={pending || user.id === session.userId}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteStaffUser(user.id);
                          if ("error" in result) {
                            setNotice(result.error ?? "Could not delete.");
                            return;
                          }
                          if (editingId === user.id) resetForm();
                          setNotice("Account deleted.");
                        })
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" strokeWidth="1.7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            ) : null}
          </div>
        )}

        {activeSubTab === "activity" && (
          <div className="space-y-6 w-full">
            <div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Activity login for cashier
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Login and logout times for cashiers on the POS.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm w-full">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black bg-black text-white text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Cashier</th>
                    <th className="px-4 py-3 sm:px-6">Login</th>
                    <th className="px-4 py-3 sm:px-6">Logout</th>
                  </tr>
                </thead>
                <tbody>
                  {loginActivity.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-neutral-400 sm:px-6">
                        No cashier login or logout yet.
                      </td>
                    </tr>
                  ) : (
                    pairLoginSessions(loginActivity).map((row) => (
                      <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-3 sm:px-6">
                          <p className="font-semibold text-neutral-900">{row.name}</p>
                          <p className="text-xs text-neutral-400">{row.username}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-700 sm:px-6">
                          {row.loginAt ? phDateTimeLabel(row.loginAt) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-neutral-700 sm:px-6">
                          {row.logoutAt ? phDateTimeLabel(row.logoutAt) : "Still in"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


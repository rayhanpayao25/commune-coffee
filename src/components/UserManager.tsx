"use client";

import { useState, useTransition } from "react";
import {
  createStaffUser,
  deleteStaffUser,
  updateStaffUser,
} from "@/actions/users";
import type { PublicStaffUser } from "@/lib/users";
import type { Session } from "@/lib/types";

const field =
  "w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900";

type UserManagerProps = {
  users: PublicStaffUser[];
  session: Session;
};

type SubTab = "staff" | "inout" | "off";
type StaffRole = "Admin" | "Barista" | "Manager" | "Cashier";

type InOutRecord = {
  id: string;
  staffName: string;
  type: "Clock In" | "Clock Out";
  time: string;
  date: string;
};

type OffRecord = {
  id: string;
  staffName: string;
  date: string;
  reason: string;
};

export function UserManager({ users, session }: UserManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("staff");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<StaffRole>("Barista");
  const [title, setTitle] = useState(""); 
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [inOutRecords, setInOutRecords] = useState<InOutRecord[]>([
    { id: "1", staffName: "ray123", type: "Clock In", time: "08:00 AM", date: "2026-09-09" },
  ]);
  const [manualStaff, setManualStaff] = useState("");
  const [manualType, setManualType] = useState<"Clock In" | "Clock Out">("Clock In");
  const [manualTime, setManualTime] = useState("");
  const [manualDate, setManualDate] = useState("");

  const [offRecords, setOffRecords] = useState<OffRecord[]>([
    { id: "1", staffName: "ray123", date: "2026-09-15", reason: "Personal Day Off" },
  ]);
  const [offStaff, setOffStaff] = useState("");
  const [offDate, setOffDate] = useState("");
  const [offReason, setOffReason] = useState("");

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
      <div className="flex border-b border-neutral-200 bg-white px-6 gap-8 text-sm w-full">
        {(
          [
            { id: "staff", label: "Staff" },
            { id: "inout", label: "In/Out" },
            { id: "off", label: "OFF / Request Off" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`py-3 font-medium transition-all relative ${
              activeSubTab === tab.id
                ? "text-neutral-900 border-b-2 border-neutral-900 -mb-px"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full px-6 py-8">
        {activeSubTab === "staff" && (
          <div className="space-y-6 w-full">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                  Manage users
                </h1>
              </div>
              <button
                type="button"
                onClick={startCreate}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-all"
              >
                Add staff
              </button>
            </div>

            {editingId ? (
              <form
                className="space-y-4 border border-neutral-200 bg-white p-6 rounded-2xl shadow-sm transition-all w-full"
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
                        : await updateStaffUser({ id: editingId, ...payload });

                    if (result && "error" in result && result.error) {
                      setNotice(result.error);
                      return;
                    }
                    setNotice(editingId === "new" ? "Staff added successfully." : "Account updated successfully.");
                    resetForm();
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
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {!editingId && notice ? (
              <p className="text-xs font-medium text-neutral-600 bg-neutral-100 p-3 rounded-xl">{notice}</p>
            ) : null}

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-neutral-100 w-full">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50/50 transition-all"
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
          </div>
        )}

        {activeSubTab === "inout" && (
          <div className="space-y-6 w-full">
            <div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Manual In/Out Entry
              </h1>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualStaff || !manualTime || !manualDate) return;
                setInOutRecords([
                  {
                    id: Date.now().toString(),
                    staffName: manualStaff,
                    type: manualType,
                    time: manualTime,
                    date: manualDate,
                  },
                  ...inOutRecords,
                ]);
                setManualStaff("");
                setManualTime("");
                setManualDate("");
              }}
              className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm space-y-4 w-full"
            >
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase border-b border-neutral-100 pb-3">
                Add Manual Time Log
              </p>
              <div className="grid gap-4 sm:grid-cols-4">
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Staff Member</span>
                  <select
                    value={manualStaff}
                    onChange={(e) => setManualStaff(e.target.value)}
                    className={field}
                    required
                  >
                    <option value="">Select staff...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.name} ({u.username})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Log Type</span>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as "Clock In" | "Clock Out")}
                    className={field}
                  >
                    <option value="Clock In">Clock In</option>
                    <option value="Clock Out">Clock Out</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Date</span>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className={field}
                    required
                  />
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Time</span>
                  <input
                    type="text"
                    placeholder="e.g. 08:30 AM"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className={field}
                    required
                  />
                </label>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </form>

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm w-full">
              <div className="px-6 py-3 border-b border-neutral-100 bg-neutral-50/50">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Attendance Logs</p>
              </div>
              <div className="divide-y divide-neutral-100">
                {inOutRecords.length === 0 ? (
                  <p className="p-6 text-center text-xs text-neutral-400">No time logs available.</p>
                ) : (
                  inOutRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between px-6 py-4 text-sm">
                      <div>
                        <span className="font-semibold text-neutral-900">{record.staffName}</span>
                        <span className="mx-2 text-neutral-300">·</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          record.type === "Clock In" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {record.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-500 font-medium">
                          {record.date} at {record.time}
                        </span>
                        <button
                          type="button"
                          aria-label="Delete entry"
                          onClick={() => setInOutRecords(inOutRecords.filter((r) => r.id !== record.id))}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                            <path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" strokeWidth="1.7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "off" && (
          <div className="space-y-6 w-full">
            <div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Manual Day Off / Leave Entry
              </h1>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!offStaff || !offDate || !offReason) return;
                setOffRecords([
                  {
                    id: Date.now().toString(),
                    staffName: offStaff,
                    date: offDate,
                    reason: offReason,
                  },
                  ...offRecords,
                ]);
                setOffStaff("");
                setOffDate("");
                setOffReason("");
              }}
              className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm space-y-4 w-full"
            >
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase border-b border-neutral-100 pb-3">
                Add Manual Day Off Record
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Staff Member</span>
                  <select
                    value={offStaff}
                    onChange={(e) => setOffStaff(e.target.value)}
                    className={field}
                    required
                  >
                    <option value="">Select staff...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.name} ({u.username})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Target Date</span>
                  <input
                    type="date"
                    value={offDate}
                    onChange={(e) => setOffDate(e.target.value)}
                    className={field}
                    required
                  />
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  <span className="mb-1.5 block">Reason / Note</span>
                  <input
                    type="text"
                    placeholder="e.g. Scheduled Rest Day"
                    value={offReason}
                    onChange={(e) => setOffReason(e.target.value)}
                    className={field}
                    required
                  />
                </label>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-all"
                >
                  Save Day Off
                </button>
              </div>
            </form>

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm w-full">
              <div className="px-6 py-3 border-b border-neutral-100 bg-neutral-50/50">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recorded Days Off</p>
              </div>
              <div className="divide-y divide-neutral-100">
                {offRecords.length === 0 ? (
                  <p className="p-6 text-center text-xs text-neutral-400">No manual days off recorded.</p>
                ) : (
                  offRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between px-6 py-4 text-sm">
                      <div>
                        <p className="font-semibold text-neutral-900">{record.staffName}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Note: {record.reason}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-3 py-1 rounded-lg">
                          {record.date}
                        </span>
                        <button
                          type="button"
                          aria-label="Delete day off record"
                          onClick={() => setOffRecords(offRecords.filter((r) => r.id !== record.id))}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                            <path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" strokeWidth="1.7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  encodeSession,
  getSession,
  homeForRole,
  sessionCookieOptions,
} from "@/lib/auth";
import { getStore, recordAuthActivity } from "@/lib/store";
import { toSession } from "@/lib/users";

export type LoginState = {
  error?: string;
};

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter a username and password." };
  }

  const store = await getStore();
  const user = store.users.find(
    (entry) => entry.username === username.toLowerCase() && entry.password === password,
  );
  if (!user) {
    return { error: "Those credentials do not match a commune staff account." };
  }

  const session = toSession(user);
  await recordAuthActivity({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    type: "login",
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions());

  redirect(homeForRole(session.role));
}

export async function logout() {
  const session = await getSession();
  if (session) {
    await recordAuthActivity({
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
      type: "logout",
    });
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

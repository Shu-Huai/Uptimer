import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";

import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from "./constants";

type SessionPayload = {
  sub: string;
  email: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? "dev-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

async function signSession(payload: SessionPayload) {
  const exp = Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE;
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getAuthSecret());
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    return null;
  }
}

async function shouldUseSecureCookie() {
  const envOverride = process.env.AUTH_COOKIE_SECURE;
  if (envOverride === "true") {
    return true;
  }
  if (envOverride === "false") {
    return false;
  }

  const headerStore = await headers();

  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "").toLowerCase();
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]")) {
    return false;
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  const origin = headerStore.get("origin") ?? headerStore.get("referer");
  if (origin) {
    try {
      return new URL(origin).protocol === "https:";
    } catch {
      // Ignore invalid origin/referer and fallback to NODE_ENV.
    }
  }

  return process.env.NODE_ENV === "production";
}

export async function setSession(userId: string, email: string) {
  const cookieStore = await cookies();
  const token = await signSession({ sub: userId, email });
  const secure = await shouldUseSecureCookie();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function getCurrentUserId() {
  const session = await getSession();
  return session?.sub ?? null;
}

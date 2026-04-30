import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";

export async function GET(request: Request) {
  const url = new URL("/auth/login", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

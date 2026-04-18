import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/lib/env";
import { supabaseResilientFetch } from "@/lib/network/resilient-fetch";
import { APP_ROLES, type AppRole } from "@/types/app";
import type { Database } from "@/types/database";

const ROLE_ROUTES: Record<AppRole, string> = {
  ADMIN: "/admin",
  LECTURER: "/lecturer",
  STUDENT: "/student",
};

const PUBLIC_ROUTES = new Set([
  "/auth/callback",
  "/forgot-password",
  "/login",
  "/reset-password",
]);

function isRoleRoute(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith("/auth/callback/")
  );
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

function buildRedirectResponse(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  params?: Record<string, string>,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      redirectUrl.searchParams.set(key, value);
    });
  }

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyCookies(response, redirectResponse);
  return redirectResponse;
}

function getRoleHomePath(roleCode: string | null | undefined) {
  if (roleCode && APP_ROLES.includes(roleCode as AppRole)) {
    return ROLE_ROUTES[roleCode as AppRole];
  }

  return "/dashboard";
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
      global: {
        fetch: supabaseResilientFetch,
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = isPublicRoute(pathname);

  if (!session) {
    if (isPublicPath) {
      return response;
    }

    return buildRedirectResponse(request, response, "/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_code, status")
    .eq("id", session.user.id)
    .maybeSingle();

  const typedProfile = profile as
    | { role_code: string | null; status: string | null }
    | null;

  if (profileError || !typedProfile) {
    await supabase.auth.signOut();
    return buildRedirectResponse(request, response, "/login", {
      error: "Không thể tải hồ sơ người dùng.",
    });
  }

  if (typedProfile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return buildRedirectResponse(request, response, "/login", {
      error: "inactive",
    });
  }

  if (!typedProfile.role_code || !APP_ROLES.includes(typedProfile.role_code as AppRole)) {
    await supabase.auth.signOut();
    return buildRedirectResponse(request, response, "/login", {
      error: "invalid-role",
    });
  }

  if (pathname === "/login") {
    return buildRedirectResponse(
      request,
      response,
      getRoleHomePath(typedProfile.role_code),
    );
  }

  for (const [role, prefix] of Object.entries(ROLE_ROUTES)) {
    if (
      isRoleRoute(pathname, prefix) &&
      typedProfile.role_code !== role
    ) {
      return buildRedirectResponse(
        request,
        response,
        getRoleHomePath(typedProfile.role_code),
      );
    }
  }

  return response;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_ROUTES = {
  ADMIN: "/admin",
  LECTURER: "/lecturer",
  STUDENT: "/student",
} as const;

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
  return PUBLIC_ROUTES.has(pathname) || pathname.startsWith("/auth/callback/");
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

function resolveRoleHome(roleCode: string | null | undefined) {
  if (!roleCode) {
    return "/login";
  }

  const mapped = ROLE_ROUTES[roleCode as keyof typeof ROLE_ROUTES];
  return mapped ?? "/login";
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  if (!session) {
    if (isPublicRoute(pathname)) {
      return response;
    }

    return buildRedirectResponse(request, response, "/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_code, status")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return buildRedirectResponse(request, response, "/login", {
      error: "profile",
    });
  }

  const typedProfile = profile as {
    role_code: keyof typeof ROLE_ROUTES | null;
    status: string | null;
  };

  if (typedProfile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return buildRedirectResponse(request, response, "/login", {
      error: "inactive",
    });
  }

  if (pathname === "/login") {
    return buildRedirectResponse(
      request,
      response,
      resolveRoleHome(typedProfile.role_code),
    );
  }

  for (const [role, prefix] of Object.entries(ROLE_ROUTES)) {
    if (isRoleRoute(pathname, prefix) && typedProfile.role_code !== role) {
      return buildRedirectResponse(
        request,
        response,
        resolveRoleHome(typedProfile.role_code),
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

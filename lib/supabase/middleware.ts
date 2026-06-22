// middleware.ts

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/auth/callback");

  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profiel") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/eurofittest") ||
    pathname.startsWith("/functional-fitheidstest") ||
    pathname.startsWith("/challenges") ||
    pathname.startsWith("/sportfolio") ||
    pathname.startsWith("/workouts") ||
    pathname.startsWith("/hall-of-fame") ||
    pathname.startsWith("/les-lo") ||
    pathname.startsWith("/reservaties") ||
    pathname.startsWith("/extramurale-sportactiviteiten") ||
    pathname.startsWith("/links") ||
    pathname.startsWith("/ideeenbus");

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return "/dashboard";
  return value;
}

const protectedPrefixes = [
  "/leerkrachten-lo", "/dashboard", "/profiel", "/admin",
  "/eurofittest", "/functional-fitheidstest", "/challenges",
  "/sportfolio", "/workouts", "/hall-of-fame", "/les-lo",
  "/reservaties", "/extramurale-sportactiviteiten", "/links", "/ideeenbus",
];
const isProtected = (path: string) => protectedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix + "/"));

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const protectedPage = isProtected(pathname);
  const enforce = process.env.ENFORCE_SCHOOL_ACCESS === "true";
  let allowed = Boolean(user);
  if (user && enforce && (protectedPage || pathname === "/login")) {
    const { data, error } = await supabase.rpc("school_access_allowed");
    allowed = !error && data === true;
  }
  if (protectedPage && !allowed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (!user) url.searchParams.set("next", pathname + request.nextUrl.search);
    else url.searchParams.set("blocked", "1");
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  if (user && allowed && pathname === "/login") {
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = next.split("?")[0].split("#")[0];
    url.search = next.includes("?") ? "?" + next.split("?").slice(1).join("?") : "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

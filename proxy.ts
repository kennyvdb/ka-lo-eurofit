export { middleware as proxy } from "./lib/supabase/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*", "/profiel/:path*", "/admin/:path*",
    "/leerkrachten-lo/:path*", "/eurofittest/:path*",
    "/functional-fitheidstest/:path*", "/challenges/:path*",
    "/sportfolio/:path*", "/workouts/:path*", "/hall-of-fame/:path*",
    "/les-lo/:path*", "/reservaties/:path*",
    "/extramurale-sportactiviteiten/:path*", "/links/:path*", "/ideeenbus/:path*",
  ],
};

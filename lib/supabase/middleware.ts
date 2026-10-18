import {type NextRequest,NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
function safeNext(value:string|null){if(!value||!value.startsWith("/")||value.startsWith("//")||value.includes("\\")||/[\r\n]/.test(value))return "/dashboard";return value;}
export async function middleware(request:NextRequest){
let response=NextResponse.next({request});
const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return request.cookies.getAll();},setAll(cookiesToSet){cookiesToSet.forEach(({name,value,options})=>{request.cookies.set(name,value);response.cookies.set(name,value,options);});}}});
const {data:{user}}=await supabase.auth.getUser();
const pathname=request.nextUrl.pathname;
const isProtectedPage=pathname.startsWith("/leerkrachten-lo")||pathname.startsWith("/dashboard")||pathname.startsWith("/profiel")||pathname.startsWith("/admin")||pathname.startsWith("/eurofittest")||pathname.startsWith("/functional-fitheidstest")||pathname.startsWith("/challenges")||pathname.startsWith("/sportfolio")||pathname.startsWith("/workouts")||pathname.startsWith("/hall-of-fame")||pathname.startsWith("/les-lo")||pathname.startsWith("/reservaties")||pathname.startsWith("/extramurale-sportactiviteiten")||pathname.startsWith("/links")||pathname.startsWith("/ideeenbus");
if(!user&&isProtectedPage){const url=request.nextUrl.clone();const next=pathname+request.nextUrl.search;url.pathname="/login";url.search="";url.searchParams.set("next",next);const redirect=NextResponse.redirect(url);response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));return redirect;}
if(user&&pathname==="/login"){const url=request.nextUrl.clone();const next=safeNext(request.nextUrl.searchParams.get("next"));url.pathname=next.split("?")[0].split("#")[0];url.search=next.includes("?")?"?"+next.split("?").slice(1).join("?"):"";const redirect=NextResponse.redirect(url);response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));return redirect;}
return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};

// lib/auth/guards.ts

import { redirect } from "next/navigation";

import {
  isAdministratiefPersoneel,
  isLeerkracht,
  isLeerkrachtLo,
  isLeerling,
  type AppRole,
} from "@/lib/auth/roles";

import {
  requireProfile,
  type RequiredProfile,
} from "@/lib/auth/requireProfile";

export async function requireLeerling(): Promise<RequiredProfile> {
  const result = await requireProfile();

  if (!isLeerling(result.appRole)) {
    redirect("/dashboard");
  }

  return result;
}

export async function requireLeerkracht(): Promise<RequiredProfile> {
  const result = await requireProfile();

  if (!isLeerkracht(result.appRole)) {
    redirect("/dashboard");
  }

  return result;
}

export async function requireLeerkrachtLo(): Promise<RequiredProfile> {
  const result = await requireProfile();

  if (!isLeerkrachtLo(result.appRole)) {
    redirect("/dashboard");
  }

  return result;
}

export async function requireAdmin(): Promise<RequiredProfile> {
  const result = await requireProfile();

  if (!isAdministratiefPersoneel(result.appRole)) {
    redirect("/dashboard");
  }

  return result;
}

export async function requireRoles(
  allowedRoles: AppRole[]
): Promise<RequiredProfile> {
  const result = await requireProfile();

  if (!allowedRoles.includes(result.appRole)) {
    redirect("/dashboard");
  }

  return result;
}
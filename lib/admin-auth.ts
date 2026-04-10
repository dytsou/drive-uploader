import { auth } from "@/auth";
import type { Session } from "next-auth";

export type AdminSession = Session & {
  user: NonNullable<Session["user"]> & { role: "ADMIN" };
};

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return session as unknown as AdminSession;
}

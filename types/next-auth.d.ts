import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      role?: "ADMIN" | "USER" | "GUEST" | "EDITOR";
      isGuest?: boolean;
      twoFactorRequired?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "USER" | "GUEST" | "EDITOR";
    isGuest?: boolean;
    twoFactorRequired?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "USER" | "GUEST" | "EDITOR";
    isGuest?: boolean;
    email?: string | null;
    twoFactorRequired?: boolean;
  }
}

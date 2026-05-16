import { UserRole } from "@lf/shared";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

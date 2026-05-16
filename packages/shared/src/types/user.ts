export enum UserRole {
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
  MANAGER = "MANAGER",
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthLoginResponse {
  /** @deprecated прибрати після переходу UI на accessToken */
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IUser;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

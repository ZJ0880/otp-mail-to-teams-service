export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterUserDto {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  token: string;
  expiresAt: string;
  role: string;
  displayName: string;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: UserRole;
}

export interface AuthSessionPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";



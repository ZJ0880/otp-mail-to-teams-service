export interface AdminSession {
  userId: string;
  username: string;
  role: "ADMIN" | "USER";
}

export interface AdminTokenPayload {
  token: string;
  expiresAt: string;
  displayName: string;
}

export interface JwtAdminPayload {
  sub: string; // user id or special subject
  username: string;
  role?: string;
  iss?: string;
  aud?: string;
}


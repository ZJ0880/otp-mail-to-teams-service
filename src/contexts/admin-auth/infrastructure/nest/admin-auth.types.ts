export interface AdminSession {
  adminId: string;
  username: string;
}

export interface AdminTokenPayload {
  token: string;
  expiresAt: string;
  displayName: string;
}

export interface JwtAdminPayload {
  sub: string;
  username: string;
  iss?: string;
  aud?: string;
}


export interface AuthenticatedUserRecord {
  id: string;
  name: string;
  lastName?: string | null;
  document?: string | null;
  email: string;
  role: string;
  isActive: boolean;
}

export interface UserAuthenticationPort {
  authenticate(input: { email: string; password: string }): Promise<AuthenticatedUserRecord>;
}

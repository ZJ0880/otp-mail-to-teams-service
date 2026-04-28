export interface PasswordHashPort {
  hash(password: string): string;
}

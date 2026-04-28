export interface UserRecord {
  id: string;
  name: string;
  lastName?: string | null;
  document?: string | null;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  lastName?: string;
  document?: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
}

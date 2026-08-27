// matches the users table columns
export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
}

// what we send back to the client (no password hash)
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthenticatedUser {
  id: number;
}

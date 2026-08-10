/**
 * A row of the `users` table. Field names deliberately mirror the database
 * columns so repository queries need no aliasing; everything above the
 * repository works with `PublicUser` instead.
 */
export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/** Values needed to insert a user. The plaintext password never appears here. */
export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
}

/** The only user shape the API is allowed to return. */
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

/**
 * Identity established from a verified JWT. Holds the user id only: the token
 * carries no profile data, so handlers that need a name or email read the
 * current row from the database.
 */
export interface AuthenticatedUser {
  id: number;
}

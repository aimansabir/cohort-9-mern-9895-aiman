/**
 * A row of the `notes` table. Field names mirror the database columns so
 * repository queries need no aliasing; everything above the repository works
 * with `PublicNote` instead.
 */
export interface NoteRecord {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

/** Values needed to insert a note. The user id comes from the JWT identity. */
export interface NewNote {
  userId: number;
  title: string;
  content: string;
}

/** Fields that may be changed on an existing note. */
export interface UpdateNote {
  title: string;
  content: string;
}

/**
 * The only note shape the API is allowed to return. Deliberately excludes
 * `user_id` because the client already knows which user it is acting as, and
 * exposing the owner would leak information in a multi-user attack scenario.
 */
export interface PublicNote {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

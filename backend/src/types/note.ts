export interface NoteRecord {
  id: number;
  user_id: number;
  title: string;
  content: string;
  // TINYINT comes back as 0 or 1 rather than a boolean
  is_favourite: number;
  label: string;
  created_at: Date;
  updated_at: Date;
}

// the user id comes from the JWT, never from the request body
export interface NewNote {
  userId: number;
  title: string;
  content: string;
  label: string;
  isFavourite: boolean;
}

// Every field is optional so the same shape covers a full edit and a one
// field change such as starring a note. Whatever is left out is left alone.
export interface NoteChanges {
  title?: string;
  content?: string;
  label?: string;
  isFavourite?: boolean;
}

export interface PublicNote {
  id: number;
  title: string;
  content: string;
  isFavourite: boolean;
  label: string;
  createdAt: string;
  updatedAt: string;
}

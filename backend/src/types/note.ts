export interface NoteRecord {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// the user id comes from the JWT, never from the request body
export interface NewNote {
  userId: number;
  title: string;
  content: string;
}

export interface UpdateNote {
  title: string;
  content: string;
}

export interface PublicNote {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

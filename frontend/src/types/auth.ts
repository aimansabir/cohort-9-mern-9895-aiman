export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface User {
  id: string;
  username: string;
  password: string; // bcrypt hashed
  createdAt: string;
}

export interface UserResponse {
  id: string;
  username: string;
}

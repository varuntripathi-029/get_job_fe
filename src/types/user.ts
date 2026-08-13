export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

/** `POST /auth/google` and `POST /auth/refresh`.
 *
 * Note there is no user object on this response — the caller follows up with
 * `GET /auth/me`, which is also the path used to restore a session on reload. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** The body of `POST /auth/google` is the Google ID token ("credential"),
 * not an authorisation code — which is exactly what @react-oauth/google's
 * GoogleLogin hands back on success. */
export interface GoogleAuthBody {
  credential: string;
}

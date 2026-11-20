export type User = {
  id: string;
  name: string;
  email: string;
};

export type NoteColor = "lilac" | "yellow" | "green" | "peach" | "blue" | "pink";

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: NoteColor;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type NoteInput = {
  id?: string;
  title: string;
  content: string;
  color: NoteColor;
  favorite: boolean;
  expiresAt: string | null;
};

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  register(input: RegisterInput): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
}

export interface NotesService {
  list(): Promise<Note[]>;
  save(input: NoteInput): Promise<Note>;
  remove(noteId: string): Promise<void>;
}

export const authSessionExpiredEvent = "my-keep:auth-session-expired";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5062"
).replace(/\/+$/, "");
const ACCESS_TOKEN_KEY = "my-keep:api:access-token";

type AuthResponse = {
  user: User;
  accessToken: string;
};

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (typeof value !== "object" || value === null || !("user" in value) || !("accessToken" in value)) {
    return false;
  }

  const { user, accessToken } = value;
  return (
    typeof accessToken === "string" &&
    accessToken.length > 0 &&
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "name" in user &&
    "email" in user &&
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string"
  );
}

async function getErrorMessage(response: Response): Promise<string> {
  const body = await response.text();
  if (body) {
    try {
      const problem: unknown = JSON.parse(body);
      if (typeof problem === "object" && problem !== null) {
        if ("detail" in problem && typeof problem.detail === "string") {
          return problem.detail;
        }
        if ("title" in problem && typeof problem.title === "string") {
          return problem.title;
        }
      }
    } catch {
      return body;
    }
  }
  return `Запит до сервера завершився помилкою (${response.status}).`;
}

async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Не вдалося з’єднатися з API (${API_BASE_URL}). Перевірте, що сервер запущений і CORS налаштований.`,
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, await getErrorMessage(response));
  }
  return response;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiRequest(path, init);
  return (await response.json()) as T;
}

async function authorizedRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const token = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    throw new ApiError(401, "Сеанс завершився. Увійдіть знову.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  try {
    return await apiRequest(path, { ...init, headers });
  } catch (reason) {
    if (reason instanceof ApiError && reason.status === 401) {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new Event(authSessionExpiredEvent));
    }
    throw reason;
  }
}

async function authenticate(path: string, body: RegisterInput | { email: string; password: string }): Promise<User> {
  const response = await requestJson<unknown>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!isAuthResponse(response)) {
    throw new Error("Сервер повернув некоректну відповідь під час входу.");
  }
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  return response.user;
}

class ApiAuthService implements AuthService {
  async getCurrentUser(): Promise<User | null> {
    if (!window.sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
      return null;
    }
    try {
      const response = await authorizedRequest("/api/auth/me");
      return (await response.json()) as User;
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        return null;
      }
      throw reason;
    }
  }

  async register(input: RegisterInput): Promise<User> {
    return authenticate("/api/auth/register", input);
  }

  async login(email: string, password: string): Promise<User> {
    return authenticate("/api/auth/login", { email, password });
  }

  async logout(): Promise<void> {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

class ApiNotesService implements NotesService {
  async list(): Promise<Note[]> {
    const response = await authorizedRequest("/api/notes");
    return (await response.json()) as Note[];
  }

  async save(input: NoteInput): Promise<Note> {
    const { id, ...note } = input;
    const response = await authorizedRequest(
      id ? `/api/notes/${encodeURIComponent(id)}` : "/api/notes",
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(note),
      },
    );
    return (await response.json()) as Note;
  }

  async remove(noteId: string): Promise<void> {
    await authorizedRequest(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: "DELETE",
    });
  }
}

export const authService: AuthService = new ApiAuthService();
export const notesService: NotesService = new ApiNotesService();

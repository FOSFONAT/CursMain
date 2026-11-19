export type User = {
  id: string;
  name: string;
  email: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type AuthResponse = {
  user: User;
  accessToken: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5062"
).replace(/\/+$/, "");
const ACCESS_TOKEN_KEY = "my-keep:api:access-token";

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
  if (
    typeof value !== "object" ||
    value === null ||
    !("user" in value) ||
    !("accessToken" in value)
  ) {
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

async function authenticate(
  path: string,
  body: RegisterInput | Pick<RegisterInput, "email" | "password">,
): Promise<User> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

  const result: unknown = await response.json();
  if (!isAuthResponse(result)) {
    throw new Error("Сервер повернув некоректну відповідь під час входу.");
  }

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
  return result.user;
}

export const authService = {
  register(input: RegisterInput): Promise<User> {
    return authenticate("/api/auth/register", input);
  },

  login(email: string, password: string): Promise<User> {
    return authenticate("/api/auth/login", { email, password });
  },
};

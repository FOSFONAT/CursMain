"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { authService, type User } from "@/app/lib/note-services";

type AuthMode = "login" | "register";

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <svg
          aria-hidden="true"
          fill="none"
          height="20"
          viewBox="0 0 24 24"
          width="20"
        >
          <path
            d="M7 3.75h7.5L19 8.25v10A2.75 2.75 0 0 1 16.25 21h-9.5A2.75 2.75 0 0 1 4 18.25v-11A3.5 3.5 0 0 1 7.5 3.75Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M14 4v5h5M8 13h8M8 16.5h6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </span>
      <span>my keep</span>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const user = isRegister
        ? await authService.register({ name, email, password })
        : await authService.login(email, password);
      setAuthenticatedUser(user);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не вдалося виконати запит. Спробуйте ще раз.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section
        aria-label={isRegister ? "Реєстрація в My Keep" : "Вхід до My Keep"}
        className="auth-card"
      >
        <div className="auth-art">
          <Brand />
          <div className="auth-art-copy">
            <h1>Думки заслуговують на своє місце.</h1>
            <p>
              Зберігайте ідеї, плани й маленькі нагадування в одному затишному
              просторі.
            </p>
          </div>
          <div aria-hidden="true" className="paper-stack">
            <span className="paper paper-one" />
            <span className="paper paper-two" />
            <span className="paper paper-three">
              <span className="paper-line" />
              <span className="paper-line" />
              <span className="paper-line" />
            </span>
          </div>
        </div>
        <div className="auth-form-panel">
          {authenticatedUser ? (
            <div className="auth-form auth-success" role="status">
              <h2>{isRegister ? "Акаунт створено!" : "Ви увійшли!"}</h2>
              <p className="auth-subtitle">
                Вітаємо, {authenticatedUser.name}. Автентифікація пройшла
                успішно.
              </p>
              <p className="auth-footnote">
                Ваші нотатки вже чекають на вас.
              </p>
              <Link className="primary-button auth-submit auth-link-button" href="/">
                До моїх нотаток
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              <h2>{isRegister ? "Створіть акаунт" : "З поверненням!"}</h2>
              <p className="auth-subtitle">
                {isRegister
                  ? "Почніть збирати свої думки в одному місці."
                  : "Увійдіть, щоб продовжити роботу з нотатками."}
              </p>
              <nav aria-label="Автентифікація" className="auth-tabs">
                <Link
                  aria-current={!isRegister ? "page" : undefined}
                  className={`auth-tab ${!isRegister ? "active" : ""}`}
                  href="/login"
                >
                  Увійти
                </Link>
                <Link
                  aria-current={isRegister ? "page" : undefined}
                  className={`auth-tab ${isRegister ? "active" : ""}`}
                  href="/register"
                >
                  Реєстрація
                </Link>
              </nav>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              {isRegister && (
                <div className="field">
                  <label htmlFor="name">Ваше ім’я</label>
                  <input
                    autoComplete="name"
                    id="name"
                    maxLength={60}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Наприклад, Олена"
                    required
                    value={name}
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor="email">Електронна пошта</label>
                <input
                  autoComplete="email"
                  id="email"
                  maxLength={320}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="field">
                <label htmlFor="password">Пароль</label>
                <input
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  id="password"
                  maxLength={128}
                  minLength={isRegister ? 8 : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isRegister ? "Щонайменше 8 символів" : "Введіть пароль"
                  }
                  required
                  type="password"
                  value={password}
                />
              </div>
              <button
                className="primary-button auth-submit"
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "Зачекайте…"
                  : isRegister
                    ? "Зареєструватися"
                    : "Увійти в акаунт"}
              </button>
              <p className="auth-footnote">
                Ваші нотатки синхронізуються через обліковий запис.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  authSessionExpiredEvent,
  authService,
  Note,
  NoteColor,
  notesService,
  User,
} from "@/app/lib/note-services";

type AuthMode = "login" | "register";
type Filter = "all" | "favorites";
type ExpiryMode = "never" | "after" | "at";
type ExpiryUnit = "minutes" | "hours" | "days";

const colors: NoteColor[] = ["lilac", "yellow", "green", "peach", "blue", "pink"];
const expiryUnitMilliseconds: Record<ExpiryUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};
const colorNames: Record<NoteColor, string> = {
  lilac: "лавандовий",
  yellow: "жовтий",
  green: "зелений",
  peach: "персиковий",
  blue: "блакитний",
  pink: "рожевий",
};

function noteCountLabel(count: number): string {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits < 11 || lastTwoDigits > 14) {
    if (lastDigit === 1) return "нотатка";
    if (lastDigit >= 2 && lastDigit <= 4) return "нотатки";
  }
  return "нотаток";
}

function Icon({
  name,
  size = 18,
}: {
  name: "note" | "grid" | "star" | "plus" | "search" | "logout" | "close" | "trash" | "clock";
  size?: number;
}) {
  const paths: Record<typeof name, React.ReactNode> = {
    note: (
      <>
        <path d="M7 3.75h7.5L19 8.25v10A2.75 2.75 0 0 1 16.25 21h-9.5A2.75 2.75 0 0 1 4 18.25v-11A3.5 3.5 0 0 1 7.5 3.75Z" />
        <path d="M14 4v5h5M8 13h8M8 16.5h6" />
      </>
    ),
    grid: (
      <>
        <rect x="3.75" y="3.75" width="7" height="7" rx="1.5" />
        <rect x="13.25" y="3.75" width="7" height="7" rx="1.5" />
        <rect x="3.75" y="13.25" width="7" height="7" rx="1.5" />
        <rect x="13.25" y="13.25" width="7" height="7" rx="1.5" />
      </>
    ),
    star: (
      <path d="m12 3.5 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 17.02l-5.3 2.79 1.01-5.9-4.29-4.18 5.93-.86L12 3.5Z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4 4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5.75A1.75 1.75 0 0 0 4 5.75v12.5A1.75 1.75 0 0 0 5.75 20H10" />
        <path d="M14 8l4 4-4 4M18 12H9" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    trash: (
      <>
        <path d="M4.5 7h15M10 10.5v6M14 10.5v6M6.5 7l.8 12h9.4l.8-12M9 7V4.5h6V7" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon name="note" size={20} />
      </span>
      <span>my keep</span>
    </div>
  );
}

function toLocalDateTimeValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AuthScreen({
  onAuthenticated,
  externalError,
}: {
  onAuthenticated: (user: User) => Promise<void>;
  externalError: string;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password.length < 8) {
      setError("Пароль має містити щонайменше 8 символів.");
      return;
    }

    setPending(true);
    try {
      const user =
        mode === "register"
          ? await authService.register({ name, email, password })
          : await authService.login(email, password);
      await onAuthenticated(user);
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

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="Вхід до My Keep">
        <div className="auth-art">
          <Brand />
          <div className="auth-art-copy">
            <h1>Думки заслуговують на своє місце.</h1>
            <p>Зберігайте ідеї, плани й маленькі нагадування в одному затишному просторі.</p>
          </div>
          <div className="paper-stack" aria-hidden="true">
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
          <form className="auth-form" onSubmit={submit}>
            <h2>{mode === "login" ? "З поверненням!" : "Створіть акаунт"}</h2>
            <p className="auth-subtitle">
              {mode === "login"
                ? "Увійдіть, щоб продовжити роботу з нотатками."
                : "Почніть збирати свої думки в одному місці."}
            </p>
            <div className="auth-tabs" role="tablist" aria-label="Тип входу">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => changeMode("login")}
              >
                Увійти
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => changeMode("register")}
              >
                Реєстрація
              </button>
            </div>
            {(error || externalError) && (
              <p className="error-message" role="alert">{error || externalError}</p>
            )}
            {mode === "register" && (
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
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                id="password"
                minLength={mode === "register" ? 8 : undefined}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Щонайменше 8 символів"
                required
                type="password"
                value={password}
              />
            </div>
            <button className="primary-button auth-submit" disabled={pending} type="submit">
              {pending
                ? "Зачекайте…"
                : mode === "login"
                  ? "Увійти в акаунт"
                  : "Зареєструватися"}
            </button>
            <p className="auth-footnote">
              Ваші нотатки синхронізуються через обліковий запис.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function NoteEditor({
  note,
  onClose,
  onSave,
  onRemove,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (input: {
    id?: string;
    title: string;
    content: string;
    color: NoteColor;
    favorite: boolean;
    expiresAt: string | null;
  }) => Promise<void>;
  onRemove: (noteId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [color, setColor] = useState<NoteColor>(note?.color ?? "lilac");
  const [favorite, setFavorite] = useState(note?.favorite ?? false);
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>(
    note?.expiresAt ? "at" : "never",
  );
  const [expiryDuration, setExpiryDuration] = useState("1");
  const [expiryUnit, setExpiryUnit] = useState<ExpiryUnit>("hours");
  const [expiryDateTime, setExpiryDateTime] = useState(
    note?.expiresAt ? toLocalDateTimeValue(note.expiresAt) : "",
  );
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [expiryError, setExpiryError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() && !content.trim()) return;

    let expiresAt: string | null = null;
    if (expiryMode === "after") {
      const duration = Number(expiryDuration);
      const expiryTime = Date.now() + duration * expiryUnitMilliseconds[expiryUnit];
      if (!Number.isSafeInteger(duration) || duration < 1 || Number.isNaN(new Date(expiryTime).getTime())) {
        setExpiryError("Вкажіть коректну тривалість таймера.");
        return;
      }
      expiresAt = new Date(expiryTime).toISOString();
    } else if (expiryMode === "at") {
      const expiryTime = new Date(expiryDateTime).getTime();
      if (!expiryDateTime || !Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
        setExpiryError("Вкажіть дату й час у майбутньому.");
        return;
      }
      expiresAt = new Date(expiryTime).toISOString();
    }

    setPending(true);
    setActionError("");
    setExpiryError("");
    try {
      await onSave({
        id: note?.id,
        title: title.trim() || "Нова нотатка",
        content,
        color,
        favorite,
        expiresAt,
      });
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Не вдалося зберегти нотатку.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!note) return;
    setPending(true);
    setActionError("");
    try {
      await onRemove(note.id);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Не вдалося видалити нотатку.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <section aria-label={note ? "Редагувати нотатку" : "Нова нотатка"} aria-modal="true" className="note-modal" role="dialog">
        <div className="modal-header">
          <span>{note ? "Редагування нотатки" : "Нова нотатка"}</span>
          <div className="modal-header-actions">
            <button
              aria-label={favorite ? "Прибрати з обраного" : "Додати до обраного"}
              aria-pressed={favorite}
              className={`icon-button favorite-toggle ${favorite ? "active" : ""}`}
              disabled={pending}
              onClick={() => setFavorite((current) => !current)}
              type="button"
            >
              <Icon name="star" />
            </button>
            <button aria-label="Закрити" className="icon-button" disabled={pending} onClick={onClose} type="button">
              <Icon name="close" />
            </button>
          </div>
        </div>
        <form onSubmit={save}>
          {actionError && (
            <p className="error-message editor-error" role="alert">{actionError}</p>
          )}
          <div className="note-editor">
            <input
              autoFocus
              aria-label="Заголовок"
              className="note-title-input"
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Заголовок"
              value={title}
            />
            <textarea
              aria-label="Текст нотатки"
              className="note-content-input"
              maxLength={10000}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Запишіть свою думку..."
              value={content}
            />
          </div>
          <div className="color-picker" aria-label="Колір нотатки">
            <span>Колір</span>
            {colors.map((item) => (
              <button
                key={item}
                aria-label={`Колір: ${colorNames[item]}`}
                aria-pressed={color === item}
                className={`color-swatch tone-${item} ${color === item ? "selected" : ""}`}
                onClick={() => setColor(item)}
                type="button"
              />
            ))}
          </div>
          <div className="expiry-section">
            <label htmlFor="expiry-mode">Автовидалення</label>
            <select
              id="expiry-mode"
              onChange={(event) => setExpiryMode(event.target.value as ExpiryMode)}
              value={expiryMode}
            >
              <option value="never">Не видаляти</option>
              <option value="after">Через проміжок часу</option>
              <option value="at">У дату й час</option>
            </select>
            {expiryMode === "after" && (
              <div className="expiry-input-row">
                <label htmlFor="expiry-duration">Через</label>
                <input
                  id="expiry-duration"
                  min="1"
                  onChange={(event) => setExpiryDuration(event.target.value)}
                  required
                  type="number"
                  value={expiryDuration}
                />
                <select
                  aria-label="Одиниця тривалості"
                  onChange={(event) => setExpiryUnit(event.target.value as ExpiryUnit)}
                  value={expiryUnit}
                >
                  <option value="minutes">хвилин</option>
                  <option value="hours">годин</option>
                  <option value="days">днів</option>
                </select>
              </div>
            )}
            {expiryMode === "at" && (
              <div className="expiry-input-row">
                <label htmlFor="expiry-date-time">Дата й час</label>
                <input
                  id="expiry-date-time"
                  min={toLocalDateTimeValue(new Date().toISOString())}
                  onChange={(event) => setExpiryDateTime(event.target.value)}
                  required
                  type="datetime-local"
                  value={expiryDateTime}
                />
              </div>
            )}
            {expiryError && (
              <p className="expiry-error" role="alert">{expiryError}</p>
            )}
            <p className="expiry-hint">
              Тимчасову нотатку буде видалено автоматично, навіть якщо браузер закритий.
            </p>
          </div>
          <div className="modal-footer">
            <div>
              {note && (
                <button className="delete-button" disabled={pending} onClick={remove} type="button">
                  <Icon name="trash" size={15} /> Видалити
                </button>
              )}
            </div>
            <div className="modal-footer-actions">
              <button className="secondary-button" disabled={pending} onClick={onClose} type="button">
                Скасувати
              </button>
              <button className="primary-button save-button" disabled={pending} type="submit">
                {pending ? "Збереження…" : "Зберегти"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export default function NotesApp() {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
      setNotes([]);
      setFilter("all");
      setQuery("");
      setEditingNote(null);
      setEditorOpen(false);
      setError("Сеанс завершився. Увійдіть знову.");
    }

    window.addEventListener(authSessionExpiredEvent, handleExpiredSession);
    return () => window.removeEventListener(authSessionExpiredEvent, handleExpiredSession);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!active) return;
        if (currentUser) {
          const currentNotes = await notesService.list();
          if (!active) return;
          setNotes(currentNotes);
          setUser(currentUser);
        }
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Не вдалося завантажити дані з сервера.",
          );
        }
      } finally {
        if (active) setReady(true);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  const visibleNotes = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return notes.filter((note) => {
      const matchesFilter = filter === "all" || note.favorite;
      const matchesSearch =
        !search ||
        note.title.toLocaleLowerCase().includes(search) ||
        note.content.toLocaleLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [filter, notes, query]);

  const hasTemporaryNotes = notes.some((note) => note.expiresAt !== null);
  useEffect(() => {
    if (!user || !hasTemporaryNotes) return;

    const interval = window.setInterval(() => {
      void notesService
        .list()
        .then(setNotes)
        .catch((reason: unknown) => {
          setError(
            reason instanceof Error
              ? reason.message
              : "Не вдалося оновити список нотаток.",
          );
        });
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [hasTemporaryNotes, user]);

  async function authenticated(nextUser: User) {
    const nextNotes = await notesService.list();
    setNotes(nextNotes);
    setUser(nextUser);
    setError("");
  }

  async function saveNote(input: {
    id?: string;
    title: string;
    content: string;
    color: NoteColor;
    favorite: boolean;
    expiresAt: string | null;
  }) {
    if (!user) throw new Error("Сеанс завершився. Увійдіть знову.");
    const saved = await notesService.save(input);
    setNotes((current) =>
      [saved, ...current.filter((note) => note.id !== saved.id)].sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
    setEditorOpen(false);
    setEditingNote(null);
    setError("");
  }

  async function removeNote(noteId: string) {
    if (!user) throw new Error("Сеанс завершився. Увійдіть знову.");
    await notesService.remove(noteId);
    setNotes((current) => current.filter((note) => note.id !== noteId));
    setEditorOpen(false);
    setEditingNote(null);
    setError("");
  }

  async function logout() {
    try {
      await authService.logout();
      setUser(null);
      setNotes([]);
      setFilter("all");
      setQuery("");
      setError("");
    } catch {
      setError("Не вдалося завершити сеанс.");
    }
  }

  if (!ready) {
    return <main className="loading-page">Завантаження…</main>;
  }

  if (!user) {
    return <AuthScreen externalError={error} onAuthenticated={authenticated} />;
  }

  const favoriteCount = notes.filter((note) => note.favorite).length;
  const pageTitle = filter === "all" ? "Мої нотатки" : "Обране";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Brand />
        <p className="sidebar-label">Бібліотека</p>
        <nav aria-label="Нотатки" className="nav-list">
          <button
            aria-current={filter === "all" ? "page" : undefined}
            className={`nav-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            type="button"
          >
            <Icon name="grid" size={17} /> Усі нотатки
            <span className="nav-count">{notes.length}</span>
          </button>
          <button
            aria-current={filter === "favorites" ? "page" : undefined}
            className={`nav-button ${filter === "favorites" ? "active" : ""}`}
            onClick={() => setFilter("favorites")}
            type="button"
          >
            <Icon name="star" size={17} /> Обране
            <span className="nav-count">{favoriteCount}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar" aria-hidden="true">
            {user.name.trim().charAt(0).toLocaleUpperCase()}
          </span>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button aria-label="Вийти з акаунту" className="icon-button" onClick={logout} type="button">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">
            Простір / <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Icon name="search" size={17} />
              <input
                aria-label="Пошук нотаток"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Знайти нотатку..."
                value={query}
              />
            </label>
            <button
              className="primary-button new-note-button"
              onClick={() => {
                setEditingNote(null);
                setEditorOpen(true);
              }}
              type="button"
            >
              <Icon name="plus" size={17} /> Нова нотатка
            </button>
          </div>
        </header>

        <div className="welcome-row">
          <div>
            <h1>{pageTitle}</h1>
            <p>Усе важливе — під рукою.</p>
          </div>
          <span className="notes-meta">
            {visibleNotes.length} {noteCountLabel(visibleNotes.length)}
          </span>
        </div>

        {error && <p className="error-message" role="alert">{error}</p>}
        {visibleNotes.length ? (
          <div className="notes-grid">
            {visibleNotes.map((note) => (
              <article
                key={note.id}
                aria-label={`Відкрити нотатку ${note.title}`}
                className={`note-card tone-${note.color}`}
                onClick={() => {
                  setEditingNote(note);
                  setEditorOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setEditingNote(note);
                    setEditorOpen(true);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="note-card-top">
                  <h2>{note.title}</h2>
                  {note.favorite && <span className="note-pin" aria-label="В обраному"><Icon name="star" size={16} /></span>}
                </div>
                <p>{note.content || "Нотатка без тексту."}</p>
                <div className="note-card-footer">
                  <span>{formatDate(note.updatedAt)}</span>
                  {note.expiresAt ? (
                    <span className="note-expiry" title="Буде видалено автоматично">
                      <Icon name="clock" size={12} />
                      {formatDateTime(note.expiresAt)}
                    </span>
                  ) : (
                    <span>{note.content.length} символів</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div>
              <span className="empty-icon"><Icon name={query ? "search" : "note"} size={24} /></span>
              <h2>{query ? "Нічого не знайдено" : filter === "favorites" ? "Тут буде ваше обране" : "Почніть із першої нотатки"}</h2>
              <p>
                {query
                  ? "Спробуйте інший запит або перевірте написання."
                  : filter === "favorites"
                    ? "Позначайте важливі нотатки зірочкою, щоб швидко знаходити їх тут."
                    : "Запишіть ідею, список справ або будь-що, що не хочете забути."}
              </p>
              {!query && filter === "all" && (
                <button
                  className="primary-button"
                  onClick={() => setEditorOpen(true)}
                  type="button"
                >
                  <Icon name="plus" size={17} /> Створити нотатку
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {editorOpen && (
        <NoteEditor
          key={editingNote?.id ?? "new"}
          note={editingNote}
          onClose={() => {
            setEditorOpen(false);
            setEditingNote(null);
          }}
          onRemove={removeNote}
          onSave={saveNote}
        />
      )}
    </main>
  );
}

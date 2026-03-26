export type UserItem = {
  id: number;
  email: string;
  password: string;
  nickname: string;
  role: "user" | "admin";
};

const USERS_KEY = "hanja-users";
const CURRENT_USER_KEY = "hanja-current-user";

/*
  여기 계정이 관리자 계정이야.
  나중에 네가 원하는 걸로 바꿔도 됨.
*/
const ADMIN_EMAIL = "admin@hanja.com";
const ADMIN_PASSWORD = "1234";
const ADMIN_NICKNAME = "관리자";

function getDefaultUsers(): UserItem[] {
  return [
    {
      id: 1,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      nickname: ADMIN_NICKNAME,
      role: "admin",
    },
  ];
}

export function getUsers(): UserItem[] {
  if (typeof window === "undefined") return getDefaultUsers();

  const saved = window.localStorage.getItem(USERS_KEY);

  if (!saved) {
    const defaults = getDefaultUsers();
    window.localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(saved) as UserItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = getDefaultUsers();
      window.localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return parsed;
  } catch {
    const defaults = getDefaultUsers();
    window.localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveUsers(users: UserItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): UserItem | null {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as UserItem;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserItem | null) {
  if (typeof window === "undefined") return;

  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }

  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function signupUser(input: {
  email: string;
  password: string;
  nickname: string;
}) {
  const users = getUsers();

  const exists = users.find((user) => user.email === input.email.trim());
  if (exists) {
    return { ok: false, message: "이미 존재하는 이메일이야." };
  }

  const newUser: UserItem = {
    id: Date.now(),
    email: input.email.trim(),
    password: input.password.trim(),
    nickname: input.nickname.trim(),
    role: "user",
  };

  const updated = [...users, newUser];
  saveUsers(updated);
  setCurrentUser(newUser);

  return { ok: true, user: newUser };
}

export function loginUser(input: { email: string; password: string }) {
  const users = getUsers();

  const found = users.find(
    (user) =>
      user.email === input.email.trim() &&
      user.password === input.password.trim()
  );

  if (!found) {
    return { ok: false, message: "이메일 또는 비밀번호가 틀렸어." };
  }

  setCurrentUser(found);
  return { ok: true, user: found };
}

export function logoutUser() {
  setCurrentUser(null);
}

export function isAdminUser(user: UserItem | null) {
  return user?.role === "admin";
}
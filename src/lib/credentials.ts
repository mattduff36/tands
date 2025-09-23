const usernameToEnv = (u: string) => {
  const key = u.trim().toUpperCase();
  return `PASSWORD_${key}`;
};

export function verify(username: string, password: string) {
  const envKey = usernameToEnv(username);
  const storedPassword = process.env[envKey];
  if (!storedPassword) return false;
  return password === storedPassword;
}

export function allowedUser(username: string) {
  const list = (process.env.ACCOUNTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(username.trim().toLowerCase());
}

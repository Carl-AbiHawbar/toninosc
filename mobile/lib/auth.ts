export function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/\s+/g, '-');
}

export function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@toninocrepes.com`;
}

export const AUTHORIZED_MEMBERS = ["Ismael", "Aidan"] as const;

export function isAuthorizedUser(username?: string | null): boolean {
  if (!username) return false;
  return AUTHORIZED_MEMBERS.some(
    (member) => member.toLowerCase() === username.trim().toLowerCase(),
  );
}

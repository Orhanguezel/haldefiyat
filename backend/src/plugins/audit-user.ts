type AuditRequestIdentity = {
  user?: unknown;
  auth?: { user?: unknown };
  requestContext?: { get?: (key: string) => unknown };
};

type UserRecord = Record<string, unknown>;

function userRecord(value: unknown): UserRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UserRecord)
    : null;
}

export function normalizeAuditUser(req: AuditRequestIdentity): { userId: string | null; isAdmin: number } {
  const candidate = req.user ?? req.auth?.user ?? req.requestContext?.get?.("user") ?? null;
  const user = userRecord(candidate);
  if (!user) return { userId: null, isAdmin: 0 };

  const roles = Array.isArray(user.roles) ? user.roles.map(String) : [];
  const role = String(user.role ?? "");
  const isAdmin =
    user.is_admin === true ||
    user.is_admin === 1 ||
    user.is_admin === "1" ||
    role === "admin" ||
    roles.includes("admin")
      ? 1
      : 0;

  return {
    // Access tokenlari standart JWT `sub` alaniyla uretiliyor. Eski audit
    // okuyucusu yalniz `id` aradigi icin authenticated mutasyonlar anonim
    // gorunebiliyordu. Geriye uyumluluk icin `id` fallback'i korunur.
    userId: user.sub ? String(user.sub) : user.id ? String(user.id) : null,
    isAdmin,
  };
}

const AUTH_FIELD_MAP: Record<string, string> = {
  email: 'auth-email',
  password: 'auth-password',
  name: 'auth-display-name',
  code: 'auth-reset-code',
  newPassword: 'auth-new-password',
};

export const resolveErrorField = (issuePath: PropertyKey | undefined) => {
  return AUTH_FIELD_MAP[String(issuePath)] ?? null;
};

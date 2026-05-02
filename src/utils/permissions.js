export const hasPermission = (user, permission) =>
  Boolean(user?.permissions?.includes(permission));

export const hasAnyPermission = (user, permissions = []) =>
  permissions.some((permission) => hasPermission(user, permission));

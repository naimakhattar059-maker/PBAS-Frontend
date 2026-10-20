export const hasPermission = (user, permission) =>
  Boolean(user?.permissions?.includes(permission));

export const hasAnyPermission = (user, permissions = []) =>
  permissions.some((permission) => hasPermission(user, permission));

export const canAccessEstimates = (user) =>
  user?.role !== 'admin_officer' &&
  hasAnyPermission(user, ['view_payroll_estimates', 'manage_payroll_estimates', 'approve_payroll_estimates']);

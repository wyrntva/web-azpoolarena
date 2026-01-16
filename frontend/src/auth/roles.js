export const ROLES = {
  ADMIN: 'Quản lý',
  ACCOUNTANT: 'Thu ngân',
  STAFF: 'Nhân viên',
};

export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  // If user is 'Quản lý', they bypass role checks in most cases
  if (user.role.name === 'Quản lý' || user.role.name === 'admin') return true;
  return allowedRoles.includes(user.role.name);
};

export const isAdmin = (user) => {
  if (!user || !user.role) return false;
  return user.role.name === ROLES.ADMIN || user.role.name === 'admin' || user.role.name === 'Quản lý';
};

export const isAccountantOrAdmin = (user) => {
  if (!user) return false;
  return hasRole(user, [ROLES.ADMIN, ROLES.ACCOUNTANT, 'admin', 'Quản lý']);
};

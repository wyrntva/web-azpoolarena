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
  if (!user) return false;
  // Use explicit field from API if available
  if (user.is_admin === true) return true;
  // Check by ID (safest fallback)
  const roleId = Number(user.role_id || (user.role && user.role.id));
  if (roleId === 4) return true;
  // Fallback to role name with normalization
  if (!user.role) return false;
  const name = (user.role.name || '').toLowerCase().trim().normalize('NFC');
  return name === 'quản lý' || name === 'admin';
};

export const isAccountantOrAdmin = (user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const roleId = Number(user.role_id || (user.role && user.role.id));
  if (roleId === 5) return true;
  if (!user.role) return false;
  const name = (user.role.name || '').toLowerCase().trim().normalize('NFC');
  return name === 'thu ngân' || name === 'accountant';
};

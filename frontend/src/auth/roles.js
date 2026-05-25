export const ROLES = {
  ADMIN: 'Quản trị',
  SHIFT_LEADER: 'Trưởng ca',
  STAFF: 'Nhân viên',
};

export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  // If user is 'Quản trị', they bypass role checks in most cases
  if (user.role.name === 'Quản trị' || user.role.name === 'admin') return true;
  return allowedRoles.includes(user.role.name);
};

export const isAdmin = (user) => {
  if (!user) return false;
  // Use explicit field from API if available
  if (user.is_admin === true) return true;
  // Check by ID (safest fallback)
  const roleId = Number(user.role_id || (user.role && user.role.id));
  if (roleId === 1) return true;
  // Fallback to role name with normalization
  if (!user.role) return false;
  const name = (user.role.name || '').toLowerCase().trim().normalize('NFC');
  return name === 'quản trị' || name === 'admin';
};

export const isShiftLeaderOrAdmin = (user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const roleId = Number(user.role_id || (user.role && user.role.id));
  if (roleId === 2) return true; // role ID 2 is Trưởng ca
  if (!user.role) return false;
  const name = (user.role.name || '').toLowerCase().trim().normalize('NFC');
  return name === 'trưởng ca' || name === 'shift leader';
};

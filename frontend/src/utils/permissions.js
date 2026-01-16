// Utility functions để kiểm tra quyền của user

/**
 * Kiểm tra user có quyền cụ thể không
 * Admin tự động có tất cả quyền
 */
const internalIsAdmin = (user) => {
  if (!user) return false;
  if (user.is_admin === true) return true;
  const roleId = Number(user.role_id || (user.role && user.role.id));
  if (roleId === 4) return true;
  const name = (user.role?.name || '').toLowerCase().trim().normalize('NFC');
  return name === 'quản lý' || name === 'admin';
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  // Admin hoặc Quản lý có tất cả quyền
  if (internalIsAdmin(user)) return true;
  if (!user.role) return false;

  // Kiểm tra permission trong role.permissions
  let permissions = [];
  try {
    permissions = typeof user.role.permissions === 'string'
      ? JSON.parse(user.role.permissions)
      : (user.role.permissions || []);
  } catch (e) {
    permissions = user.role.permissions || [];
  }

  return Array.isArray(permissions) && permissions.includes(permission);
};

/**
 * Kiểm tra user có ít nhất 1 trong các quyền được chỉ định
 */
export const hasAnyPermission = (user, permissionArray) => {
  if (!user) return false;
  // Admin hoặc Quản lý có tất cả quyền
  if (internalIsAdmin(user)) return true;
  if (!user.role) return false;

  const permissions = getUserPermissions(user);
  return permissionArray.some(permission => permissions.includes(permission));
};

export const hasAllPermissions = (user, permissionArray) => {
  if (!user) return false;
  // Admin hoặc Quản lý có tất cả quyền
  if (internalIsAdmin(user)) return true;
  if (!user.role) return false;

  const permissions = getUserPermissions(user);
  return permissionArray.every(permission => permissions.includes(permission));
};

/**
 * Kiểm tra user có quyền xem trang không
 */
export const canViewPage = (user, pagePermission) => {
  return hasPermission(user, pagePermission);
};

/**
 * Kiểm tra user có quyền tạo mới không
 */
export const canCreate = (user, createPermission) => {
  return hasPermission(user, createPermission);
};

/**
 * Kiểm tra user có quyền chỉnh sửa không
 */
export const canEdit = (user, editPermission) => {
  return hasPermission(user, editPermission);
};

/**
 * Kiểm tra user có quyền xóa không
 */
export const canDelete = (user, deletePermission) => {
  return hasPermission(user, deletePermission);
};

export const isAdmin = (user) => {
  return user?.role?.name === 'admin' || user?.role?.name === 'Quản lý';
};

/**
 * Lấy danh sách permissions của user
 */
export const getUserPermissions = (user) => {
  if (!user || !user.role) return [];
  try {
    const perms = typeof user.role.permissions === 'string'
      ? JSON.parse(user.role.permissions)
      : (user.role.permissions || []);
    return Array.isArray(perms) ? perms : [];
  } catch (e) {
    return Array.isArray(user.role.permissions) ? user.role.permissions : [];
  }
};

// Utility functions để kiểm tra quyền của user

/**
 * Kiểm tra user có quyền cụ thể không
 * Admin tự động có tất cả quyền
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  // Admin hoặc Quản lý có tất cả quyền
  if (user.role && (user.role.name === 'admin' || user.role.name === 'Quản lý')) return true;
  if (!user.role) return false;

  // Kiểm tra permission trong role.permissions
  const permissions = user.role.permissions || [];
  return permissions.includes(permission);
};

/**
 * Kiểm tra user có ít nhất 1 trong các quyền được chỉ định
 */
export const hasAnyPermission = (user, permissionArray) => {
  if (!user) return false;
  // Admin hoặc Quản lý có tất cả quyền
  if (user.role && (user.role.name === 'admin' || user.role.name === 'Quản lý')) return true;
  if (!user.role) return false;

  // Kiểm tra có ít nhất 1 permission match
  const permissions = user.role.permissions || [];
  return permissionArray.some(permission => permissions.includes(permission));
};

/**
 * Kiểm tra user có tất cả các quyền được chỉ định
 */
export const hasAllPermissions = (user, permissionArray) => {
  if (!user) return false;
  // Admin hoặc Quản lý có tất cả quyền
  if (user.role && (user.role.name === 'admin' || user.role.name === 'Quản lý')) return true;
  if (!user.role) return false;

  // Kiểm tra có tất cả permissions
  const permissions = user.role.permissions || [];
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
  return user.role.permissions || [];
};

// Định nghĩa tất cả permissions trong hệ thống
// Cấu trúc: Mỗi module có quyền view_page và các quyền CRUD

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD: {
    VIEW: 'view_dashboard',
  },

  // Quản lý nhân viên
  STAFF: {
    VIEW_PAGE: 'view_staff_page',
    CREATE: 'create_staff',
    EDIT: 'edit_staff',
    DELETE: 'delete_staff',
  },

  // Vai trò & phân quyền
  ROLES: {
    VIEW_PAGE: 'view_roles_page',
    CREATE: 'create_role',
    EDIT: 'edit_role',
    DELETE: 'delete_role',
  },

  // Lịch làm việc
  WORK_SCHEDULE: {
    VIEW_PAGE: 'view_work_schedule_page',
    CREATE: 'create_schedule',
    EDIT: 'edit_schedule',
    DELETE: 'delete_schedule',
  },

  // Chấm công
  ATTENDANCE: {
    VIEW_PAGE: 'view_attendance_page',
    CREATE: 'create_attendance',
    EDIT: 'edit_attendance',
    DELETE: 'delete_attendance',
    APPROVE: 'approve_attendance_requests',
  },

  // Tài chính - Phiếu thu/chi
  RECEIPTS: {
    VIEW_PAGE: 'view_receipts_page',
    CREATE: 'create_receipt',
    EDIT: 'edit_receipt',
    DELETE: 'delete_receipt',
  },

  // Loại phiếu thu/chi
  RECEIPT_TYPES: {
    VIEW_PAGE: 'view_receipt_types_page',
    CREATE: 'create_receipt_type',
    EDIT: 'edit_receipt_type',
    DELETE: 'delete_receipt_type',
  },

  // Loại giao dịch
  FINANCE_TYPES: {
    VIEW_PAGE: 'view_finance_types_page',
    CREATE: 'create_finance_type',
    EDIT: 'edit_finance_type',
    DELETE: 'delete_finance_type',
  },

  // Doanh thu
  REVENUES: {
    VIEW_PAGE: 'view_revenues_page',
    CREATE: 'create_revenue',
    EDIT: 'edit_revenue',
    DELETE: 'delete_revenue',
  },

  // Ngoại hối
  EXCHANGES: {
    VIEW_PAGE: 'view_exchanges_page',
    CREATE: 'create_exchange',
    EDIT: 'edit_exchange',
    DELETE: 'delete_exchange',
  },

  // Giao dịch tài chính
  FINANCE_TRADE: {
    VIEW_PAGE: 'view_finance_trade_page',
    CREATE: 'create_finance_trade',
    EDIT: 'edit_finance_trade',
    DELETE: 'delete_finance_trade',
  },

  // Két sắt
  SAFE: {
    VIEW_PAGE: 'view_safe_page',
    CREATE: 'create_safe',
    EDIT: 'edit_safe',
    DELETE: 'delete_safe',
  },

  // Công nợ
  DEBT: {
    VIEW_PAGE: 'view_debt_page',
    CREATE: 'create_debt',
    EDIT: 'edit_debt',
    DELETE: 'delete_debt',
  },

  // Kho hàng
  INVENTORY: {
    VIEW_PAGE: 'view_inventory_page',
    CREATE: 'create_inventory',
    EDIT: 'edit_inventory',
    DELETE: 'delete_inventory',
    CHECK: 'inventory_check',
  },

  // Báo cáo
  REPORTS: {
    VIEW_PAGE: 'view_reports_page',
    EXPORT: 'export_reports',
  },

  // Cài đặt
  SETTINGS: {
    VIEW_PAGE: 'view_settings_page',
    EDIT: 'edit_settings',
  },
};

// Danh sách tất cả permissions (dùng để hiển thị trong UI)
export const PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permissions: [
      { key: PERMISSIONS.DASHBOARD.VIEW, label: 'Xem trang Dashboard' },
    ],
  },
  {
    key: 'staff',
    label: 'Quản lý Nhân viên',
    permissions: [
      { key: PERMISSIONS.STAFF.VIEW_PAGE, label: 'Xem trang Nhân viên', isParent: true },
      { key: PERMISSIONS.STAFF.CREATE, label: 'Thêm nhân viên', parent: PERMISSIONS.STAFF.VIEW_PAGE },
      { key: PERMISSIONS.STAFF.EDIT, label: 'Sửa nhân viên', parent: PERMISSIONS.STAFF.VIEW_PAGE },
      { key: PERMISSIONS.STAFF.DELETE, label: 'Xóa nhân viên', parent: PERMISSIONS.STAFF.VIEW_PAGE },
    ],
  },
  {
    key: 'roles',
    label: 'Vai trò & Phân quyền',
    permissions: [
      { key: PERMISSIONS.ROLES.VIEW_PAGE, label: 'Xem trang Vai trò', isParent: true },
      { key: PERMISSIONS.ROLES.CREATE, label: 'Tạo vai trò', parent: PERMISSIONS.ROLES.VIEW_PAGE },
      { key: PERMISSIONS.ROLES.EDIT, label: 'Sửa vai trò', parent: PERMISSIONS.ROLES.VIEW_PAGE },
      { key: PERMISSIONS.ROLES.DELETE, label: 'Xóa vai trò', parent: PERMISSIONS.ROLES.VIEW_PAGE },
    ],
  },
  {
    key: 'work_schedule',
    label: 'Lịch làm việc',
    permissions: [
      { key: PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE, label: 'Xem trang Lịch làm việc', isParent: true },
      { key: PERMISSIONS.WORK_SCHEDULE.CREATE, label: 'Tạo lịch làm việc', parent: PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE },
      { key: PERMISSIONS.WORK_SCHEDULE.EDIT, label: 'Sửa lịch làm việc', parent: PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE },
      { key: PERMISSIONS.WORK_SCHEDULE.DELETE, label: 'Xóa lịch làm việc', parent: PERMISSIONS.WORK_SCHEDULE.VIEW_PAGE },
    ],
  },
  {
    key: 'attendance',
    label: 'Chấm công',
    permissions: [
      { key: PERMISSIONS.ATTENDANCE.VIEW_PAGE, label: 'Xem trang Chấm công', isParent: true },
      { key: PERMISSIONS.ATTENDANCE.CREATE, label: 'Tạo bản ghi chấm công', parent: PERMISSIONS.ATTENDANCE.VIEW_PAGE },
      { key: PERMISSIONS.ATTENDANCE.EDIT, label: 'Sửa bản ghi chấm công', parent: PERMISSIONS.ATTENDANCE.VIEW_PAGE },
      { key: PERMISSIONS.ATTENDANCE.DELETE, label: 'Xóa bản ghi chấm công', parent: PERMISSIONS.ATTENDANCE.VIEW_PAGE },
      { key: PERMISSIONS.ATTENDANCE.APPROVE, label: 'Duyệt yêu cầu chấm công', parent: PERMISSIONS.ATTENDANCE.VIEW_PAGE },
    ],
  },
  {
    key: 'receipts',
    label: 'Phiếu Thu/Chi',
    permissions: [
      { key: PERMISSIONS.RECEIPTS.VIEW_PAGE, label: 'Xem trang Phiếu thu/chi', isParent: true },
      { key: PERMISSIONS.RECEIPTS.CREATE, label: 'Tạo phiếu thu/chi', parent: PERMISSIONS.RECEIPTS.VIEW_PAGE },
      { key: PERMISSIONS.RECEIPTS.EDIT, label: 'Sửa phiếu thu/chi', parent: PERMISSIONS.RECEIPTS.VIEW_PAGE },
      { key: PERMISSIONS.RECEIPTS.DELETE, label: 'Xóa phiếu thu/chi', parent: PERMISSIONS.RECEIPTS.VIEW_PAGE },
    ],
  },
  {
    key: 'receipt_types',
    label: 'Loại Phiếu Thu/Chi',
    permissions: [
      { key: PERMISSIONS.RECEIPT_TYPES.VIEW_PAGE, label: 'Xem trang Loại phiếu thu/chi', isParent: true },
      { key: PERMISSIONS.RECEIPT_TYPES.CREATE, label: 'Tạo loại phiếu', parent: PERMISSIONS.RECEIPT_TYPES.VIEW_PAGE },
      { key: PERMISSIONS.RECEIPT_TYPES.EDIT, label: 'Sửa loại phiếu', parent: PERMISSIONS.RECEIPT_TYPES.VIEW_PAGE },
      { key: PERMISSIONS.RECEIPT_TYPES.DELETE, label: 'Xóa loại phiếu', parent: PERMISSIONS.RECEIPT_TYPES.VIEW_PAGE },
    ],
  },
  {
    key: 'finance_types',
    label: 'Loại Giao dịch',
    permissions: [
      { key: PERMISSIONS.FINANCE_TYPES.VIEW_PAGE, label: 'Xem trang Loại giao dịch', isParent: true },
      { key: PERMISSIONS.FINANCE_TYPES.CREATE, label: 'Tạo loại giao dịch', parent: PERMISSIONS.FINANCE_TYPES.VIEW_PAGE },
      { key: PERMISSIONS.FINANCE_TYPES.EDIT, label: 'Sửa loại giao dịch', parent: PERMISSIONS.FINANCE_TYPES.VIEW_PAGE },
      { key: PERMISSIONS.FINANCE_TYPES.DELETE, label: 'Xóa loại giao dịch', parent: PERMISSIONS.FINANCE_TYPES.VIEW_PAGE },
    ],
  },
  {
    key: 'revenues',
    label: 'Doanh thu',
    permissions: [
      { key: PERMISSIONS.REVENUES.VIEW_PAGE, label: 'Xem trang Doanh thu', isParent: true },
      { key: PERMISSIONS.REVENUES.CREATE, label: 'Tạo doanh thu', parent: PERMISSIONS.REVENUES.VIEW_PAGE },
      { key: PERMISSIONS.REVENUES.EDIT, label: 'Sửa doanh thu', parent: PERMISSIONS.REVENUES.VIEW_PAGE },
      { key: PERMISSIONS.REVENUES.DELETE, label: 'Xóa doanh thu', parent: PERMISSIONS.REVENUES.VIEW_PAGE },
    ],
  },
  {
    key: 'exchanges',
    label: 'Ngoại hối',
    permissions: [
      { key: PERMISSIONS.EXCHANGES.VIEW_PAGE, label: 'Xem trang Ngoại hối', isParent: true },
      { key: PERMISSIONS.EXCHANGES.CREATE, label: 'Tạo giao dịch ngoại hối', parent: PERMISSIONS.EXCHANGES.VIEW_PAGE },
      { key: PERMISSIONS.EXCHANGES.EDIT, label: 'Sửa giao dịch ngoại hối', parent: PERMISSIONS.EXCHANGES.VIEW_PAGE },
      { key: PERMISSIONS.EXCHANGES.DELETE, label: 'Xóa giao dịch ngoại hối', parent: PERMISSIONS.EXCHANGES.VIEW_PAGE },
    ],
  },
  {
    key: 'finance_trade',
    label: 'Giao dịch Tài chính',
    permissions: [
      { key: PERMISSIONS.FINANCE_TRADE.VIEW_PAGE, label: 'Xem trang Giao dịch tài chính', isParent: true },
      { key: PERMISSIONS.FINANCE_TRADE.CREATE, label: 'Tạo giao dịch', parent: PERMISSIONS.FINANCE_TRADE.VIEW_PAGE },
      { key: PERMISSIONS.FINANCE_TRADE.EDIT, label: 'Sửa giao dịch', parent: PERMISSIONS.FINANCE_TRADE.VIEW_PAGE },
      { key: PERMISSIONS.FINANCE_TRADE.DELETE, label: 'Xóa giao dịch', parent: PERMISSIONS.FINANCE_TRADE.VIEW_PAGE },
    ],
  },
  {
    key: 'safe',
    label: 'Két sắt',
    permissions: [
      { key: PERMISSIONS.SAFE.VIEW_PAGE, label: 'Xem trang Két sắt', isParent: true },
      { key: PERMISSIONS.SAFE.CREATE, label: 'Tạo két sắt', parent: PERMISSIONS.SAFE.VIEW_PAGE },
      { key: PERMISSIONS.SAFE.EDIT, label: 'Sửa két sắt', parent: PERMISSIONS.SAFE.VIEW_PAGE },
      { key: PERMISSIONS.SAFE.DELETE, label: 'Xóa két sắt', parent: PERMISSIONS.SAFE.VIEW_PAGE },
    ],
  },
  {
    key: 'debt',
    label: 'Công nợ',
    permissions: [
      { key: PERMISSIONS.DEBT.VIEW_PAGE, label: 'Xem trang Công nợ', isParent: true },
      { key: PERMISSIONS.DEBT.CREATE, label: 'Tạo công nợ', parent: PERMISSIONS.DEBT.VIEW_PAGE },
      { key: PERMISSIONS.DEBT.EDIT, label: 'Sửa công nợ', parent: PERMISSIONS.DEBT.VIEW_PAGE },
      { key: PERMISSIONS.DEBT.DELETE, label: 'Xóa công nợ', parent: PERMISSIONS.DEBT.VIEW_PAGE },
    ],
  },
  {
    key: 'inventory',
    label: 'Kho hàng',
    permissions: [
      { key: PERMISSIONS.INVENTORY.VIEW_PAGE, label: 'Xem trang Kho hàng', isParent: true },
      { key: PERMISSIONS.INVENTORY.CREATE, label: 'Nhập/Xuất kho', parent: PERMISSIONS.INVENTORY.VIEW_PAGE },
      { key: PERMISSIONS.INVENTORY.EDIT, label: 'Sửa phiếu kho', parent: PERMISSIONS.INVENTORY.VIEW_PAGE },
      { key: PERMISSIONS.INVENTORY.DELETE, label: 'Xóa phiếu kho', parent: PERMISSIONS.INVENTORY.VIEW_PAGE },
      { key: PERMISSIONS.INVENTORY.CHECK, label: 'Kiểm kê kho', parent: PERMISSIONS.INVENTORY.VIEW_PAGE },
    ],
  },
  {
    key: 'reports',
    label: 'Báo cáo',
    permissions: [
      { key: PERMISSIONS.REPORTS.VIEW_PAGE, label: 'Xem trang Báo cáo', isParent: true },
      { key: PERMISSIONS.REPORTS.EXPORT, label: 'Xuất báo cáo', parent: PERMISSIONS.REPORTS.VIEW_PAGE },
    ],
  },
  {
    key: 'settings',
    label: 'Cài đặt',
    permissions: [
      { key: PERMISSIONS.SETTINGS.VIEW_PAGE, label: 'Xem trang Cài đặt', isParent: true },
      { key: PERMISSIONS.SETTINGS.EDIT, label: 'Sửa cài đặt', parent: PERMISSIONS.SETTINGS.VIEW_PAGE },
    ],
  },
];

// Lấy tất cả permission strings (dùng cho admin role)
export const getAllPermissions = () => {
  return PERMISSION_GROUPS.flatMap(group =>
    group.permissions.map(p => p.key)
  );
};

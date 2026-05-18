/** Permission constants — mirrors app/core/permissions.py */

export const ALL_PERMISSIONS = [
  // Dashboard
  'view_dashboard',
  // Staff
  'view_staff_page',
  'create_staff',
  'edit_staff',
  'delete_staff',
  // Roles
  'view_roles_page',
  'create_role',
  'edit_role',
  'delete_role',
  // Work Schedule
  'view_work_schedule_page',
  'create_schedule',
  'edit_schedule',
  'delete_schedule',
  // Attendance
  'view_attendance_page',
  'create_attendance',
  'edit_attendance',
  'delete_attendance',
  'approve_attendance_requests',
  // Receipts
  'view_receipts_page',
  'create_receipt',
  'edit_receipt',
  'delete_receipt',
  // Receipt Types
  'view_receipt_types_page',
  'create_receipt_type',
  'edit_receipt_type',
  'delete_receipt_type',
  // Finance Types
  'view_finance_types_page',
  'create_finance_type',
  'edit_finance_type',
  'delete_finance_type',
  // Revenue
  'view_revenues_page',
  'create_revenue',
  'edit_revenue',
  'delete_revenue',
  // Exchange
  'view_exchanges_page',
  'create_exchange',
  'edit_exchange',
  'delete_exchange',
  // Finance Trade
  'view_finance_trade_page',
  'create_finance_trade',
  'edit_finance_trade',
  'delete_finance_trade',
  // Safe
  'view_safe_page',
  'create_safe',
  'edit_safe',
  'delete_safe',
  // Debt
  'view_debt_page',
  'create_debt',
  'edit_debt',
  'delete_debt',
  // Inventory
  'view_inventory_page',
  'create_inventory',
  'edit_inventory',
  'delete_inventory',
  'inventory_check',
  // Reports
  'view_reports_page',
  'export_reports',
  // Settings
  'view_settings_page',
  'edit_settings',
];

export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  'Quản trị': ALL_PERMISSIONS,
  'Trưởng ca': [
    'view_dashboard',
    'view_work_schedule_page',
    'create_schedule',
    'edit_schedule',
    'delete_schedule',
    'view_attendance_page',
    'create_attendance',
    'edit_attendance',
    'delete_attendance',
    'approve_attendance_requests',
  ],
  'Nhân viên': [
    'view_dashboard',
    'view_work_schedule_page',
    'view_attendance_page',
  ],
};

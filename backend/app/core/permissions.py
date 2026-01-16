"""
Định nghĩa tất cả permissions trong hệ thống
"""

# Danh sách tất cả permissions
ALL_PERMISSIONS = [
    # Dashboard
    "view_dashboard",

    # Quản lý nhân viên
    "view_staff_page",
    "create_staff",
    "edit_staff",
    "delete_staff",

    # Vai trò & phân quyền
    "view_roles_page",
    "create_role",
    "edit_role",
    "delete_role",

    # Lịch làm việc
    "view_work_schedule_page",
    "create_schedule",
    "edit_schedule",
    "delete_schedule",

    # Chấm công
    "view_attendance_page",
    "create_attendance",
    "edit_attendance",
    "delete_attendance",
    "approve_attendance_requests",

    # Tài chính - Phiếu thu/chi
    "view_receipts_page",
    "create_receipt",
    "edit_receipt",
    "delete_receipt",

    # Loại phiếu thu/chi
    "view_receipt_types_page",
    "create_receipt_type",
    "edit_receipt_type",
    "delete_receipt_type",

    # Loại giao dịch
    "view_finance_types_page",
    "create_finance_type",
    "edit_finance_type",
    "delete_finance_type",

    # Doanh thu
    "view_revenues_page",
    "create_revenue",
    "edit_revenue",
    "delete_revenue",

    # Ngoại hối
    "view_exchanges_page",
    "create_exchange",
    "edit_exchange",
    "delete_exchange",

    # Giao dịch tài chính
    "view_finance_trade_page",
    "create_finance_trade",
    "edit_finance_trade",
    "delete_finance_trade",

    # Két sắt
    "view_safe_page",
    "create_safe",
    "edit_safe",
    "delete_safe",

    # Công nợ
    "view_debt_page",
    "create_debt",
    "edit_debt",
    "delete_debt",

    # Kho hàng
    "view_inventory_page",
    "create_inventory",
    "edit_inventory",
    "delete_inventory",
    "inventory_check",

    # Báo cáo
    "view_reports_page",
    "export_reports",

    # Cài đặt
    "view_settings_page",
    "edit_settings",
]

# Quyền mặc định cho Admin (tự động có tất cả quyền)
ADMIN_PERMISSIONS = ALL_PERMISSIONS

# Quyền cho Accountant
ACCOUNTANT_PERMISSIONS = [
    "view_dashboard",
    "view_receipts_page",
    "create_receipt",
    "edit_receipt",
    "delete_receipt",
    "view_receipt_types_page",
    "create_receipt_type",
    "edit_receipt_type",
    "delete_receipt_type",
    "view_finance_types_page",
    "create_finance_type",
    "edit_finance_type",
    "delete_finance_type",
    "view_revenues_page",
    "create_revenue",
    "edit_revenue",
    "delete_revenue",
    "view_exchanges_page",
    "create_exchange",
    "edit_exchange",
    "delete_exchange",
    "view_finance_trade_page",
    "create_finance_trade",
    "edit_finance_trade",
    "delete_finance_trade",
    "view_safe_page",
    "view_debt_page",
    "view_reports_page",
    "export_reports",
    "view_settings_page",
]

# Quyền cho Staff (chỉ xem)
STAFF_PERMISSIONS = [
    "view_dashboard",
    "view_receipts_page",
    "view_revenues_page",
    "view_inventory_page",
    "view_reports_page",
]

# Mapping role name -> permissions
ROLE_PERMISSIONS_MAP = {
    "Quản lý": ALL_PERMISSIONS,
    "Thu ngân": [
        "view_dashboard",
        "view_receipts_page", "create_receipt",
        "view_revenues_page", "create_revenue",
        "view_attendance_page",
    ],
    "Nhân viên": [
        "view_dashboard",
        "view_receipts_page",
        "view_revenues_page",
        "view_inventory_page",
        "view_reports_page",
    ],
}

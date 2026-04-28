import { uniqueId } from "lodash";

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  isPro?: boolean;
}

const SidebarContent: MenuItem[] = [
  // QUẢN LÝ CỬA HÀNG
  {
    heading: "QUẢN LÝ CỬA HÀNG",
    children: [
      {
        name: "Tổng quan",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/",
        isPro: false,
      },
      {
        name: "Báo cáo",
        icon: "solar:chart-outline",
        id: uniqueId(),
        children: [
          {
            name: "Báo cáo chi tiết",
            icon: "solar:document-text-outline",
            id: uniqueId(),
            url: "/reports",
          },
          {
            name: "Báo cáo chi phí",
            icon: "solar:money-bag-outline",
            id: uniqueId(),
            url: "/expense-report",
          },
        ],
      },
      {
        name: "Hóa đơn",
        icon: "solar:file-text-outline",
        id: uniqueId(),
        url: "/invoices",
      },
      {
        name: "Mặt hàng",
        icon: "solar:bag-3-outline",
        id: uniqueId(),
        children: [
          {
            name: "Danh sách mặt hàng",
            icon: "solar:list-outline",
            id: uniqueId(),
            url: "/products/list",
          },
          {
            name: "Thực đơn",
            icon: "solar:menu-dots-outline",
            id: uniqueId(),
            url: "/products/menu",
          },
          {
            name: "Danh mục",
            icon: "solar:folder-outline",
            id: uniqueId(),
            url: "/products/categories",
          },
          {
            name: "Nhóm lựa chọn",
            icon: "solar:layers-minimalistic-outline",
            id: uniqueId(),
            url: "/products/option-groups",
          },
          {
            name: "Combo",
            icon: "solar:box-minimalistic-outline",
            id: uniqueId(),
            url: "/products/combos",
          },
        ],
      },
      {
        name: "Đặt lịch",
        icon: "solar:calendar-date-outline",
        id: uniqueId(),
        url: "/bookings",
      },
      {
        name: "Thu chi",
        icon: "solar:dollar-outline",
        id: uniqueId(),
        children: [
          {
            name: "Thu chi",
            icon: "solar:bill-list-outline",
            id: uniqueId(),
            url: "/finance",
          },
          {
            name: "Đổi tiền",
            icon: "solar:refresh-circle-outline",
            id: uniqueId(),
            url: "/exchanges",
          },
          {
            name: "Doanh thu",
            icon: "solar:chart-2-outline",
            id: uniqueId(),
            url: "/revenues",
          },
          {
            name: "Quỹ tiền mặt",
            icon: "solar:safe-outline",
            id: uniqueId(),
            url: "/safe",
          },
          {
            name: "Công nợ",
            icon: "solar:document-money-outline",
            id: uniqueId(),
            url: "/debt",
          },
          {
            name: "Loại thu chi",
            icon: "solar:tag-horizontal-outline",
            id: uniqueId(),
            url: "/receipt-types",
          },
        ],
      },
      {
        name: "Kho hàng",
        icon: "solar:box-outline",
        id: uniqueId(),
        children: [
          {
            name: "Hàng hóa",
            icon: "solar:box-minimalistic-outline",
            id: uniqueId(),
            url: "/inventory",
          },
          {
            name: "Thiết lập kho",
            icon: "solar:settings-outline",
            id: uniqueId(),
            url: "/warehouse-setup",
          },
          {
            name: "Xuất nhập kho",
            icon: "solar:clipboard-list-outline",
            id: uniqueId(),
            url: "/inventory-transaction",
          },
          {
            name: "Kiểm kho",
            icon: "solar:checklist-outline",
            id: uniqueId(),
            url: "/inventory-check",
          },
          {
            name: "Lịch sử kho",
            icon: "solar:history-outline",
            id: uniqueId(),
            url: "/inventory-history",
          },
          {
            name: "Thiết lập đơn vị",
            icon: "solar:scale-outline",
            id: uniqueId(),
            url: "/units",
          },
        ],
      },
      {
        name: "Nhân viên",
        icon: "solar:users-group-rounded-outline",
        id: uniqueId(),
        children: [
          {
            name: "Danh sách nhân viên",
            icon: "solar:user-outline",
            id: uniqueId(),
            url: "/staff",
          },
          {
            name: "Vai trò",
            icon: "solar:shield-user-outline",
            id: uniqueId(),
            url: "/staff-role",
          },
        ],
      },
      {
        name: "Khách hàng",
        icon: "solar:users-group-two-rounded-outline",
        id: uniqueId(),
        children: [
          {
            name: "Danh sách khách hàng",
            icon: "solar:user-hand-up-outline",
            id: uniqueId(),
            url: "/customers",
          },
          {
            name: "Nhóm khách hàng",
            icon: "solar:users-group-rounded-outline",
            id: uniqueId(),
            url: "/customers/groups",
          },
          {
            name: "Thẻ thành viên",
            icon: "solar:card-outline",
            id: uniqueId(),
            url: "/customers/membership-cards",
          },
        ],
      },
      {
        name: "Khuyến mãi",
        icon: "solar:sale-square-outline",
        id: uniqueId(),
        url: "/promotions",
      },
      {
        name: "Chấm công",
        icon: "solar:calendar-mark-outline",
        id: uniqueId(),
        children: [
          {
            name: "Bảng chấm công",
            icon: "solar:document-add-outline",
            id: uniqueId(),
            url: "/timesheet",
          },
          {
            name: "Lịch làm việc",
            icon: "solar:calendar-outline",
            id: uniqueId(),
            url: "/work-schedule",
          },
          {
            name: "Bảng lương",
            icon: "solar:bill-check-outline",
            id: uniqueId(),
            url: "/payroll",
          },
          {
            name: "Cài đặt chấm công",
            icon: "solar:settings-minimalistic-outline",
            id: uniqueId(),
            url: "/attendance-settings",
          },
        ],
      },
    ],
  },
  {
    heading: "QUẢN LÝ GIẢI ĐẤU",
    children: [
      {
        name: "Giải đấu",
        icon: "solar:cup-star-outline",
        id: uniqueId(),
        url: "/tournaments",
      },
      {
        name: "Bảng xếp hạng",
        icon: "solar:chart-square-outline",
        id: uniqueId(),
        url: "/tournaments/leaderboard",
      },
      {
        name: "Cài đặt giải đấu",
        icon: "solar:settings-minimalistic-outline",
        id: uniqueId(),
        url: "/tournament-settings",
      }
    ]
  },

  // UTILITIES (Keep old pages)
  {
    heading: "UTILITIES",
    children: [
      {
        name: "Typography",
        icon: "solar:text-circle-outline",
        id: uniqueId(),
        url: "/ui/typography",
        isPro: false,
      },
      {
        name: "Table",
        icon: "solar:bedside-table-3-linear",
        id: uniqueId(),
        url: "/ui/table",
        isPro: false,
      },
      {
        name: "Form",
        icon: "solar:password-minimalistic-outline",
        id: uniqueId(),
        url: "/ui/form",
        isPro: false,
      },
      {
        name: "Alert",
        icon: "solar:airbuds-case-charge-outline",
        id: uniqueId(),
        url: "/ui/alert",
        isPro: false,
      },
    ],
  },
];

export default SidebarContent;

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";
import { RequireAuth } from "../auth/RequireAuth";
import { ROLES } from "../auth/roles";

// Eager load critical components
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";

// Lazy load other pages for code splitting
const Finance = lazy(() => import("../pages/finance/Finance"));
const ReceiptTypes = lazy(() => import("../pages/receipt-types/ReceiptTypes"));
const Revenues = lazy(() => import("../pages/revenues/Revenues"));
const Exchanges = lazy(() => import("../pages/exchanges/Exchanges"));
const Safe = lazy(() => import("../pages/safe/Safe"));
const Debt = lazy(() => import("../pages/debt/Debt"));
const Inventory = lazy(() => import("../pages/inventory/Inventory"));
const Units = lazy(() => import("../pages/units/Units"));
const WarehouseSetup = lazy(() => import("../pages/warehouse-setup/WarehouseSetup"));
const InventoryTransaction = lazy(() => import("../pages/inventory-transaction/InventoryTransaction"));
const InventoryCheck = lazy(() => import("../pages/inventory-check/InventoryCheck"));
const InventoryHistory = lazy(() => import("../pages/inventory-history/InventoryHistory"));
const Reports = lazy(() => import("../pages/reports/Reports"));
const ExpenseReport = lazy(() => import("../pages/reports/ExpenseReport"));
const Staff = lazy(() => import("../pages/staff/Staff"));
const StaffRole = lazy(() => import("../pages/staff-role/StaffRole"));
const MobileAttendance = lazy(() => import("../pages/attendance/MobileAttendance"));
const QRAccess = lazy(() => import("../pages/attendance/QRAccess"));
const Timesheet = lazy(() => import("../pages/timesheet/Timesheet"));
const WorkSchedule = lazy(() => import("../pages/work-schedule/WorkSchedule"));
const Payroll = lazy(() => import("../pages/payroll/Payroll"));
const AttendanceSettings = lazy(() => import("../pages/attendance/AttendanceSettings"));
const Settings = lazy(() => import("../pages/settings/Settings"));

// Loading component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Mobile attendance page - no auth required for QR scanning */}
      <Route
        path="/mobile-attendance"
        element={
          <Suspense fallback={<PageLoader />}>
            <MobileAttendance />
          </Suspense>
        }
      />

      {/* QR Access validation page - no auth required */}
      <Route
        path="/attendance/check-in"
        element={
          <Suspense fallback={<PageLoader />}>
            <QRAccess />
          </Suspense>
        }
      />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <AdminLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/finance" element={<Finance />} />
                <Route
                  path="/receipt-types"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <ReceiptTypes />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/finance-types"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <ReceiptTypes />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/revenues"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <Revenues />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/revenue"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <Revenues />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/exchanges"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <Exchanges />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/finance-trade"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <Exchanges />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/safe"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <Safe />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/debt"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                      <Debt />
                    </RequireAuth>
                  }
                />
                <Route path="/reports" element={<Reports />} />
                <Route path="/expense-report" element={<ExpenseReport />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/units" element={<Units />} />
                <Route path="/warehouse-setup" element={<WarehouseSetup />} />
                <Route path="/inventory-transaction" element={<InventoryTransaction />} />
                <Route path="/inventory-in" element={<InventoryTransaction />} />
                <Route path="/inventory-out" element={<InventoryTransaction />} />
                <Route path="/inventory-check" element={<InventoryCheck />} />
                <Route path="/inventory-history" element={<InventoryHistory />} />
                <Route
                  path="/staff"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                      <Staff />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/staff-role"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                      <StaffRole />
                    </RequireAuth>
                  }
                />
                <Route path="/timesheet" element={<Timesheet />} />
                <Route
                  path="/work-schedule"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                      <WorkSchedule />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/payroll"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                      <Payroll />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/attendance-settings"
                  element={
                    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
                      <AttendanceSettings />
                    </RequireAuth>
                  }
                />
                <Route path="/settings" element={<Settings />} />
              </Routes>
              </Suspense>
            </AdminLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

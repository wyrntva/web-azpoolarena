import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { RequireAuth, AdminRoute } from '../auth/RequireAuth';

/* ***Layouts**** */
const FullLayout = lazy(() => import('../layouts/full/FullLayout'));
const BlankLayout = lazy(() => import('../layouts/blank/BlankLayout'));

// Auth
const Login = lazy(() => import('../views/auth/login/Login'));
const Register = lazy(() => import('../views/auth/register/Register'));

// Dashboard
const Dashboard = lazy(() => import('../views/dashboards/Dashboard'));

// Finance Module
const Finance = lazy(() => import('../views/finance/Finance'));
const Revenues = lazy(() => import('../views/revenues/Revenues'));
const Exchanges = lazy(() => import('../views/exchanges/Exchanges'));
const Safe = lazy(() => import('../views/safe/Safe'));
const Debt = lazy(() => import('../views/debt/Debt'));
const ReceiptTypes = lazy(() => import('../views/receipt-types/ReceiptTypes'));

// Reports
const Reports = lazy(() => import('../views/reports/Reports'));
const ExpenseReport = lazy(() => import('../views/expense-report/ExpenseReport'));

// Inventory Module
const Inventory = lazy(() => import('../views/inventory/Inventory'));
const Units = lazy(() => import('../views/units/Units'));
const WarehouseSetup = lazy(() => import('../views/warehouse-setup/WarehouseSetup'));
const InventoryTransaction = lazy(() => import('../views/inventory-transaction/InventoryTransaction'));
const InventoryCheck = lazy(() => import('../views/inventory-check/InventoryCheck'));
const InventoryHistory = lazy(() => import('../views/inventory-history/InventoryHistory'));

// Staff Module
const Staff = lazy(() => import('../views/staff/Staff'));
const StaffRole = lazy(() => import('../views/staff-role/StaffRole'));

// Customers Module
const Customers = lazy(() => import('../views/customers/Customers'));

// Attendance Module
const Timesheet = lazy(() => import('../views/timesheet/Timesheet'));
const WorkSchedule = lazy(() => import('../views/work-schedule/WorkSchedule'));
const Payroll = lazy(() => import('../views/payroll/Payroll'));
const AttendanceSettings = lazy(() => import('../views/attendance-settings/AttendanceSettings'));

// Mobile & QR (No auth required)
const MobileAttendance = lazy(() => import('../views/mobile-attendance/MobileAttendance'));
const QRAccess = lazy(() => import('../views/qr-access/QRAccess'));

// Settings
const Settings = lazy(() => import('../views/settings/Settings'));
const Areas = lazy(() => import('../views/settings/areas/Areas'));
const AreaDetail = lazy(() => import('../views/settings/areas/AreaDetail'));
const Devices = lazy(() => import('../views/settings/devices/Devices'));
const Switches = lazy(() => import('../views/settings/switches/Switches'));

// Utilities (Old template pages)
const ChangePassword = lazy(() => import('../views/change-password/ChangePassword'));
const Typography = lazy(() => import("../views/typography/Typography"));
const Table = lazy(() => import("../views/tables/Table"));
const Form = lazy(() => import("../views/forms/Form"));
const Shadow = lazy(() => import("../views/shadows/Shadow"));
const Alert = lazy(() => import("../views/alerts/Alerts"));
const Solar = lazy(() => import("../views/icons/Solar"));
const SamplePage = lazy(() => import('../views/sample-page/SamplePage'));
const Tournaments = lazy(() => import('../views/tournaments/Tournaments'));
const Leaderboard = lazy(() => import('../views/tournaments/Leaderboard'));
const TournamentSettings = lazy(() => import('../views/tournament-settings/TournamentSettings'));
const TournamentDetail = lazy(() => import('../views/tournaments/TournamentDetail'));
const ProductList = lazy(() => import('../views/products/ProductList'));
const ProductCategories = lazy(() => import('../views/products/ProductCategories'));
const ProductMenus = lazy(() => import('../views/products/ProductMenus'));
const MenuDetail = lazy(() => import('../views/products/MenuDetail'));
const Error = lazy(() => import('../views/auth/error/Error'));
const AnalyticsDashboard = lazy(() => import('../views/analytics/AnalyticsDashboard'));
const LiveScores = lazy(() => import('../views/live-scores/LiveScores'));
const News = lazy(() => import('../views/news/News'));



const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="loader"></div>
  </div>
);

const Router = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Protected Routes with FullLayout - REQUIRE AUTH */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <FullLayout />
              </RequireAuth>
            }
          >
            {/* Admin Only Routes */}
            <Route element={<AdminRoute><Outlet /></AdminRoute>}>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />

              {/* Finance Routes */}
              <Route path="finance" element={<Finance />} />
              <Route path="revenues" element={<Revenues />} />
              <Route path="revenue" element={<Revenues />} />
              <Route path="exchanges" element={<Exchanges />} />
              <Route path="finance-trade" element={<Exchanges />} />
              <Route path="safe" element={<Safe />} />
              <Route path="debt" element={<Debt />} />
              <Route path="receipt-types" element={<ReceiptTypes />} />
              <Route path="finance-types" element={<ReceiptTypes />} />

              {/* Reports */}
              <Route path="reports" element={<Reports />} />
              <Route path="reports/revenue" element={<Reports />} />
              <Route path="reports/products" element={<Reports />} />
              <Route path="reports/inventory" element={<Reports />} />
              <Route path="reports/finance" element={<Reports />} />
              <Route path="reports/promotions" element={<Reports />} />
              <Route path="reports/staff" element={<Reports />} />
              <Route path="expense-report" element={<ExpenseReport />} />

              {/* Inventory */}
              <Route path="inventory" element={<Inventory />} />
              <Route path="units" element={<Units />} />
              <Route path="warehouse-setup" element={<WarehouseSetup />} />
              <Route path="inventory-transaction" element={<InventoryTransaction />} />
              <Route path="inventory-in" element={<InventoryTransaction />} />
              <Route path="inventory-out" element={<InventoryTransaction />} />
              <Route path="inventory-check" element={<InventoryCheck />} />
              <Route path="inventory-history" element={<InventoryHistory />} />

              {/* Staff (Except Attendance) */}
              <Route path="staff" element={<Staff />} />
              <Route path="staff-role" element={<StaffRole />} />
              <Route path="attendance-settings" element={<AttendanceSettings />} />

              {/* Customers */}
              <Route path="customers" element={<Customers />} />
              
              {/* Settings */}
              <Route path="settings" element={<Settings />} />
              <Route path="settings/devices" element={<Devices />} />
              <Route path="settings/switches" element={<Switches />} />
              <Route path="settings/areas" element={<Areas />} />
              <Route path="settings/areas/:id" element={<AreaDetail />} />
            </Route>

            {/* Attendance (Open to all employees, but readonly for them) */}
            <Route path="timesheet" element={<Timesheet />} />
            <Route path="work-schedule" element={<WorkSchedule />} />
            <Route path="payroll" element={<Payroll />} />
            
            {/* User Profile */}
            <Route path="change-password" element={<ChangePassword />} />

            {/* Admin Utilities */}
            <Route element={<AdminRoute><Outlet /></AdminRoute>}>
            <Route path="products/list" element={<ProductList />} />
            <Route path="products/categories" element={<ProductCategories />} />
            <Route path="products/menu" element={<ProductMenus />} />
            <Route path="products/menu/:id" element={<MenuDetail />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="live-scores" element={<LiveScores />} />
            <Route path="news" element={<News />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:id" element={<TournamentDetail />} />
            <Route path="tournaments/leaderboard" element={<Leaderboard />} />
            <Route path="tournament-settings" element={<TournamentSettings />} />

            <Route path="ui/typography" element={<Typography />} />
            <Route path="ui/table" element={<Table />} />
            <Route path="ui/form" element={<Form />} />
            <Route path="ui/alert" element={<Alert />} />
            <Route path="ui/shadow" element={<Shadow />} />
            <Route path="icons/solar" element={<Solar />} />
            <Route path="sample-page" element={<SamplePage />} />
            
            {/* Placeholders for unimplemented features */}
            <Route path="invoices" element={<SamplePage />} />
            <Route path="bookings" element={<SamplePage />} />
            <Route path="promotions" element={<SamplePage />} />
          </Route>
        </Route>

          {/* Public Routes with BlankLayout - NO AUTH REQUIRED */}
          <Route element={<BlankLayout />}>
            <Route path="auth/login" element={<Login />} />
            <Route path="auth/register" element={<Register />} />
            <Route path="404" element={<Error />} />
            <Route path="auth/404" element={<Error />} />

            {/* Mobile attendance - no auth */}
            <Route path="mobile-attendance" element={<MobileAttendance />} />
            <Route path="attendance/check-in" element={<QRAccess />} />
          </Route>

          {/* Catch all - redirect to 404 */}
          <Route path="*" element={<Navigate to="/auth/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;

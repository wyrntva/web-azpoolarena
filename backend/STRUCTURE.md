# Backend Structure — AZ PoolArena

> NestJS + TypeORM + PostgreSQL  
> Port: **8000** | DB: `azpoolarena` (dev) / `poolarena` (prod)

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | NestJS v11 (TypeScript) |
| ORM | TypeORM v0.3 |
| Database | PostgreSQL 15 (dev Docker) / PG16 (prod) |
| Auth | JWT + Passport |
| Messaging | MQTT (Mosquitto) — NestJS Microservice |
| Scheduler | `@nestjs/schedule` (cron jobs) |
| Rate limit | `@nestjs/throttler` (60 req/min) |
| Static files | ServeStaticModule (`/uploads`, `/public`) |
| Security | helmet, compression, CORS |

---

## Entry Points

| File | Mô tả |
|---|---|
| `src/main.ts` | Bootstrap app: ValidationPipe, CORS, MQTT microservice, port 8000 |
| `src/app.module.ts` | Root module: import tất cả modules, TypeORM config, ThrottlerModule, ScheduleModule, ServeStaticModule |
| `src/data-source.ts` | TypeORM CLI DataSource — dùng cho `migration:generate/run/revert` |
| `src/common/enums.ts` | Shared enums toàn project |
| `src/common/middleware/request-id.middleware.ts` | Gắn X-Request-ID vào mọi request |

---

## Cấu trúc thư mục gốc

```
backend/
├── src/                        ← Source code chính
├── cms/                        ← React/Vite CMS app (build ra public/)
├── public/                     ← Static files served bởi NestJS (CMS build output)
├── uploads/                    ← Upload files (avatar, ảnh...)
├── dist/                       ← Build output (node dist/main)
├── scripts/                    ← Shell scripts
├── .env                        ← Env dev (DATABASE_URL, JWT, MQTT, CORS...)
├── nest-cli.json
├── tsconfig.json / tsconfig.build.json / tsconfig.migration.json
├── Dockerfile
└── package.json
```

---

## Modules — Tổng quan

| Module | Đường dẫn | Chức năng |
|---|---|---|
| **auth** | `src/auth/` | Đăng nhập/logout, JWT, guards, decorators |
| **users** | `src/users/` | Quản lý users (staff + player chung 1 bảng) |
| **roles** | `src/roles/` | Phân quyền theo role |
| **areas** | `src/areas/` | Quản lý khu vực và bàn billiards |
| **devices** | `src/devices/` | Thiết bị đầu cuối (POS, tablet...) |
| **switches** | `src/switches/` | Điều khiển công tắc điện (đèn, TV, AC...) |
| **pool-arena** | `src/pool-arena/` | Auth & dữ liệu cho app player (poolarena.vn) |
| **tournaments** | `src/tournaments/` | Quản lý giải đấu billiards |
| **pos** | `src/pos/` | Point of Sale: order, sản phẩm, menu |
| **finance** | `src/finance/` | Thu/chi, doanh thu, két, công nợ, webhook Casso |
| **inventory** | `src/inventory/` | Kho hàng, danh mục, đơn vị, nhập/xuất kho |
| **hr** | `src/hr/` | Nhân sự: chấm công, lịch làm việc, lương |
| **rankings** | `src/rankings/` | Bảng xếp hạng player |
| **store-settings** | `src/store-settings/` | Cài đặt cửa hàng (tên, logo, banner...) |
| **uploads** | `src/uploads/` | Upload file (ảnh, avatar) |
| **mqtt** | `src/mqtt/` | MQTT client publish/subscribe |

---

## Chi tiết từng Module

### auth
```
src/auth/
├── auth.module.ts
├── auth.controller.ts          POST /api/auth/login, logout, refresh, profile
├── auth.service.ts
├── constants/permissions.ts    Danh sách permission constants
├── decorators/auth.decorators.ts  @CurrentUser, @Permissions
├── dto/auth.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts       Guard kiểm tra JWT token
│   └── roles.guard.ts          Guard kiểm tra permissions
└── strategies/jwt.strategy.ts  Passport JWT strategy
```

### users
```
src/users/
├── users.module.ts
├── users.controller.ts         GET/POST/PUT/DELETE /api/users
├── users.service.ts
└── entities/user.entity.ts     → bảng `users`
```

### roles
```
src/roles/
├── roles.module.ts
├── controllers/roles.controller.ts   /api/roles
├── entities/role.entity.ts           → bảng `roles`
└── services/roles.service.ts
```

### areas
```
src/areas/
├── areas.module.ts
├── controllers/areas.controller.ts   /api/areas, /api/tables
├── dto/area.dto.ts
├── entities/area.entity.ts           → bảng `areas`, `tables`
└── services/areas.service.ts
```

### devices
```
src/devices/
├── devices.module.ts
└── entities/device.entity.ts         → bảng `devices`
```

### switches
```
src/switches/
├── switches.module.ts
├── switches.controller.ts             /api/switches
├── switches.service.ts
├── entities/switch.entity.ts          → bảng `switches`
└── scheduler/switch-scheduler.service.ts   Tự động bật/tắt theo lịch
```

### pool-arena
```
src/pool-arena/
├── pool-arena.module.ts
├── controllers/
│   ├── pool-arena.controller.ts       /api/pool-arena/* (public endpoints cho app player)
│   └── pool-arena-auth.controller.ts  /api/pool-arena/auth/*
├── dto/pool-arena.dto.ts
├── entities.ts                        Re-export UserEntity as PoolArenaUserEntity
└── services/
    ├── pool-arena.service.ts
    └── pool-arena-auth.service.ts
```

### tournaments
```
src/tournaments/
├── tournaments.module.ts
├── controllers/
│   ├── tournaments.controller.ts         /api/tournaments
│   └── tournament-settings.controller.ts /api/tournament-settings
├── dto/tournaments.dto.ts
├── entities.ts                           → bảng tournaments, matches, registrations, payment_codes, ranks, rounds, scoring_rules
├── entities/tournament.entity.ts         (duplicate, cùng nội dung entities.ts)
└── services/
    ├── tournaments.service.ts            Logic bracket knockout/double elimination
    ├── tournament-settings.service.ts
    └── tournament-scheduler.service.ts   Cron tự động cập nhật trạng thái giải
```

### pos
```
src/pos/
├── pos.module.ts
├── controllers/
│   ├── products.controller.ts    /api/products
│   ├── menus.controller.ts       /api/menus
│   └── pos-orders.controller.ts  /api/pos-orders
├── dto/
│   ├── product.dto.ts
│   ├── menu.dto.ts
│   └── pos-order.dto.ts
├── entities.ts                   → bảng `products`, `menus`, `pos_orders`, `pos_order_items`
└── services/
    ├── products.service.ts
    ├── menus.service.ts
    └── pos-orders.service.ts
```

### finance
```
src/finance/
├── finance.module.ts
├── controllers/
│   ├── receipts.controller.ts     /api/receipts, /api/receipt-types
│   ├── cashflow.controller.ts     /api/cashflow (exchanges, debts, safes)
│   ├── reports.controller.ts      /api/reports/finance
│   └── webhooks.controller.ts     /api/webhooks/casso (thanh toán tự động)
├── dto/
│   ├── finance.dto.ts
│   └── casso-webhook.dto.ts
├── entities.ts                    → bảng `receipt_types`, `receipts`, `revenues`, `exchanges`, `safes`, `debts`
└── services/
    ├── receipts.service.ts
    ├── cashflow.service.ts
    └── reports.service.ts
```

### inventory
```
src/inventory/
├── inventory.module.ts
├── controllers/
│   ├── categories.controller.ts               /api/categories
│   ├── units.controller.ts                    /api/units
│   ├── inventories.controller.ts              /api/inventories
│   └── inventory-transactions.controller.ts   /api/inventory-transactions
├── dto/inventory.dto.ts
├── entities.ts                                → bảng `categories`, `units`, `inventories`, `inventory_transactions`, `inventory_transaction_details`
└── services/
    ├── categories.service.ts
    ├── units.service.ts
    ├── inventories.service.ts
    └── inventory-transactions.service.ts
```

### hr (Human Resources)
```
src/hr/
├── hr.module.ts
├── controllers/
│   ├── work-schedules.controller.ts     /api/work-schedules
│   ├── attendances.controller.ts        /api/attendances
│   ├── attendance-settings.controller.ts
│   ├── payroll.controller.ts            /api/payroll
│   ├── qr-access.controller.ts          /api/qr-access
│   └── wifi-configs.controller.ts       /api/wifi-configs
├── dto/hr.dto.ts
├── entities.ts                          → bảng `wifi_configs`, `qr_sessions`, `work_schedules`, `attendances`, `attendance_settings`, `advance_payments`, `bonuses`, `penalties`, `qr_access_devices`, `qr_access_tokens`
├── guards/internal-api.guard.ts         Guard cho internal API key
├── helpers/attendance.helpers.ts
└── services/
    ├── work-schedules.service.ts
    ├── attendances.service.ts
    ├── attendance-settings.service.ts
    ├── payroll.service.ts
    ├── qr-access.service.ts
    └── wifi-configs.service.ts
└── scheduler/
    └── attendance-scheduler.service.ts  Cron tự động đánh absent
```

### rankings
```
src/rankings/
├── rankings.module.ts
├── controllers/rankings.controller.ts   /api/rankings
└── services/rankings.service.ts
```

### store-settings
```
src/store-settings/
├── store-settings.module.ts
├── controllers/store-settings.controller.ts   /api/store-settings
├── dto/store-settings.dto.ts
├── entities.ts & entities/store-settings.entity.ts   → bảng `store_settings`
└── services/store-settings.service.ts
```

### uploads
```
src/uploads/
├── uploads.module.ts
├── controllers/uploads.controller.ts   POST /api/uploads (multer)
└── services/uploads.service.ts
```

### mqtt
```
src/mqtt/
├── mqtt.module.ts
├── mqtt.controller.ts    Subscribe MQTT topics
└── mqtt.service.ts       Publish messages đến thiết bị
```

---

## Database — Tất cả bảng

| Bảng | Module | Mô tả |
|---|---|---|
| `users` | users | Staff + player gộp chung, phân biệt qua `user_type` |
| `roles` | roles | Vai trò (admin, nhân viên...), permissions lưu JSON |
| `areas` | areas | Khu vực trong cửa hàng |
| `tables` | areas | Bàn billiards trong khu vực |
| `devices` | devices | Thiết bị đầu cuối (POS tablet) |
| `switches` | switches | Công tắc điện (đèn, TV, AC), hỗ trợ schedule on/off |
| `products` | pos | Sản phẩm/dịch vụ bán |
| `menus` | pos | Menu hiển thị trên POS |
| `pos_orders` | pos | Đơn hàng POS |
| `pos_order_items` | pos | Chi tiết từng item trong đơn |
| `receipt_types` | finance | Loại phiếu thu/chi |
| `receipts` | finance | Phiếu thu/chi |
| `revenues` | finance | Doanh thu theo ngày |
| `exchanges` | finance | Chuyển tiền giữa két cash/bank |
| `safes` | finance | Giao ca két tiền |
| `debts` | finance | Theo dõi công nợ |
| `categories` | inventory | Danh mục hàng hóa |
| `units` | inventory | Đơn vị tính |
| `inventories` | inventory | Danh sách kho hàng |
| `inventory_transactions` | inventory | Phiếu nhập/xuất kho |
| `inventory_transaction_details` | inventory | Chi tiết phiếu kho |
| `wifi_configs` | hr | Cấu hình WiFi hợp lệ cho chấm công |
| `qr_sessions` | hr | QR token chấm công check-in/out |
| `work_schedules` | hr | Lịch làm việc nhân viên |
| `attendances` | hr | Chấm công (check-in/check-out) |
| `attendance_settings` | hr | Cấu hình chính sách chấm công |
| `advance_payments` | hr | Tạm ứng lương |
| `bonuses` | hr | Thưởng nhân viên |
| `penalties` | hr | Phạt nhân viên |
| `qr_access_devices` | hr | Thiết bị QR access (check điểm danh) |
| `qr_access_tokens` | hr | Token truy cập QR |
| `tournaments` | tournaments | Giải đấu billiards |
| `tournament_registrations` | tournaments | Đăng ký tham gia giải |
| `tournament_matches` | tournaments | Trận đấu trong giải (bracket knockout/loser) |
| `tournament_payment_codes` | tournaments | Mã thanh toán phí đăng ký giải |
| `tournament_ranks` | tournaments | Hạng bậc (A, B, C...) |
| `tournament_rounds` | tournaments | Vòng đấu (1/64, 1/32, 1/16, 1/8, tứ kết...) |
| `scoring_rules` | tournaments | Quy tắc tính điểm (win/lose/draw/bonus) |
| `store_settings` | store-settings | Thông tin cửa hàng, banner |
| `typeorm_migrations` | - | Lịch sử migrations đã chạy |

---

## UserEntity — Ghi chú quan trọng

Bảng `users` chứa cả **staff** và **player** (gộp từ bảng pool_arena_users cũ):

| Field | Staff | Player |
|---|---|---|
| `user_type` | `'staff'` | `'player'` hoặc `'both'` |
| `username` | có (unique) | null |
| `role_id` | có | null |
| `salary_type` | hourly/fixed | null |
| `phone_number` | null | có (unique) |
| `rank` | null | có (A/B/C...) |
| `points` | 0 | tích điểm tournament |

---

## Migrations

| File | Nội dung |
|---|---|
| `1748000000000-AddTournamentQuarterFinalAndDrawFromRound` | Thêm cột quarter_final, draw_from_round vào tournaments |
| `1779465460304-InitialSchema` | Schema ban đầu toàn bộ DB |
| `1779929077697-AddPaymentCodeEntity` | Thêm bảng tournament_payment_codes |
| `1780000000000-MergePoolArenaUsersIntoUsers` | Gộp pool_arena_users vào bảng users |
| `1780000000001-AddStaffToCustomerList` | Cho phép staff xuất hiện trong danh sách khách |
| `1780000000002-AddDetailLogoToTournament` | Thêm cột detail_logo vào tournaments |

Chạy migration:
```bash
npm run migration:run     # chạy pending migrations
npm run migration:revert  # rollback migration cuối
npm run migration:show    # xem trạng thái
```

---

## NPM Scripts

```bash
npm run start:dev        # Dev mode (watch)
npm run start:prod       # Production (node dist/main)
npm run build            # Compile TypeScript
npm run migration:generate -- src/migrations/TenMigration  # Tạo migration mới
npm run migration:run    # Chạy migration
npm run lint             # ESLint fix
```

---

## Environment Variables (.env)

```
DATABASE_URL=postgresql://postgres:...@localhost:5432/azpoolarena
SECRET_KEY=...           # JWT secret
ENV=development          # development | production
PORT=8000
CORS_ORIGINS=http://localhost:5173,...
MQTT_URL=mqtt://localhost:1883
INTERNAL_API_KEY=...     # Cho HR internal API
MAIL_HOST/PORT/USER/PASS # Gmail SMTP
CASSO_SECURE_TOKEN=...   # Webhook xác thực Casso
```

---

## Docker Dev Setup

```
Container: azpool-db-dev    postgres:15-alpine   port 5432
Container: azpool-backend-dev                    port 8000
Container: azpool-frontend-dev                   port 5173
Container: azpool-mqtt-dev  eclipse-mosquitto:2  port 1883/9001
Container: azpool-member-dev                     port 5176
Container: azpool-poolarena-dev                  port 5174
```

---

## Cấu trúc Request Flow

```
Client Request
  → Nginx (prod) / trực tiếp (dev)
  → RequestIdMiddleware (gắn X-Request-ID)
  → ThrottlerGuard (60 req/min)
  → JwtAuthGuard (kiểm tra Bearer token)
  → RolesGuard (kiểm tra permissions)
  → Controller
  → Service (business logic)
  → TypeORM Repository
  → PostgreSQL
```

---

## Utility Scripts (root backend/)

| File | Mô tả |
|---|---|
| `check_matches.js` | Kiểm tra trận đấu |
| `fix_late_local.js` | Sửa dữ liệu chấm công muộn |
| `fix_upcoming.js` | Sửa trạng thái upcoming |
| `query_tour_dates.js` | Query ngày thi đấu |
| `repair_tournament_dates.js` | Sửa ngày giải đấu |
| `reseed_tournament_6.js` | Reseed dữ liệu giải 6 |
| `update_tournament_matches.js` | Cập nhật trận đấu |

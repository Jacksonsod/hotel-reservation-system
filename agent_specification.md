# AGENT_SPECIFICATION.md — Hotel Reservation & Room Management System (Monorepo)
**Module:** ITLAW701 – Advanced Web Technologies (RP Karongi College, Level 7 IT)  
**Architecture:** Single-Root Monorepo — Laravel RESTful API Backend + MySQL 8.0 (3NF) + React.js (Vite) & Material UI (MUI v5) SPA Frontend  

> **STRICT DIRECTIVE FOR AI CODING AGENTS:**  
> This document is the single source of truth for the entire monorepo project. Both the Laravel backend and the React.js SPA live inside the **same root Laravel project directory** (React source resides in `resources/js/` and communicates with Laravel strictly via RESTful JSON APIs at `/api/v1/...`). Do **not** create separate `backend/` and `frontend/` root folders, and do **not** invent new colors, font families, font sizes, database table names, column names, status strings, or unrequested libraries. Follow every token, schema definition, validation rule, and folder path in this file verbatim.

## 1. Locked Monorepo Technology Stack & Packages

### 1.1 Backend (`composer.json` in Root)
| Layer | Package / Technology | Purpose & Constraint |
| :--- | :--- | :--- |
| **Framework** | Laravel 10.x or 11.x (PHP 8.2+) | Serves the SPA shell on web fallback route and RESTful APIs on `/api/v1/...` |
| **Database** | MySQL 8.0+ (InnoDB) | Strictly 24 core tables in 3NF with foreign keys & transactions |
| **Authentication** | `laravel/sanctum` | Bearer token / SPA authentication + role middleware |
| **PDF Generation** | `barryvdh/laravel-dompdf` | Invoices, payment receipts, and analytical PDF report exports |
| **CSV Exports** | Native PHP `fputcsv` streamed response | Analytical CSV exports without extra third-party bloat |
| **Image Storage** | Laravel `Storage` (`public` disk) | Stored in `storage/app/public/hotels` and `storage/app/public/rooms` |

### 1.2 Frontend (`package.json` in Root, React inside `resources/js/`)
| Layer | Package / Technology | Purpose & Constraint |
| :--- | :--- | :--- |
| **Build Tool** | React 18+ with `laravel-vite-plugin` & `@vitejs/plugin-react` | Single-root Vite setup compiling `resources/js/main.jsx` |
| **UI Component Library** | `@mui/material` `@emotion/react` `@emotion/styled` | Mandatory for all buttons, forms, dialogs, cards, tables, and layout |
| **Icons** | `@mui/icons-material` | Mandatory including half-moon icon (`DarkModeOutlined`) in header |
| **Data Grids** | `@mui/x-data-grid` | Mandatory for sortable, filterable, paginated management tables |
| **Charts & Analytics** | `recharts` | Mandatory for BarChart, LineChart, PieChart, and AreaChart reports |
| **Routing** | `react-router-dom` (v6) | Client-side role-protected routes and dedicated role dashboards |
| **HTTP Client** | `axios` | Centralized instance calling `/api/v1/...` with Bearer token & language headers |
| **Internationalization** | `i18next` `react-i18next` | Supports English (`en`), French (`fr`), and Kinyarwanda (`rw`) |

## 2. Design System: Colors, Typography, Spacing & Surfaces

### 2.1 Color Palette (Hospitality Royal Navy & Warm Gold)
All components must read colors from the Material UI theme (`resources/js/theme/theme.js`). Never hardcode random hex values inside individual page components.

| Token Role | Light Mode Hex | Dark Mode Hex | Usage Rule |
| :--- | :--- | :--- | :--- |
| `palette.primary.main` | `#1B365D` | `#38BDF8` | Primary buttons, active nav indicators, key headers |
| `palette.primary.light` | `#2C5282` | `#7DD3FC` | Hover states, secondary accents |
| `palette.primary.dark` | `#0F2342` | `#0284C7` | Active/pressed button states |
| `palette.primary.contrastText` | `#FFFFFF` | `#0F172A` | Text inside primary buttons |
| `palette.secondary.main` | `#C59B27` | `#FBBF24` | Hospitality gold highlights, loyalty badges, star ratings |
| `palette.secondary.light` | `#D4AF37` | `#FCD34D` | Gold hover accents, VIP/loyalty icons |
| `palette.secondary.dark` | `#9A7818` | `#D97706` | Active secondary button states |
| `palette.secondary.contrastText` | `#0F172A` | `#0F172A` | Text on gold buttons/badges |
| `palette.background.default` | `#F8FAFC` | `#0B1120` | Main application page background |
| `palette.background.paper` | `#FFFFFF` | `#1E293B` | Cards, tables, dialogs, modals, top AppBar |
| `custom.sidebar.background` | `#0F172A` | `#090D16` | Left navigation drawer (always dark navy for high contrast) |
| `custom.sidebar.text` | `#F8FAFC` | `#F8FAFC` | Sidebar menu text |
| `custom.sidebar.activeBg` | `#1E293B` | `#1E293B` | Active sidebar navigation item background |
| `custom.sidebar.activeBorder` | `#C59B27` | `#FBBF24` | `4px` left border on active sidebar menu item |
| `palette.text.primary` | `#0F172A` | `#F8FAFC` | Headings, primary table text, form values |
| `palette.text.secondary` | `#475569` | `#94A3B8` | Subtitles, labels, table column headers, timestamps |
| `palette.text.disabled` | `#94A3B8` | `#64748B` | Disabled inputs, muted placeholders |
| `palette.divider` | `#E2E8F0` | `#334155` | Card borders, table row borders, section dividers |

### 2.2 Semantic Status & Badge Colors
Use these exact color pairs for all MUI `<Chip />` badges across Rooms, Reservations, Payments, Housekeeping, Maintenance, and Fraud Alerts:

| Semantic State | Matching System Statuses | Solid Accent | Light Mode Chip (`bg` / `text`) | Dark Mode Chip (`bg` / `text`) |
| :--- | :--- | :--- | :--- | :--- |
| **Success (Green)** | `Available`, `Clean`, `Paid`, `Confirmed`, `Completed`, `Resolved`, `Low` | `#10B981` | `#D1FAE5` / `#065F46` | `#064E3B` / `#6EE7B7` |
| **Warning (Amber)** | `Reserved`, `Pending`, `Cleaning`, `Partially Paid`, `In Progress`, `Medium` | `#F59E0B` | `#FEF3C7` / `#92400E` | `#78350F` / `#FCD34D` |
| **Info (Blue)** | `Occupied`, `Checked In`, `Assigned` | `#3B82F6` | `#DBEAFE` / `#1E40AF` | `#1E3A8A` / `#93C5FD` |
| **Error (Red)** | `Dirty`, `Under Maintenance`, `Cancelled`, `Unpaid`, `Flagged`, `High` | `#EF4444` | `#FEE2E2` / `#991B1B` | `#7F1D1D` / `#FCA5A5` |
| **Neutral (Slate)** | `Checked Out`, `Inactive`, `Deactivated`, `Dismissed` | `#64748B` | `#F1F5F9` / `#334155` | `#334155` / `#CBD5E1` |

### 2.3 Recharts Color Sequence
All charts (`BarChart`, `LineChart`, `PieChart`, `AreaChart`) must pull series colors strictly in this order:
1. `#1B365D` (Royal Navy — Primary Revenue / Occupancy)
2. `#C59B27` (Warm Gold — Secondary Comparison / Room Type)
3. `#10B981` (Emerald — Available / Clean / Completed)
4. `#3B82F6` (Blue — Occupied / Checked In)
5. `#F59E0B` (Amber — Reserved / Pending)
6. `#EF4444` (Coral Red — Cancellations / Maintenance / Dirty)

### 2.4 Font Families & Typographic Scale
Load Google Fonts (`Inter`, `Plus Jakarta Sans`, and `JetBrains Mono`) in `resources/views/app.blade.php`.

| Typography Variant | Font Family | Font Size (`rem` / `px`) | Font Weight | Line Height | Letter Spacing & Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary UI Font** | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` | Base `15px` | `400` / `500` / `600` | `1.5` | Normal (`0em`) |
| **Heading Font** | `'Plus Jakarta Sans', 'Inter', sans-serif` | Headings `h1`–`h4` | `600` / `700` | `1.25` | Tight (`-0.02em` to `-0.01em`) |
| **Monospace Font** | `'JetBrains Mono', monospace` | `0.8125rem` (`13px`) | `500` | `1.4` | Used for `confirmation_code`, `invoice_number`, `transaction_reference`, `ip_address` |
| `h1` (Landing Hero) | `Plus Jakarta Sans` | `2.25rem` (`36px`) | `700` | `1.2` | `-0.02em` |
| `h2` (Page Title) | `Plus Jakarta Sans` | `1.625rem` (`26px`) | `700` | `1.25` | `-0.01em` |
| `h3` (Section Title) | `Plus Jakarta Sans` | `1.25rem` (`20px`) | `600` | `1.3` | `-0.01em` |
| `h4` (Card / Modal Title) | `Plus Jakarta Sans` | `1.0625rem` (`17px`) | `600` | `1.4` | `0em` |
| `h5` (Widget Subtitle) | `Inter` | `0.9375rem` (`15px`) | `600` | `1.4` | `0em` |
| `h6` (Table Header Label) | `Inter` | `0.75rem` (`12px`) | `700` | `1.4` | `0.05em`, `uppercase` |
| `body1` (Default Copy / Inputs) | `Inter` | `0.9375rem` (`15px`) | `400` | `1.5` | `0em` |
| `body2` (Table Cell Text) | `Inter` | `0.875rem` (`14px`) | `400` | `1.5` | `0em` |
| `caption` (Helper / Timestamps) | `Inter` | `0.75rem` (`12px`) | `500` | `1.4` | `0.01em` |
| `button` (All Buttons) | `Inter` | `0.875rem` (`14px`) | `600` | `1.4` | `textTransform: 'none'` (Never ALL CAPS) |

### 2.5 Layout Grid, Spacing, Borders & Shadows
* **Base Spacing Unit:** `8px` (`theme.spacing(1) = 8px`).
* **Responsive Breakpoints:** `xs: 0px`, `sm: 600px`, `md: 900px`, `lg: 1200px`, `xl: 1536px`.
* **Application Header (`AppBar`):**
  * Fixed height: `64px`.
  * Background: `palette.background.paper` with `1px solid` bottom border (`palette.divider`), `elevation={0}`.
  * Right-aligned controls (in exact order):
    1. **Hotel Branch Context Selector** (Admin only: `All Branches` or specific branch).
    2. **Language Switcher (`<Select size="small">`)**: `EN` (English), `FR` (Français), `RW` (Ikinyarwanda).
    3. **Dark/Light Mode Toggle (`<IconButton>`)**: Uses `<DarkModeOutlined />` (half-moon icon) in Light Mode and `<LightModeOutlined />` in Dark Mode, persisting mode in `localStorage.getItem('themeMode')`.
    4. **Notification Bell (`<Badge color="error">`)**: Opens a `<Popover>` listing unread notifications with "Mark all as read".
    5. **User Profile Chip & Menu**: Displays user name, role badge, Profile link, and Logout button.
* **Sidebar Navigation (`Drawer`):**
  * Width: `260px` fixed on desktop (`lg`+), collapsible temporary drawer on mobile/tablet (`< 1200px`).
  * Displays only menu items permitted for the authenticated user's `role` (`guest`, `receptionist`, `housekeeping`, `admin`).
* **Main Content Workspace:**
  * Padding: `24px` on desktop (`16px` on mobile).
  * Maximum width: `1600px` centered.
  * Vertical gap between page sections: `24px` (`theme.spacing(3)`).
* **Border Radius & Shadows:**
  * **Cards & DataGrid Containers:** `borderRadius: '12px'`, border `1px solid` `palette.divider`.
  * **Buttons, TextFields & Selects:** `borderRadius: '8px'`, input height `42px` (`size="small"` or custom style).
  * **Status Chips:** `borderRadius: '6px'`, `height: '26px'`, `fontWeight: 600`.
  * **Modals / Dialogs:** `borderRadius: '16px'`, `maxWidth="sm"` or `"md"` with `fullWidth`.
  * **Light Mode Card Shadow:** `0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
  * **Dark Mode Card Shadow:** `0 4px 6px -1px rgba(0, 0, 0, 0.35)`.

### 2.6 Standard Page & Component Blueprints
Every management module (Hotels, Rooms, Reservations, Users, Services, Housekeeping, Maintenance, Fraud Flags) must follow this exact 4-row page layout:
1. **Row 1 — Page Header Bar:** Left side shows `h2` Page Title + `body2` subtitle; Right side shows primary action button `<Button variant="contained" startIcon={<AddIcon />}>Add New [Entity]</Button>` (and `Export PDF` / `Export CSV` buttons where applicable).
2. **Row 2 — KPI Summary Strip:** 4 `<Card>` widgets in a `<Grid container spacing={3}>` (`xs={12} sm={6} lg={3}`), each showing a `48x48px` rounded icon box, `h2` metric count/amount, and `body2` label.
3. **Row 3 — Filter & Search Toolbar:** Inside a `<Paper>` wrapper above the table with a debounced Search `<TextField placeholder="Search..." />` (`width: 280px`), status/branch/date `<Select>` dropdowns, and a `Reset Filters` button.
4. **Row 4 — MUI DataGrid / Table:**
   * Header row background: `#F1F5F9` (Light) / `#0F172A` (Dark).
   * Default pagination: `10`, `25`, `50` rows per page.
   * Rightmost column titled `Actions` (`width: 140px`, non-sortable):
     * **View:** `<IconButton size="small" color="info"><VisibilityOutlined fontSize="small" /></IconButton>`
     * **Edit:** `<IconButton size="small" color="warning"><EditOutlined fontSize="small" /></IconButton>`
     * **Delete / Deactivate:** `<IconButton size="small" color="error"><DeleteOutline fontSize="small" /></IconButton>` (must trigger a `<Dialog>` confirmation modal before calling the API).

## 3. Complete 24-Table Database Schema & Exact Enums

Run migrations in the exact numerical order below so all foreign key constraints succeed without error. Every table uses InnoDB and UTF8MB4.

| Order | Table Name | Primary Key | Exact Columns & Data Types | Allowed Status / Role Enums |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `users` | `user_id` | `user_id` (bigint PK), `name` (varchar 120), `email` (varchar 150 UNIQUE), `phone` (varchar 20), `password` (varchar 255), `role` (enum), `status` (enum), `created_at`, `updated_at` | `role`: `'guest'`, `'receptionist'`, `'housekeeping'`, `'admin'` \| `status`: `'active'`, `'inactive'`, `'suspended'` |
| **02** | `hotels` | `hotel_id` | `hotel_id` (bigint PK), `name` (varchar 150), `description` (text), `location` (varchar 100), `address` (varchar 255), `contact_phone` (varchar 20), `contact_email` (varchar 150), `status` (enum), `created_at`, `updated_at` | `status`: `'active'`, `'inactive'` |
| **03** | `hotel_images` | `image_id` | `image_id` (bigint PK), `hotel_id` (FK `hotels`), `image_path` (varchar 255), `uploaded_at` (timestamp) | — |
| **04** | `room_types` | `room_type_id` | `room_type_id` (bigint PK), `type_name` (varchar 100), `description` (text), `maximum_capacity` (unsigned int) | — |
| **05** | `amenities` | `amenity_id` | `amenity_id` (bigint PK), `amenity_name` (varchar 100 UNIQUE), `description` (varchar 255) | — |
| **06** | `rooms` | `room_id` | `room_id` (bigint PK), `hotel_id` (FK `hotels`), `room_number` (varchar 30), `room_type_id` (FK `room_types`), `price_per_night` (decimal 12,2), `capacity` (unsigned int), `description` (text), `status` (enum) — UNIQUE(`hotel_id`, `room_number`) | `status`: `'available'`, `'reserved'`, `'occupied'`, `'dirty'`, `'clean'`, `'under_maintenance'`, `'inactive'` |
| **07** | `room_images` | `image_id` | `image_id` (bigint PK), `room_id` (FK `rooms`), `image_path` (varchar 255), `uploaded_at` (timestamp) | — |
| **08** | `room_amenities` | `room_amenity_id` | `room_amenity_id` (bigint PK), `room_id` (FK `rooms`), `amenity_id` (FK `amenities`) — UNIQUE(`room_id`, `amenity_id`) | — |
| **09** | `services` | `service_id` | `service_id` (bigint PK), `hotel_id` (FK `hotels`), `service_name` (varchar 120), `description` (text), `price` (decimal 12,2), `status` (enum) | `status`: `'active'`, `'inactive'` |
| **10** | `reservations` | `reservation_id` | `reservation_id` (bigint PK), `confirmation_code` (varchar 30 UNIQUE), `user_id` (FK `users`), `room_id` (FK `rooms`), `check_in` (date), `check_out` (date), `number_of_guests` (unsigned int), `total_amount` (decimal 12,2), `payment_status` (enum), `reservation_status` (enum), `created_at`, `updated_at` | `payment_status`: `'unpaid'`, `'partially_paid'`, `'paid'` \| `reservation_status`: `'pending'`, `'confirmed'`, `'checked_in'`, `'checked_out'`, `'cancelled'` |
| **11** | `reservation_guests` | `guest_id` | `guest_id` (bigint PK), `reservation_id` (FK `reservations`), `full_name` (varchar 120), `identification_number` (varchar 50), `contact_phone` (varchar 20) | — |
| **12** | `payments` | `payment_id` | `payment_id` (bigint PK), `reservation_id` (FK `reservations`), `amount` (decimal 12,2), `payment_method` (enum), `transaction_reference` (varchar 50 UNIQUE), `payment_status` (enum), `paid_at` (timestamp) | `payment_method`: `'cash'`, `'card'`, `'mobile_money'` \| `payment_status`: `'pending'`, `'completed'`, `'failed'` |
| **13** | `check_ins` | `checkin_id` | `checkin_id` (bigint PK), `reservation_id` (FK `reservations` UNIQUE), `room_id` (FK `rooms`), `receptionist_id` (FK `users`), `checkin_time` (datetime), `special_requests` (text nullable), `status` (enum) | `status`: `'checked_in'`, `'completed'` |
| **14** | `checkouts` | `checkout_id` | `checkout_id` (bigint PK), `reservation_id` (FK `reservations` UNIQUE), `receptionist_id` (FK `users`), `checkout_time` (datetime), `room_charges` (decimal 12,2), `additional_charges` (decimal 12,2), `discounts` (decimal 12,2), `total_amount` (decimal 12,2) | — |
| **15** | `guest_service_orders` | `order_id` | `order_id` (bigint PK), `reservation_id` (FK `reservations`), `service_id` (FK `services`), `quantity` (unsigned int), `unit_price` (decimal 12,2), `total_price` (decimal 12,2), `ordered_at` (timestamp) | — |
| **16** | `invoices` | `invoice_id` | `invoice_id` (bigint PK), `reservation_id` (FK `reservations` UNIQUE), `invoice_number` (varchar 40 UNIQUE), `subtotal` (decimal 12,2), `discount` (decimal 12,2), `tax` (decimal 12,2), `total_amount` (decimal 12,2), `issued_at` (timestamp) | — |
| **17** | `housekeeping_tasks` | `task_id` | `task_id` (bigint PK), `room_id` (FK `rooms`), `assigned_to` (FK `users`), `task_description` (text), `task_status` (enum), `assigned_at` (datetime), `completed_at` (datetime nullable) | `task_status`: `'dirty'`, `'cleaning'`, `'clean'` |
| **18** | `maintenance_logs` | `maintenance_id` | `maintenance_id` (bigint PK), `room_id` (FK `rooms`), `reported_by` (FK `users`), `issue_description` (text), `priority` (enum), `maintenance_status` (enum), `reported_at` (datetime), `resolved_at` (datetime nullable) | `priority`: `'low'`, `'medium'`, `'high'`, `'urgent'` \| `maintenance_status`: `'pending'`, `'in_progress'`, `'resolved'` |
| **19** | `reviews` | `review_id` | `review_id` (bigint PK), `user_id` (FK `users`), `hotel_id` (FK `hotels`), `reservation_id` (FK `reservations` UNIQUE), `rating` (tinyint 1–5), `comment` (text), `created_at` (timestamp) | — |
| **20** | `loyalty_accounts` | `loyalty_id` | `loyalty_id` (bigint PK), `user_id` (FK `users` UNIQUE), `total_points` (int default 0), `available_points` (int default 0), `updated_at` (timestamp) | — |
| **21** | `loyalty_transactions` | `transaction_id` | `transaction_id` (bigint PK), `loyalty_id` (FK `loyalty_accounts`), `reservation_id` (FK `reservations` nullable), `transaction_type` (enum), `points` (int), `description` (varchar 255), `created_at` (timestamp) | `transaction_type`: `'earned'`, `'redeemed'`, `'adjusted'` |
| **22** | `notifications` | `notification_id` | `notification_id` (bigint PK), `user_id` (FK `users`), `title` (varchar 150), `message` (text), `notification_type` (enum), `is_read` (boolean default false), `created_at` (timestamp) | `notification_type`: `'booking'`, `'payment'`, `'checkin'`, `'checkout'`, `'housekeeping'`, `'maintenance'`, `'promo'` |
| **23** | `audit_logs` | `log_id` | `log_id` (bigint PK), `user_id` (FK `users` nullable), `action` (varchar 100), `target_table` (varchar 60), `target_id` (bigint nullable), `ip_address` (varchar 45), `created_at` (timestamp) | — |
| **24** | `fraud_flags` | `flag_id` | `flag_id` (bigint PK), `user_id` (FK `users` nullable), `ip_address` (varchar 45), `activity_description` (text), `risk_level` (enum), `review_status` (enum), `created_at` (timestamp) | `risk_level`: `'low'`, `'medium'`, `'high'` \| `review_status`: `'pending'`, `'reviewed'`, `'resolved'`, `'dismissed'` |

> **Important Eloquent Model Rule:** Because the tables use explicit primary key names (`user_id`, `hotel_id`, `room_id`, etc.) instead of `id`, **every Eloquent Model MUST explicitly set `protected $primaryKey = '<table_pk>';`**.

## 4. Locked Business Logic, Validation Rules & Formulas

### 4.1 Form & API Validation Rules
Every Laravel `FormRequest` and React form must enforce these exact rules:
1. **Required Fields:** Never allow empty submissions on required attributes.
2. **Email Format:** RFC-compliant valid email (`filter_var` / `email` rule).
3. **Password Policy:** Minimum `8` characters, at least `1` uppercase letter (`A-Z`), `1` number (`0-9`), and `1` special character (`[@$!%*#?&]`). Regex: `/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/`.
4. **Phone Numbers:** Numeric digits only (optional leading `+`), `10` to `15` digits (`/^\+?[0-9]{10,15}$/`).
5. **Financial Values:** `price_per_night`, `amount`, `price`, `additional_charges` must be numeric and `>= 0`.
6. **Reservation Dates:** `check_in` must be `>= today` (for new bookings); `check_out` must be strictly `> check_in`.
7. **Guest Capacity:** `number_of_guests` must be `>= 1` and `<= room.capacity` (and `<= room_type.maximum_capacity`).
8. **Image Uploads:** Accept only `jpeg`, `jpg`, `png` (`mimes:jpeg,jpg,png`), maximum size `2048` KB (`2MB`). Store with unique UUID/timestamp filenames.
9. **Outstanding Balance Cap:** A payment `amount` must never exceed `(reservation.total_amount - sum_of_completed_payments)`.

### 4.2 Exact Anti-Double-Booking Concurrency Formula
When checking availability or creating a reservation, wrap the check and insert inside `DB::transaction()` with `lockForUpdate()` on the target room row. A room is **unavailable** if:
1. `rooms.status` is `'under_maintenance'` or `'inactive'`, OR `hotels.status` is `'inactive'`.
2. Any record exists in `reservations` for that `room_id` where:
   * `reservation_status IN ('pending', 'confirmed', 'checked_in')`
   * AND `check_in < :requested_check_out`
   * AND `check_out > :requested_check_in`

### 4.3 Code & Billing Formulas
* **Currency Display:** Rwandan Francs (`RWF`), formatted with comma separators (e.g., `RWF 85,000`).
* **Confirmation Code Format:** `'RES-' . date('Ymd') . '-' . strtoupper(Str::random(5))` (e.g., `RES-20261105-A9K2P`).
* **Transaction Reference Format:** `'PAY-' . date('Ymd') . '-' . strtoupper(Str::random(6))` (e.g., `PAY-20261105-88X19B`).
* **Invoice Number Format:** `'INV-' . date('Ymd') . '-' . str_pad($reservation_id, 5, '0', STR_PAD_LEFT)`.
* **Checkout & Invoice Calculation:**
  * `nights = max(1, Carbon::parse($check_in)->diffInDays(Carbon::parse($check_out)))`
  * `room_charges = nights * room.price_per_night`
  * `additional_charges = SUM(guest_service_orders.total_price)` for that `reservation_id`
  * `subtotal = room_charges + additional_charges`
  * `discount = redeemed_loyalty_points * 50` (where `1 point = 50 RWF`)
  * `tax = round((subtotal - discount) * 0.18, 2)` (18% VAT)
  * `final_total_amount = (subtotal - discount) + tax`
* **Loyalty Point Rules:**
  * **Earning:** Upon checkout (`reservation_status = 'checked_out'` and `payment_status = 'paid'`), award `floor(final_total_amount / 1000)` points (1 point per `1,000 RWF` spent). Check `loyalty_transactions` first to prevent duplicate awards for the same `reservation_id`.
  * **Redeeming:** Guests can redeem up to their `available_points` balance during booking or checkout (`1 point = 50 RWF` discount).
* **Automatic Fraud Detection Triggers (`FraudDetectionService`):**
  * **Trigger 1 (Unpaid Booking Spam):** User creates `>= 3` reservations with `payment_status = 'unpaid'` within 24 hours → Create `fraud_flags` record with `risk_level = 'medium'`.
  * **Trigger 2 (IP Account Farming):** `>= 3` user registrations from the same `ip_address` within 1 hour → Create `fraud_flags` record with `risk_level = 'high'`.
  * **Trigger 3 (Rapid Overlapping Attempts):** User submits `>= 3` failed overlapping reservation attempts within 15 minutes → Create `fraud_flags` record with `risk_level = 'low'`.

## 5. Role-Based Navigation & Dashboard Matrix

Each authenticated user is redirected immediately upon login to their role's base route:

| Role | Base Redirect Route | Allowed Sidebar Navigation Items |
| :--- | :--- | :--- |
| **`guest`** | `/guest/dashboard` | 1. Dashboard (`/guest/dashboard`)<br>2. Browse Hotels & Rooms (`/guest/hotels`)<br>3. My Reservations (`/guest/reservations`)<br>4. Payments & Invoices (`/guest/payments`)<br>5. Loyalty Points (`/guest/loyalty`)<br>6. My Reviews (`/guest/reviews`)<br>7. Profile (`/profile`) |
| **`receptionist`** | `/reception/dashboard` | 1. Front Desk Dashboard (`/reception/dashboard`)<br>2. Check-In & Check-Out (`/reception/check-in-out`)<br>3. Reservations (`/reception/reservations`)<br>4. Guest Service Orders (`/reception/services`)<br>5. Payments & Invoices (`/reception/payments`)<br>6. Room Availability Board (`/reception/rooms`)<br>7. Report Maintenance (`/reception/maintenance`)<br>8. Profile (`/profile`) |
| **`housekeeping`** | `/housekeeping/dashboard` | 1. Housekeeping Board (`/housekeeping/dashboard`)<br>2. My Cleaning Tasks (`/housekeeping/tasks`)<br>3. Maintenance Requests (`/housekeeping/maintenance`)<br>4. Profile (`/profile`) |
| **`admin`** | `/admin/dashboard` | 1. Executive Dashboard (`/admin/dashboard`)<br>2. Hotel Branches (`/admin/hotels`)<br>3. Rooms & Room Types (`/admin/rooms`)<br>4. Amenities & Services (`/admin/services`)<br>5. All Reservations (`/admin/reservations`)<br>6. Payments & Invoices (`/admin/payments`)<br>7. Housekeeping & Maintenance (`/admin/operations`)<br>8. Users & Roles (`/admin/users`)<br>9. Reviews & Loyalty (`/admin/reviews`)<br>10. Fraud Alerts & Audit Logs (`/admin/security`)<br>11. Reports & Analytics (`/admin/reports`)<br>12. Profile (`/profile`) |

## 6. Standardized JSON API Response Contract

Every Laravel controller must return responses using a shared `ApiResponse` trait with this exact JSON envelope:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 48
  }
}
```

For validation or authorization errors (`422`, `401`, `403`, `404`, `409`):

```json
{
  "success": false,
  "message": "The selected room is unavailable for the chosen dates.",
  "errors": {
    "check_in": ["Room 104 is already reserved between 2026-11-10 and 2026-11-14."]
  }
}
```

## 7. Locked Single-Root Monorepo Directory Structure

Both Laravel and React live in the **same root repository**. Laravel serves API endpoints under `/api/v1/*` and serves `resources/views/app.blade.php` as a catch-all SPA entry point (`Route::get('/{any}', fn() => view('app'))->where('any', '^(?!api).*$');`) so React Router handles all frontend pages.

```text
hotel-reservation-system/          <-- Single Monorepo Root (Laravel + React)
├── AGENT_SPECIFICATION.md         <-- Single source of truth for AI agent
├── composer.json                  <-- PHP / Laravel dependencies
├── package.json                   <-- React / MUI / Recharts / Vite dependencies
├── vite.config.js                 <-- Compiles resources/js/main.jsx with @vitejs/plugin-react
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── HotelController.php
│   │   │   ├── RoomController.php
│   │   │   ├── RoomTypeController.php
│   │   │   ├── AmenityController.php
│   │   │   ├── ServiceController.php
│   │   │   ├── ReservationController.php
│   │   │   ├── CheckInCheckoutController.php
│   │   │   ├── PaymentInvoiceController.php
│   │   │   ├── HousekeepingController.php
│   │   │   ├── MaintenanceController.php
│   │   │   ├── ReviewLoyaltyController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── SecurityAuditController.php
│   │   │   ├── ReportAnalyticsController.php
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware.php
│   │   └── Requests/
│   ├── Models/                    <-- 24 Eloquent Models matching the 24 tables
│   ├── Services/
│   │   ├── AvailabilityService.php
│   │   ├── BillingService.php
│   │   ├── LoyaltyService.php
│   │   ├── AuditLoggerService.php
│   │   └── FraudDetectionService.php
│   └── Traits/
│       └── ApiResponse.php
├── database/
│   ├── migrations/                <-- 24 migrations numbered 01 to 24
│   └── seeders/
│       └── DatabaseSeeder.php
├── routes/
│   ├── api.php                    <-- All RESTful endpoints prefixed with /api/v1
│   └── web.php                    <-- SPA fallback route returning view('app')
└── resources/
    ├── views/
    │   ├── app.blade.php          <-- Mounts <div id="root"></div> + @viteReactRefresh + @vite('resources/js/main.jsx')
    │   └── pdf/
    │       ├── invoice.blade.php
    │       ├── receipt.blade.php
    │       └── analytics_report.blade.php
    └── js/                        <-- React.js Frontend Application Root
        ├── main.jsx               <-- ReactDOM.createRoot('#root') entry point
        ├── App.jsx                <-- React Router v6 + ThemeModeProvider + AuthProvider
        ├── api/
        │   └── axiosClient.js     <-- baseURL: '/api/v1'
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.jsx
        │   │   ├── TopHeader.jsx
        │   │   └── RoleSidebar.jsx
        │   └── common/
        │       ├── StatusChip.jsx
        │       ├── KpiCard.jsx
        │       ├── ConfirmDialog.jsx
        │       ├── DataTableWrapper.jsx
        │       └── ImageUploaderPreview.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeModeContext.jsx
        ├── i18n/
        │   ├── index.js
        │   ├── en.json
        │   ├── fr.json
        │   └── rw.json
        ├── pages/
        │   ├── auth/ (LoginPage.jsx, RegisterPage.jsx, ProfilePage.jsx)
        │   ├── public/ (LandingHotelSearch.jsx, HotelDetailRooms.jsx)
        │   ├── guest/ (GuestDashboard.jsx, MyReservations.jsx, GuestPayments.jsx, GuestLoyalty.jsx, GuestReviews.jsx)
        │   ├── reception/ (ReceptionDashboard.jsx, CheckInOutPage.jsx, ServiceOrdersPage.jsx)
        │   ├── housekeeping/ (HousekeepingBoard.jsx, MaintenanceRequestsPage.jsx)
        │   └── admin/ (AdminDashboard.jsx, HotelsPage.jsx, RoomsPage.jsx, ServicesAmenitiesPage.jsx, UsersPage.jsx, SecurityFraudAuditPage.jsx, ReportsAnalyticsPage.jsx)
        └── theme/
            └── theme.js
```

## 8. Default Seed Data Specification (`DatabaseSeeder.php`)

To test all multi-branch filters and dashboards immediately, the seeder must always populate:
1. **3 Hotel Branches:**
   * **RP Karongi Lake Resort** (Location: `Karongi`, Western Province)
   * **Kigali Grand Convention Hotel** (Location: `Kigali`, Kigali City)
   * **Rubavu Waterfront Palms** (Location: `Rubavu`, Western Province)
2. **4 Default Test Accounts (Password for all: `Hotel@2026`):**
   * **Admin:** `admin@rphotels.rw` (`role: 'admin'`)
   * **Receptionist:** `reception@rphotels.rw` (`role: 'receptionist'`)
   * **Housekeeping:** `housekeeping@rphotels.rw` (`role: 'housekeeping'`)
   * **Guest:** `guest@rphotels.rw` (`role: 'guest'`)
3. **4 Standard Room Types:** `Standard Single` (cap: 1), `Deluxe Double` (cap: 2), `Executive Lakeview Suite` (cap: 3), `Presidential Family Villa` (cap: 6).
4. **8 Standard Amenities:** High-Speed Wi-Fi, Air Conditioning, Lake View Balcony, Smart TV, Mini Bar, Room Safe, Breakfast Included, Workspace Desk.

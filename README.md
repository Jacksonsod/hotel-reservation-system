# RP Hotels & Resorts Group — Enterprise Reservation & Management System

> **ITLAW701 – Advanced Web Technologies Exam Project**  
> **Rwanda Polytechnic (RP) Karongi College — Level 7 Information Technology**

An enterprise multi-branch hotel reservation, billing, front desk, housekeeping, and executive analytics management system built with **Laravel 12 (PHP 8.4)** and **React 19 (Material UI v9)** in a single-root monorepo.

---

## 🌟 Key System Capabilities

- **Multi-Branch Inventory Management:** Centralized management across Kigali, Karongi, and Rubavu properties.
- **Concurrency-Safe Availability Engine:** Anti-double-booking protection with strict date-overlap checks and pessimistic locking (`lockForUpdate()`).
- **Compliant Taxation & Billing:** Automated 18% Rwanda VAT calculation, folio itemization, loyalty discounts, and simulated Card/MoMo/Cash payments.
- **Official PDF & CSV Document Engine:** DomPDF Tax Invoices, Payment Receipts, and Executive Analytics PDF & CSV reports.
- **Reception Front Desk Workspace:** Case-insensitive confirmation code lookup, room assignment, companion guest registration, and folio settlement.
- **Housekeeping & Turnover State Machine:** Automated turnover task creation upon checkout, 1-click status progression (`dirty` $\to$ `cleaning` $\to$ `clean`), and maintenance integration.
- **Engineering & Maintenance Log:** Priority-based repair dispatch (`urgent`, `high`, `medium`, `low`) that auto-blocks rooms from inventory while under repair.
- **Loyalty Points System:** Earn 1 point per 1,000 RWF spent on completed stays; redeem points at 50 RWF discount per point.
- **Executive Analytics & Recharts Dashboards:** Real-time revenue charts, occupancy trends, room type popularity, and staff performance metrics.
- **Security & Fraud Detection Center:** Automated IP velocity and booking spam anomaly detection, audit trail logging, and account suspension.

---

## 🛠️ Technology Stack

| Component | Technology | Version / Specification |
| :--- | :--- | :--- |
| **Backend Framework** | Laravel | 12.x on PHP 8.4 |
| **Database** | MySQL / SQLite | InnoDB, 24 Tables in 3NF |
| **Authentication** | Laravel Sanctum | Bearer Token API + Role Middleware |
| **Frontend Framework** | React | 19.x with React Router v7 |
| **UI Components** | Material UI (MUI) | v9 with Dark/Light Mode & Theme Tokens |
| **Data Visualization** | Recharts | AreaChart, BarChart, Donut PieChart |
| **PDF Generation** | DomPDF | Barryvdh Laravel DomPDF Wrapper |
| **Build Tool** | Vite | 8.x with Rolldown Bundling |
| **Test Suite** | Pest PHP | 44 Feature & Unit Tests (100% Passing) |
| **Code Formatter** | Laravel Pint | Standardized Laravel Code Styling |

---

## 📋 System Requirements

Ensure your development environment meets these prerequisites:
- **PHP:** `^8.4` with extensions: `pdo`, `pdo_mysql` / `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `curl`
- **Composer:** `^2.5`
- **Node.js:** `^20.x` or `^22.x`
- **NPM:** `^10.x`

---

## 🚀 Installation & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Jacksonsod/hotel-reservation-system.git
cd hotel-reservation-system
```

### 2. Install Backend Dependencies
```bash
composer install
```

### 3. Install Frontend Dependencies
```bash
npm install
```

### 4. Environment Configuration
Copy `.env.example` to `.env` and generate the application encryption key:
```bash
cp .env.example .env
php artisan key:generate
```

Configure your database connection in `.env` (MySQL or SQLite). For SQLite:
```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database/database.sqlite
```
*(Ensure the SQLite database file exists via `touch database/database.sqlite` if using SQLite).*

### 5. Run Database Migrations & Seeders
Execute the 24 migrations and populate realistic seed data for hotels, rooms, amenities, services, and default accounts:
```bash
php artisan migrate:fresh --seed
```

### 6. Create Public Storage Link
Link the storage directory for uploaded hotel and room images:
```bash
php artisan storage:link
```

### 7. Compile Frontend Assets
Build production assets using Vite:
```bash
npm run build
```

---

## 💻 Running the Application

### Option A: Using Concurrently (Recommended)
Run both the Laravel backend server and Vite frontend dev watcher with one command:
```bash
npm run dev
```

### Option B: Running Services Separately
In Terminal 1 (Laravel API Backend):
```bash
php artisan serve
```

In Terminal 2 (Vite Frontend Watcher):
```bash
npm run dev
```

Once running, access the application in your browser at:
👉 **`http://localhost:8000`**

---

## 🔐 Default Evaluation Accounts

All pre-seeded user accounts use the unified password: **`Hotel@2026`**

| Role | Email Address | Password | Default Redirect Route |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@rphotels.rw` | `Hotel@2026` | `/admin/dashboard` |
| **Front Desk Receptionist** | `reception@rphotels.rw` | `Hotel@2026` | `/reception/dashboard` |
| **Housekeeping Staff** | `housekeeping@rphotels.rw` | `Hotel@2026` | `/housekeeping/dashboard` |
| **Registered Guest** | `guest@rphotels.rw` | `Hotel@2026` | `/guest/dashboard` |

---

## 🧪 Running Automated Tests

The application includes a comprehensive **Pest PHP feature test suite** with 44 tests covering authentication, administrative CRUD, room availability, reservation concurrency, payments, PDF downloads, front desk operations, housekeeping turnover, and executive analytics:

```bash
php artisan test
```
Or directly via Pest:
```bash
vendor/bin/pest
```

### Run Pint Code Formatter:
```bash
vendor/bin/pint --format agent
```

---

## ⏰ Automated Scheduled Commands

To dispatch automated check-in reminders for guests arriving tomorrow and check-out reminders for guests departing tomorrow:
```bash
php artisan hotel:send-reminders
```
*(This can also be triggered directly from the Executive Dashboard or Reception UI).*

---

## 📂 Project Structure Overview

```
hotel-reservation-system/
├── app/
│   ├── Console/Commands/
│   │   └── SendStayRemindersCommand.php      # Daily stay reminders automation
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php               # Login, register, profile
│   │   ├── HotelController.php              # Multi-branch properties CRUD
│   │   ├── RoomController.php               # Room inventory & image uploads
│   │   ├── ReservationController.php        # Concurrency-safe booking engine
│   │   ├── PaymentInvoiceController.php     # Payments & PDF invoices / receipts
│   │   ├── CheckInCheckoutController.php    # Front desk check-in/out & folios
│   │   ├── HousekeepingController.php       # Cleaning turnover management
│   │   ├── MaintenanceController.php        # Engineering repairs & auto-blocking
│   │   ├── ReportAnalyticsController.php    # Executive analytics, PDF & CSV export
│   │   └── SecurityAuditController.php      # Fraud triage & audit logs
│   ├── Models/                              # 24 Eloquent Models
│   └── Services/                            # Availability, Billing, Loyalty, Fraud
├── database/
│   ├── migrations/                          # 24 Sequentially Ordered Migrations
│   └── seeders/DatabaseSeeder.php           # Realistic multi-branch seed data
├── resources/
│   ├── js/
│   │   ├── components/layout/AppShell.jsx   # TopHeader, Sidebar & Role navigation
│   │   ├── context/AuthContext.jsx          # Role state & Sanctum tokens
│   │   ├── pages/
│   │   │   ├── admin/                       # Dashboard, Reports, Security, Hotels, Rooms
│   │   │   ├── reception/                   # Front Desk, Check-In/Out, Folios, Rooms Board
│   │   │   ├── housekeeping/                # Turnover Board & Maintenance Requests
│   │   │   └── guest/                       # Bookings, Payments, Loyalty & Reviews
│   │   └── theme/theme.js                   # Color tokens & RECHARTS_COLORS
│   └── views/pdf/                           # DomPDF templates (Invoice, Receipt, Analytics)
├── tests/Feature/                           # 44 End-to-end Pest Feature Tests
└── PROJECT_REPORT.md                        # Academic technical report
```

---

## 📜 License & Acknowledgements

Developed for **ITLAW701 – Advanced Web Technologies** at **RP Karongi College**.  
Built in compliance with Rwandan hospitality and tax regulations.

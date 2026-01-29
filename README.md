# Full-Stack POS & Inventory Management System

**Complete Point-of-Sale and Inventory Management System for Indian Mobile Retail**

Built with React (Vite/Tailwind), Node.js/Express, and MongoDB.

---

## ✅ Completed Features

### Backend (100% Complete)
- ✅ **Authentication & Authorization**
  - JWT-based authentication
  - Demo mode bypass (`demo/demo`)
  - OWNER2026 admin registration code
  - First-user-as-admin fail-safe
  - Role-based access control (Admin/Staff)

- ✅ **Product Management**
  - CRUD operations with role-based access
  - Image upload with multer (local file storage)
  - Smart conditional fields:
    - IMEI1/IMEI2 for phones (dual SIM)
    - Serial Number for watches/audio
  - Tax-inclusive pricing with reverse GST calculation
  - Cost price hidden from Staff users
  - Search by name, category, IMEI, or serial number

- ✅ **Invoice System**
  - Atomic invoice number generation (INV-2026-0001)
  - Flexible per-row GST dropdown (0%, 5%, 12%, 18%, 28%)
  - Manual item name/price override
  - Split payment support (Cash + UPI hybrid)
  - Credit/partial payment logic
  - Automatic customer ledger updates
  - Stock management integration

- ✅ **Financial Modules**
  - Customer ledger with Udhaar (credit) tracking
  - "Receive Payment" for debt reduction
  - Daybook with Cash vs Online breakdown (IST timezone)
  - Supplier ledger for distributors
  - Profit/Loss reports (Admin only)

- ✅ **Settings & Customization**
  - Shop configuration (name, address, GST number, bank details)
  - UPI QR code generation
  - Logo, digital signature, and background image uploads
  - Dynamic brand color theming
  - User avatar upload

### Frontend (In Progress - 40% Complete)
- ✅ **Core Setup**
  - Vite + React + Tailwind CSS configuration
  - API proxy to backend
  - Custom brand color theming with CSS variables
  - Indian Rupee formatting utilities
  - IST timezone handling with moment-timezone
  - GST calculation utilities matching backend logic
  - WhatsApp share integration

- ✅ **Context Providers**
  - AuthContext: Login/register/logout with role checking
  - ThemeContext: Dynamic brand color application
  - SettingsContext: Shop configuration management

- ✅ **Authentication Pages**
  - Login page with customizable background
  - Registration page with shop code logic
  - Glassmorphism UI design
  - Demo mode support

- ⏳ **To Be Completed**
  - Dashboard with key metrics
  - Inventory management UI
  - Advanced invoice creator
  - Customer & Supplier ledger views
  - Daybook financial summary
  - Settings panel with live PDF preview
  - PDF generation ("The Circle Studio" design)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Start backend server
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

### First Time Setup

1. **Start MongoDB** (if using local installation)
2. **Start Backend** (port 5000)
3. **Start Frontend** (port 3000)
4. **Register First User**:
   - Navigate to http://localhost:3000/register
   - First user automatically becomes **Admin**
   - Or use shop code `OWNER2026` for Admin access

5. **Demo Mode** (Testing):
   - Username: `demo`
   - Password: `demo`
   - Grants Admin access without database

---

## 📋 Key Implementation Details

### IST Timezone (CRITICAL)
- Environment variable `TZ=Asia/Kolkata` set in backend
- All MongoDB timestamps use IST
- Frontend uses `moment-timezone` for consistency
- Daybook and reports operate in IST

### GST Calculation Logic
**Tax-Inclusive (MRP-based)**:
```
MRP = ₹20,000, GST = 18%
→ Taxable Value = ₹16,949.15
→ GST Amount = ₹3,050.85
→ Total = ₹20,000
```

Formula: `Taxable = MRP / (1 + GST%/100)`

### Invoice Numbering (Atomic)
Uses MongoDB `findOneAndUpdate` with `$inc` to prevent race conditions:
- Multiple cashiers can create invoices simultaneously
- No duplicate invoice numbers
- Format: `INV-YYYY-NNNN`

### Image Storage Strategy
**Option A (Implemented)**: Local file system
- Images saved to `/backend/uploads/`
- Served as static files via Express
- Database stores file path (e.g., `/uploads/iphone13_123.jpg`)
- Better performance and scalability

### Role-Based Access
**Admin**:
- Full access to all features
- Can see cost prices and profit margins
- Access to Settings and Reports

**Staff**:
- Can create bills and manage inventory
- **Cannot see**: Cost prices, profit/loss, settings
- Limited to operational tasks

---

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mobile_pos_db
JWT_SECRET=your_secret_key_here
ADMIN_SECRET_CODE=OWNER2026
TZ=Asia/Kolkata
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (supports demo/demo)

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (Admin, with image upload)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/search/:keyword` - Search products

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List invoices (with filters)
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id/payment` - Update payment
- `DELETE /api/invoices/:id` - Delete invoice (Admin)

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/dues` - Customers with outstanding balance
- `POST /api/customers` - Create customer

### Ledger
- `GET /api/ledger/customer/:id` - Customer transaction history
- `POST /api/ledger/receive-payment` - Receive payment (reduce debt)
- `GET /api/ledger/daybook` - Daily summary (Cash/Online)
- `GET /api/ledger/profit-loss` - Profit/Loss report (Admin)

### Settings
- `GET /api/settings` - Get shop settings (Admin)
- `PUT /api/settings` - Update settings (Admin, multi-file upload)
- `POST /api/settings/generate-qr` - Generate UPI QR code
- `POST /api/settings/avatar` - Upload user avatar

---

## 🎨 Design Philosophy

- **Modern & Premium**: Glassmorphism, smooth animations, vibrant colors
- **Indian Context**: Rupee formatting, IST timezone, GST slabs
- **Mobile-First**: Responsive design for tablets and phones
- **Print-Ready**: Invoice PDF generation with "The Circle Studio" aesthetics

---

## 📝 Next Steps

1. **Complete Frontend Pages**:
   - Dashboard with sales metrics
   - Inventory list and product forms
   - Invoice creator with live calculations
   - Ledger views

2. **PDF Generation**:
   - "The Circle Studio" design implementation
   - Print and email functionality

3. **Testing**:
   - Role-based access verification
   - Invoice calculations
   - Timezone consistency

4. **Deployment**:
   - Production environment setup
   - MongoDB Atlas configuration
   - Hosting (Vercel/Railway)

---

## 🔧 Technology Stack

**Backend**:
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (File Uploads)
- QRCode (UPI QR Generation)
- Moment-Timezone (IST)

**Frontend**:
- React 18 + Vite
- Tailwind CSS
- React Router
- Axios
- React Hot Toast
- Lucide React (Icons)
- Moment-Timezone

---

## 📄 License

MIT

---

**Built with ❤️ for Indian Mobile Retail Businesses**

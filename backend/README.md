# POS & Inventory Management System - Backend

Full-Stack POS system backend built with Node.js, Express, and MongoDB for Indian Mobile Retail businesses.

## Features

- **Authentication**: JWT-based with role-based access (Admin/Staff), demo mode, OWNER2026 registration code
- **Inventory Management**: Products with smart IMEI/Serial tracking, image uploads, GST calculations
- **Invoicing**: Flexible per-row GST, split payments, atomic invoice numbering
- **Financial Tracking**: Customer/Supplier ledgers, Udhaar (credit) management, Daybook, Profit/Loss reports
- **Settings**: Brand customization, UPI QR generation, invoice templates

## Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# Create uploads directory
mkdir uploads

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mobile_pos_db
JWT_SECRET=your_secret_key
ADMIN_SECRET_CODE=OWNER2026
TZ=Asia/Kolkata
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (supports demo/demo)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/search/:keyword` - Search products

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id/payment` - Update payment
- `DELETE /api/invoices/:id` - Delete invoice (Admin)

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/dues` - Get customers with outstanding balance
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Suppliers (Admin only)
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier

### Ledger
- `GET /api/ledger/customer/:id` - Get customer ledger
- `POST /api/ledger/receive-payment` - Receive payment from customer
- `GET /api/ledger/daybook` - Get daybook summary
- `GET /api/ledger/profit-loss` - Get profit/loss report (Admin)

### Settings (Admin only)
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/generate-qr` - Generate UPI QR code
- `POST /api/settings/avatar` - Upload user avatar

## IST Timezone

All timestamps are stored and returned in Indian Standard Time (IST/Asia/Kolkata). The `TZ` environment variable is set to `Asia/Kolkata`.

## License

MIT

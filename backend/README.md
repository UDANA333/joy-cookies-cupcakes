# Joy Cookies & Cupcakes - Backend API

Node.js + Express backend for the Joy Cookies & Cupcakes bakery website.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Language**: TypeScript
- **Email**: Resend
- **Auth**: JWT (jsonwebtoken) + bcryptjs

## Features

- 🛒 **Order Management**: Create, view, update order status
- 📧 **Email Notifications**: Order confirmation to customers, new order alerts to business
- 📬 **Contact Form**: Store and notify on contact submissions
- 🔐 **Admin Dashboard**: JWT-authenticated admin panel
- 🛡️ **Security**: Rate limiting, CORS, Helmet headers, input validation

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Initialize database and create admin user
npm run db:seed

# Start development server
npm run dev
```

The server will start at `http://localhost:3001`.

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | ⚠️ Change in production! |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `RESEND_API_KEY` | Resend.com API key | - |
| `BUSINESS_EMAIL` | Email for notifications | `joycookiescupcakes@gmail.com` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `ADMIN_EMAIL` | Initial admin email | `admin@joycookiescupcakes.com` |
| `ADMIN_PASSWORD` | Initial admin password | ⚠️ Change after setup! |

## API Endpoints

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/orders` | Create new order |
| `GET` | `/api/orders/:orderNumber` | Get order by number |
| `POST` | `/api/contact` | Submit contact form |
| `GET` | `/health` | Health check |

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Admin login |
| `GET` | `/api/auth/verify` | Verify JWT token |

### Admin Endpoints (Requires JWT)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/orders` | List all orders |
| `GET` | `/api/admin/orders/:id` | Get order details |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status |
| `PATCH` | `/api/admin/orders/:id/paid` | Toggle payment status |
| `DELETE` | `/api/admin/orders/:id` | Delete order |
| `GET` | `/api/admin/stats` | Get dashboard stats |
| `GET` | `/api/admin/messages` | List contact messages |
| `PATCH` | `/api/admin/messages/:id/read` | Mark message as read |
| `DELETE` | `/api/admin/messages/:id` | Delete message |

## Database Schema

### `admins`
- `id` (UUID)
- `email` (unique)
- `password_hash`
- `name`
- `created_at`

### `orders`
- `id` (UUID)
- `order_number` (e.g., JOY-ABC123)
- `customer_name`, `customer_email`, `customer_phone`
- `pickup_date`, `pickup_time`
- `items` (JSON)
- `subtotal`, `total`
- `order_status` (pending/confirmed/ready/completed/cancelled)
- `payment_status` (pending/paid)
- `created_at`, `updated_at`

### `contact_messages`
- `id` (UUID)
- `name`, `email`, `message`
- `is_read`
- `created_at`

## Deployment (Hostinger)

### Option 1: VPS/Cloud Hosting

1. SSH into your server
2. Install Node.js 18+
3. Clone repository
4. Install dependencies: `npm install --production`
5. Build: `npm run build`
6. Set environment variables
7. Run with PM2: `pm2 start dist/index.js --name joy-backend`

### Option 2: Node.js Hosting

1. Upload files via File Manager or Git
2. Set Node.js version to 18+
3. Configure environment variables in hosting panel
4. Set entry point to `dist/index.js`
5. Run build command: `npm run build`

### Email Setup

1. Sign up at [Resend.com](https://resend.com)
2. Verify your domain or use a verified email
3. Get API key and add to `.env`
4. Update `FROM_EMAIL` in `src/services/email.ts` to your verified domain

## Security Notes

⚠️ **Before deploying to production:**

1. Generate a strong `JWT_SECRET` (32+ random characters)
2. Change the default admin password immediately
3. Set `NODE_ENV=production`
4. Use HTTPS in production
5. Update `FRONTEND_URL` to your production frontend domain
6. Consider adding additional rate limiting for your traffic

## Development Commands

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm start          # Start production server
npm run db:seed    # Seed database with admin user
```

## License

Private - Joy Cookies & Cupcakes

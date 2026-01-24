# Joy Cookies & Cupcakes - Deployment Guide

Complete guide for deploying the bakery website to Hostinger.

## Project Structure

```
joy-cookies/
├── frontend/          # React + Vite frontend
│   ├── dist/          # Built static files (after npm run build)
│   └── ...
├── backend/           # Node.js + Express API
│   ├── dist/          # Built JS files (after npm run build)
│   ├── data/          # SQLite database (auto-created)
│   └── ...
└── assets/            # Original product images
```

## Option 1: Hostinger Web Hosting (Recommended for Frontend)

### Frontend Deployment

1. **Build the frontend locally:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Upload to Hostinger:**
   - Log into Hostinger hPanel
   - Go to **File Manager** → `public_html`
   - Delete existing files (keep `.htaccess` if any)
   - Upload all files from `frontend/dist/`
   - Upload the `assets` folder (product images)

3. **Create `.htaccess` for SPA routing:**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Backend Deployment (Hostinger VPS required)

Hostinger's shared hosting doesn't support Node.js. You need:
- **Hostinger VPS** (recommended), or
- **External API hosting** (Railway, Render, Fly.io)

#### VPS Setup:

1. **SSH into VPS:**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2 (process manager):**
   ```bash
   sudo npm install -g pm2
   ```

4. **Upload backend files:**
   ```bash
   # Via SCP or Git
   scp -r backend/ user@your-vps-ip:~/joy-cookies-backend/
   ```

5. **Install and build:**
   ```bash
   cd ~/joy-cookies-backend
   npm install
   npm run build
   ```

6. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   # Set production values:
   # NODE_ENV=production
   # JWT_SECRET=your-secure-secret-here
   # RESEND_API_KEY=re_xxxx
   # FRONTEND_URL=https://your-domain.com
   ```

7. **Initialize database:**
   ```bash
   npm run db:seed
   ```

8. **Start with PM2:**
   ```bash
   pm2 start dist/index.js --name joy-backend
   pm2 save
   pm2 startup
   ```

9. **Set up Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name api.your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

10. **Enable SSL with Certbot:**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d api.your-domain.com
    ```

## Option 2: Railway/Render (Easier Backend Hosting)

### Railway Deployment

1. **Sign up at [Railway.app](https://railway.app)**

2. **Connect GitHub repository**

3. **Add environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-secret`
   - `RESEND_API_KEY=re_xxxx`
   - `FRONTEND_URL=https://your-domain.com`
   - `BUSINESS_EMAIL=joycookiescupcakes@gmail.com`

4. **Deploy** (automatic from GitHub)

5. **Update frontend `.env`:**
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```

## Email Setup (Resend)

1. **Sign up at [Resend.com](https://resend.com)**

2. **Add and verify your domain:**
   - Go to **Domains** → **Add Domain**
   - Add DNS records to your Hostinger DNS settings
   - Wait for verification

3. **Create API key:**
   - Go to **API Keys** → **Create API Key**
   - Copy and add to backend `.env`

4. **Update email sender:**
   - In `backend/src/services/email.ts`
   - Change `FROM_EMAIL` to use your verified domain

## Venmo QR Code Setup

1. **Get QR code from client:**
   - They can generate from Venmo app → Settings → QR Code

2. **Save as image:**
   - Save to `frontend/public/venmo-qr.png`

3. **Update Payment page:**
   - In `frontend/src/pages/Payment.tsx`
   - Change `VENMO_QR_PLACEHOLDER` to `/venmo-qr.png`

## Admin Dashboard Access

- URL: `https://your-domain.com/admin`
- Default login: `admin@joycookiescupcakes.com` / `JoyCookies2024!`
- **⚠️ Change password after first login!**

## DNS Configuration

### For main domain:
```
Type    Name    Value
A       @       [Your Hostinger IP]
A       www     [Your Hostinger IP]
```

### For API subdomain (if using VPS):
```
Type    Name    Value
A       api     [Your VPS IP]
```

## Production Checklist

- [ ] Frontend built and uploaded
- [ ] `.htaccess` created for SPA routing
- [ ] Backend deployed and running
- [ ] Environment variables set (especially `JWT_SECRET`)
- [ ] Database seeded with admin user
- [ ] SSL certificates installed
- [ ] Resend API configured
- [ ] Venmo QR code added
- [ ] Admin password changed
- [ ] Test order flow end-to-end
- [ ] Test email delivery

## Monitoring

### PM2 Commands (VPS):
```bash
pm2 status          # Check status
pm2 logs joy-backend  # View logs
pm2 restart joy-backend  # Restart
pm2 monit           # Real-time monitoring
```

### Database Backup:
```bash
# Copy SQLite database
cp data/database.sqlite data/backup-$(date +%Y%m%d).sqlite
```

## Troubleshooting

**Orders not saving?**
- Check backend logs: `pm2 logs joy-backend`
- Verify database exists: `ls -la data/`

**Emails not sending?**
- Verify Resend API key
- Check domain verification status
- Check Resend dashboard for errors

**CORS errors?**
- Update `FRONTEND_URL` in backend `.env`
- Restart backend: `pm2 restart joy-backend`

**Admin login not working?**
- Run `npm run db:seed` to create admin
- Check `.env` for correct admin credentials

## Support

For technical issues, contact the developer.

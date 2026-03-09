# 🏪 Kapurthala Online — Local Vendor Directory

A full-stack web application to discover and connect with local vendors in **Kapurthala, Punjab, India**.

Built as an investor-ready startup prototype.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI if using Atlas
```

### 3. Seed the Database
```bash
cd backend
node seed.js
```

### 4. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Open the App
Visit: **http://localhost:5000**

---

## 📁 Project Structure

```
kapurthala-online/
├── frontend/                    # Static frontend (served by Express)
│   ├── index.html               # Main SPA with all pages
│   ├── style.css                # Design system & component styles
│   ├── app-extras.css           # Skeleton loading, badges
│   ├── app.js                   # Core app logic (API-connected)
│   ├── admin.js                 # Admin dashboard (JWT-authenticated)
│   └── vendors.js               # Default vendor data (fallback)
│
└── backend/                     # Node.js/Express/MongoDB API
    ├── server.js                # Express app entry point
    ├── seed.js                  # Database seeder
    ├── .env.example             # Environment variable template
    ├── package.json
    ├── models/
    │   └── Vendor.js            # Mongoose schema
    ├── controllers/
    │   └── vendorController.js  # CRUD logic
    ├── routes/
    │   ├── vendors.js           # Vendor API routes
    │   └── auth.js              # Admin auth routes
    └── middleware/
        └── auth.js              # JWT middleware
```

---

## 🔌 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List vendors (filter, search, paginate) |
| GET | `/api/vendors/:id` | Get single vendor |
| GET | `/api/health` | Server health check |

### Query Parameters for GET /api/vendors
| Param | Type | Example |
|-------|------|---------|
| `category` | string | `?category=grocery` |
| `search` | string | `?search=sharma` |
| `featured` | boolean | `?featured=true` |
| `page` | number | `?page=2` |
| `limit` | number | `?limit=10` |

### Admin (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login → returns JWT |
| GET | `/api/auth/verify` | Verify JWT token |
| GET | `/api/vendors/stats` | Dashboard stats |
| POST | `/api/vendors` | Create vendor |
| PUT | `/api/vendors/:id` | Update vendor |
| DELETE | `/api/vendors/:id` | Soft-delete vendor |
| POST | `/api/vendors/bulk` | Bulk import |

---

## 🔐 Admin Login

**URL:** http://localhost:5000 → click 🔐 Admin button

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `kapurthala2024` |

---

## 🏪 Vendor Categories

| Slug | Label |
|------|-------|
| grocery | 🛒 Grocery |
| electronics | 📱 Electronics |
| clothing | 👗 Clothing |
| restaurant | 🍛 Restaurant |
| services | 🛠️ Services |
| medical | 💊 Medical |
| hardware | 🔩 Hardware |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment |
| `MONGODB_URI` | localhost/kapurthala_online | MongoDB connection |
| `JWT_SECRET` | (change in prod!) | JWT signing key |
| `ADMIN_USERNAME` | admin | Admin username |
| `ADMIN_PASSWORD` | kapurthala2024 | Admin password |

---

## 🌐 Pages

| Page | Description |
|------|-------------|
| **Home** | Hero, stats, featured vendors, CTA |
| **Directory** | All vendors with search & category filters |
| **Register** | Vendor registration form |
| **About Kapurthala** | City heritage, monuments, timeline |
| **Contact** | Contact form and info |
| **Admin** | Dashboard, vendor CRUD, analytics |

---

## 📱 Features

- ✅ **Vendor Directory** — searchable, filterable vendor cards
- ✅ **WhatsApp Integration** — direct chat links for each vendor
- ✅ **Google Maps Links** — per-vendor location links
- ✅ **Admin Dashboard** — full CRUD via authenticated API
- ✅ **JWT Authentication** — secure admin access
- ✅ **Offline Fallback** — works without backend using bundled data
- ✅ **Responsive Design** — mobile, tablet, and desktop
- ✅ **Dark Mode** — persistent theme toggle
- ✅ **Micro-Analytics** — page view tracking
- ✅ **Rate Limiting** — 200 requests/15 min per IP
- ✅ **Soft Delete** — vendors are deactivated, not hard-deleted

---

## 🚀 Deploy to Production

### MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Set `MONGODB_URI` in `.env` to your Atlas connection string

### Render.com (Free Hosting)
1. Push to GitHub
2. Create new Web Service on Render
3. Set root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env`

---

## 🤝 Investor Demo Notes

- **Problem**: Local vendors in Kapurthala have no digital presence
- **Solution**: Free, verified vendor directory with direct customer connections
- **Market**: 2 lakh+ population, 100+ local businesses, growing digital adoption
- **Model**: Nonprofit/community-first (monetization via premium listings & ads planned)
- **Tech Stack**: Node.js, Express, MongoDB, Vanilla JS — simple, scalable, cheap to run

---

*Made with ❤️ for Kapurthala, Punjab*

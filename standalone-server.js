/**
 * Kapurthala Online — Standalone Server (zero dependencies)
 * Uses only Node.js built-in modules. No npm install needed.
 * Vendor data lives in memory; full CRUD via REST API.
 * Admin auth: simple token (no JWT lib needed).
 * Run: node standalone-server.js
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const crypto = require('crypto');

const PORT          = 5000;
const FRONTEND_PATH = path.join(__dirname, 'frontend');
const ADMIN_USER    = 'admin';
const ADMIN_PASS    = 'kapurthala2024';

/* ─── In-Memory Vendor Store ───────────────────────── */
let vendors = [
  { _id: '1', id: 1, name: 'Sharma Kirana Store', owner: 'Rajesh Sharma', phone: '9876543210', whatsapp: '919876543210', address: 'Main Market, Near Clock Tower, Kapurthala', category: 'grocery', description: 'Your neighbourhood kirana store since 1985. We stock fresh daily essentials, pulses, spices, snacks, and dairy products. Home delivery available within 3 km.', rating: 4.7, since: 1985, timings: 'Mon–Sun: 7 am – 9 pm', tags: ['Home Delivery', 'Daily Essentials', 'Bulk Orders'], featured: true, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Main+Market', views: 0, isActive: true },
  { _id: '2', id: 2, name: 'Guru Nanak Provision Store', owner: 'Harminder Singh', phone: '9812345678', whatsapp: '919812345678', address: 'Railway Road, Near Bus Stand, Kapurthala', category: 'grocery', description: 'Premium grocery store with over 2,000 products including imported goods. Specialising in organic produce and health foods. Monthly ration packages at discounted rates.', rating: 4.5, since: 1998, timings: 'Mon–Sat: 8 am – 8:30 pm', tags: ['Organic', 'Health Foods', 'Monthly Packages'], featured: false, image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Railway+Road', views: 0, isActive: true },
  { _id: '3', id: 3, name: 'Fresh Valley General Store', owner: 'Sukhwinder Kaur', phone: '9988112233', whatsapp: '919988112233', address: 'Civil Lines, Sultanpur Road, Kapurthala', category: 'grocery', description: 'Supermarket experience with local warmth. We carry fresh fruits, vegetables, grains, and imported goods. First in Kapurthala to introduce eco-friendly packaging.', rating: 4.6, since: 2010, timings: 'Mon–Sun: 8 am – 9 pm', tags: ['Eco-Friendly', 'Fresh Produce', 'Imported Goods'], featured: false, image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Lines', views: 0, isActive: true },
  { _id: '4', id: 4, name: 'Sharma Electronics', owner: 'Rajiv Sharma', phone: '9988712345', whatsapp: '919988712345', address: 'Civil Lines, Near Jagatjit Palace, Kapurthala', category: 'electronics', description: 'Authorised dealer for Samsung, LG, and Sony. We sell mobile phones, TVs, refrigerators, and home appliances. Expert repair services with a 90-day warranty on all repairs.', rating: 4.6, since: 2005, timings: 'Mon–Sat: 10 am – 8 pm', tags: ['Authorised Dealer', 'Repairs', '90-Day Warranty'], featured: true, image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Lines', views: 0, isActive: true },
  { _id: '5', id: 5, name: 'Digital Point Mobile Store', owner: 'Manpreet Singh', phone: '9876001122', whatsapp: '919876001122', address: 'Kanjli Road, Kapurthala', category: 'electronics', description: 'All major mobile brands — iPhone, Samsung, Xiaomi, Realme, and Vivo. Genuine accessories, screen repairs, and battery replacements. Trade-in your old phone for a new one.', rating: 4.4, since: 2015, timings: 'Mon–Sun: 10 am – 9 pm', tags: ['All Brands', 'Screen Repair', 'Trade-In'], featured: false, image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Kanjli+Road', views: 0, isActive: true },
  { _id: '6', id: 6, name: 'Punjab Computer Centre', owner: 'Gurpreet Kaur', phone: '9988556677', whatsapp: '919988556677', address: 'Bus Stand Market, Kapurthala', category: 'electronics', description: 'Laptops, desktops, printers, and IT accessories. Computer repair, data recovery, and networking services. Best prices for schools, colleges, and small businesses.', rating: 4.3, since: 2003, timings: 'Mon–Sat: 9 am – 7 pm', tags: ['Laptops', 'Repairs', 'Business IT'], featured: false, image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Bus+Stand', views: 0, isActive: true },
  { _id: '7', id: 7, name: 'Royal Threads Boutique', owner: 'Simran Kaur', phone: '9988334455', whatsapp: '919988334455', address: 'Phagwara Road, Near Gurudwara, Kapurthala', category: 'clothing', description: 'Premium ethnic and fusion wear for women. Specialising in designer salwar suits, lehengas, and bridal collections. Custom stitching available with 5-day delivery. Phulkari embroidery our speciality.', rating: 4.8, since: 2012, timings: 'Mon–Sat: 10 am – 8 pm', tags: ['Bridal', 'Custom Stitching', 'Phulkari'], featured: true, image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Phagwara+Road', views: 0, isActive: true },
  { _id: '8', id: 8, name: 'Trends Fashion Hub', owner: 'Arjun Mehra', phone: '9876556677', whatsapp: '919876556677', address: 'Main Bazar, Kapurthala', category: 'clothing', description: 'Latest Western and Indian casual wear for men and women. Branded jeans, t-shirts, jackets, and sportswear. New collection every month. Student discounts available on ID.', rating: 4.3, since: 2018, timings: 'Mon–Sun: 10 am – 9 pm', tags: ['Western Wear', 'Student Discount', 'New Arrivals'], featured: false, image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Main+Bazar', views: 0, isActive: true },
  { _id: '9', id: 9, name: "Classic Men's Wear", owner: 'Balwinder Singh', phone: '9876123456', whatsapp: '919876123456', address: 'Near Court, Civil Lines, Kapurthala', category: 'clothing', description: 'Formal and casual menswear since 1990. Suits, sherwanis, kurtas, and everyday wear. Master tailor on site for custom fitting. Trusted by government officials and professionals.', rating: 4.5, since: 1990, timings: 'Mon–Sat: 9:30 am – 8 pm', tags: ['Tailoring', 'Formal Wear', 'Sherwani'], featured: false, image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Lines+Court', views: 0, isActive: true },
  { _id: '10', id: 10, name: 'Punjabi Rasoi', owner: 'Amarjit Singh', phone: '9988001122', whatsapp: '919988001122', address: 'GT Road, Near Highway, Kapurthala', category: 'restaurant', description: 'Authentic Punjabi home-style cooking. Famous for our Sarson da Saag, Makki di Roti, Amritsari Kulcha, and Lassi. Family restaurant since 1988. Catering for events and parties available.', rating: 4.9, since: 1988, timings: 'Mon–Sun: 8 am – 11 pm', tags: ['Authentic Punjabi', 'Catering', 'Family Dine-In'], featured: true, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+GT+Road', views: 0, isActive: true },
  { _id: '11', id: 11, name: 'Kapurthala Sweets & Snacks', owner: 'Vijay Kumar', phone: '9876445566', whatsapp: '919876445566', address: 'Main Market, Clock Tower Chowk, Kapurthala', category: 'restaurant', description: 'Famous for fresh mithai, namkeen, and chaat. Our Pinni, Barfi, and Gur-wali Kheer are city legends. Festival gift boxes available. Daily fresh batches from 7 am.', rating: 4.7, since: 1975, timings: 'Mon–Sun: 7 am – 10 pm', tags: ['Mithai', 'Chaat', 'Gift Boxes'], featured: true, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Clock+Tower', views: 0, isActive: true },
  { _id: '12', id: 12, name: 'Zaffran Multi-Cuisine', owner: 'Harpreet Kaur', phone: '9855667788', whatsapp: '919855667788', address: 'Sultanpur Road, Near City Mall, Kapurthala', category: 'restaurant', description: 'Modern restaurant serving North Indian, Chinese, and Continental cuisine. AC dining hall for 80 guests. Zomato & Swiggy partner for home delivery. Special Sunday brunch buffet.', rating: 4.4, since: 2017, timings: 'Mon–Sun: 12 pm – 11 pm', tags: ['Multi-Cuisine', 'Home Delivery', 'Buffet'], featured: false, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Sultanpur+Road', views: 0, isActive: true },
  { _id: '13', id: 13, name: 'Singh Auto Repair', owner: 'Gurjit Singh', phone: '9877001122', whatsapp: '919877001122', address: 'Workshop Area, Near Bus Depot, Kapurthala', category: 'services', description: 'Full-service automobile workshop for cars and two-wheelers. Engine overhaul, AC service, denting & painting, and periodic maintenance. 20+ years of experience. Insurance tie-up.', rating: 4.6, since: 2002, timings: 'Mon–Sat: 8 am – 7 pm', tags: ['Insurance Claims', 'AC Service', 'All Brands'], featured: false, image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Bus+Depot', views: 0, isActive: true },
  { _id: '14', id: 14, name: 'Kapurthala Beauty Studio', owner: 'Navneet Kaur', phone: '9866223344', whatsapp: '919866223344', address: 'Green Park Colony, Kapurthala', category: 'services', description: 'Full-service ladies beauty parlour. Bridal packages, mehndi, hair treatments, facials, and waxing. Advance booking recommended. Home service available for special occasions.', rating: 4.7, since: 2014, timings: 'Tue–Sun: 9 am – 7 pm | Mon: Closed', tags: ['Bridal Package', 'Home Service', 'Mehndi'], featured: false, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Green+Park', views: 0, isActive: true },
  { _id: '15', id: 15, name: 'Life Care Pharmacy', owner: 'Dr. Anjali Mehta', phone: '9877334455', whatsapp: '919877334455', address: 'Hospital Road, Near Civil Hospital, Kapurthala', category: 'medical', description: 'Licensed pharmacy with over 5,000 medicines in stock. Prescription medicines, OTC drugs, and medical equipment. 24/7 emergency availability. Free home delivery for senior citizens.', rating: 4.8, since: 2008, timings: 'Open 24 hours, 7 days a week', tags: ['24/7', 'Home Delivery', 'Senior Citizen Discount'], featured: true, image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Hospital', views: 0, isActive: true },
  { _id: '16', id: 16, name: 'Wellness Diagnostic Centre', owner: 'Dr. Sandeep Arora', phone: '9855112233', whatsapp: '919855112233', address: 'Phagwara Road, Kapurthala', category: 'medical', description: 'Modern pathology lab with NABL-certified testing. Blood tests, X-ray, ECG, ultrasound, and full-body health checkups. Reports in 4 hours. Home sample collection available.', rating: 4.6, since: 2011, timings: 'Mon–Sat: 7 am – 8 pm | Sun: 7 am – 2 pm', tags: ['NABL Certified', 'Home Sample Collection', 'Fast Reports'], featured: false, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Phagwara+Road', views: 0, isActive: true },
  { _id: '17', id: 17, name: 'Kapurthala Hardware Mart', owner: 'Suresh Kumar', phone: '9876778899', whatsapp: '919876778899', address: 'Industrial Area, GT Road, Kapurthala', category: 'hardware', description: 'Complete hardware solutions — building materials, electrical supplies, plumbing fittings, tools, and paints. Trusted by contractors and homeowners since 1980. Bulk discounts for construction projects.', rating: 4.4, since: 1980, timings: 'Mon–Sat: 8 am – 7 pm', tags: ['Building Materials', 'Bulk Discount', 'Construction'], featured: false, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&auto=format', mapLink: 'https://maps.google.com/?q=Kapurthala+Industrial+Area', views: 0, isActive: true },
];

let nextId = vendors.length + 1;

/* ─── Simple Token Store ───────────────────────────── */
const activeSessions = new Set();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isValidToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  return token && activeSessions.has(token);
}

/* ─── MIME Types ───────────────────────────────────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

/* ─── JSON helpers ──────────────────────────────────── */
function jsonRes(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/* ─── Vendor Filtering ──────────────────────────────── */
function filterVendors(query) {
  let result = vendors.filter(v => v.isActive);
  if (query.category && query.category !== 'all') result = result.filter(v => v.category === query.category);
  if (query.featured === 'true') result = result.filter(v => v.featured);
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(v => ['name','owner','description','address','category']
      .some(f => (v[f] || '').toLowerCase().includes(q)));
  }
  const limit = Math.min(parseInt(query.limit) || 100, 200);
  const page  = Math.max(parseInt(query.page) || 1, 1);
  const total = result.length;
  result = result.slice((page - 1) * limit, page * limit);
  return { data: result, total, page, limit, pages: Math.ceil(total / limit) };
}

/* ─── Parse query string ────────────────────────────── */
function parseQuery(url) {
  const q = {};
  const idx = url.indexOf('?');
  if (idx === -1) return q;
  url.slice(idx + 1).split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) q[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return q;
}

function parsePath(url) {
  return url.split('?')[0].replace(/\/$/, '') || '/';
}

/* ─── Route Handler ─────────────────────────────────── */
async function handleRequest(req, res) {
  const path_ = parsePath(req.url);
  const query  = parseQuery(req.url);
  const method = req.method.toUpperCase();

  /* CORS preflight */
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
    return res.end();
  }

  /* ── AUTH ── */
  if (path_ === '/api/auth/login' && method === 'POST') {
    const body = await readBody(req);
    if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
      const token = generateToken();
      activeSessions.add(token);
      return jsonRes(res, { success: true, token, expiresIn: '8h', user: { username: 'admin', role: 'admin' } });
    }
    return jsonRes(res, { success: false, message: 'Invalid credentials.' }, 401);
  }

  if (path_ === '/api/auth/verify' && method === 'GET') {
    if (!isValidToken(req)) return jsonRes(res, { success: false, message: 'Unauthorized' }, 401);
    return jsonRes(res, { success: true, user: { username: 'admin', role: 'admin' } });
  }

  /* ── HEALTH ── */
  if (path_ === '/api/health') {
    return jsonRes(res, { success: true, status: 'healthy', db: 'in-memory', vendors: vendors.filter(v=>v.isActive).length, uptime: Math.floor(process.uptime()) + 's' });
  }

  /* ── VENDORS ── */
  if (path_ === '/api/vendors') {
    if (method === 'GET') {
      const { data, total, page, limit, pages } = filterVendors(query);
      const byCategory = {};
      vendors.filter(v=>v.isActive).forEach(v => { byCategory[v.category] = (byCategory[v.category]||0)+1; });
      return jsonRes(res, { success: true, pagination: { total, page, limit, pages }, categoryStats: Object.entries(byCategory).map(([_id,count])=>({_id,count})), data });
    }
    if (method === 'POST') {
      if (!isValidToken(req)) return jsonRes(res, { success: false, message: 'Unauthorized' }, 401);
      const body = await readBody(req);
      if (!body.name || !body.phone || !body.category) return jsonRes(res, { success: false, message: 'name, phone, and category are required' }, 422);
      const id = String(nextId++);
      const vendor = { _id: id, id: parseInt(id), views: 0, isActive: true, rating: body.rating || 4.0, tags: body.tags || [], ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      vendors.push(vendor);
      return jsonRes(res, { success: true, data: vendor }, 201);
    }
  }

  if (path_ === '/api/vendors/stats') {
    if (!isValidToken(req)) return jsonRes(res, { success: false, message: 'Unauthorized' }, 401);
    const active = vendors.filter(v=>v.isActive);
    const byCategory = {};
    active.forEach(v => { byCategory[v.category] = (byCategory[v.category]||{ _id: v.category, count: 0, avgRating: 0 }); byCategory[v.category].count++; });
    return jsonRes(res, { success: true, data: { total: active.length, featured: active.filter(v=>v.featured).length, categories: Object.keys(byCategory).length, byCategory: Object.values(byCategory), topViewed: [...active].sort((a,b)=>b.views-a.views).slice(0,5).map(v=>({name:v.name,views:v.views,category:v.category})) } });
  }

  if (path_ === '/api/vendors/bulk') {
    if (!isValidToken(req)) return jsonRes(res, { success: false, message: 'Unauthorized' }, 401);
    if (method === 'POST') {
      const body = await readBody(req);
      if (!Array.isArray(body.vendors)) return jsonRes(res, { success: false, message: 'vendors array required' }, 400);
      body.vendors.forEach(v => { v._id = String(nextId++); v.id = parseInt(v._id); v.isActive = true; vendors.push(v); });
      return jsonRes(res, { success: true, data: { inserted: body.vendors.length } }, 201);
    }
  }

  /* /api/vendors/:id */
  const vendorMatch = path_.match(/^\/api\/vendors\/([^/]+)$/);
  if (vendorMatch) {
    const vid = vendorMatch[1];
    const idx = vendors.findIndex(v => v._id === vid || String(v.id) === vid);

    if (method === 'GET') {
      if (idx === -1 || !vendors[idx].isActive) return jsonRes(res, { success: false, message: 'Vendor not found' }, 404);
      vendors[idx].views = (vendors[idx].views || 0) + 1;
      return jsonRes(res, { success: true, data: vendors[idx] });
    }

    if (method === 'PUT') {
      if (!isValidToken(req)) return jsonRes(res, { success: false, message: 'Unauthorized' }, 401);
      if (idx === -1) return jsonRes(res, { success: false, message: 'Vendor not found' }, 404);
      const body = await readBody(req);
      delete body.views; delete body.createdAt;
      vendors[idx] = { ...vendors[idx], ...body, updatedAt: new Date().toISOString() };
      return jsonRes(res, { success: true, data: vendors[idx] });
    }

    if (method === 'DELETE') {
      if (!isValidToken(req)) return jsonRes(res, { success: false, message: 'Unauthorized' }, 401);
      if (idx === -1) return jsonRes(res, { success: false, message: 'Vendor not found' }, 404);
      vendors[idx].isActive = false;
      return jsonRes(res, { success: true, data: { message: 'Vendor deleted', id: vid } });
    }
  }

  /* ── Static Files ── */
  if (!path_.startsWith('/api')) {
    let filePath = path.join(FRONTEND_PATH, path_ === '/' ? 'index.html' : path_);
    if (!fs.existsSync(filePath)) filePath = path.join(FRONTEND_PATH, 'index.html');
    const ext = path.extname(filePath);
    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  jsonRes(res, { success: false, message: 'Not found' }, 404);
}

/* ─── Start Server ─────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    console.error('[Error]', err.message);
    jsonRes(res, { success: false, message: 'Internal server error' }, 500);
  }
});

function startKeepAlive() { const SITE_URL = process.env.RENDER_EXTERNAL_URL || null; if (!SITE_URL) return; setInterval(() => { const mod = require("https"); mod.get(SITE_URL + "/api/health", () => {}).on("error", () => {}); }, 10 * 60 * 1000); console.log("[Keep-Alive] Pinging every 10 min"); }`nserver.listen(PORT, () => { startKeepAlive();
  console.log('');
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│   🏪  Kapurthala Online — Server Running!     │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│  🌐  http://localhost:${PORT}                    │`);
  console.log(`│  🔗  API:    /api/vendors                      │`);
  console.log(`│  💊  Health: /api/health                       │`);
  console.log(`│  📦  Mode:   In-Memory (no MongoDB needed)     │`);
  console.log(`│  🔐  Admin:  admin / kapurthala2024            │`);
  console.log('└──────────────────────────────────────────────┘');
  console.log('');
});

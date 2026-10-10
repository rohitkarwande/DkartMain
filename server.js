const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const engagementRoutes = require('./routes/engagementRoutes');
const dealRoutes = require('./routes/dealRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const legalRoutes = require('./routes/legalRoutes');
const healthRoutes = require('./routes/healthRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const featureFlagRoutes = require('./routes/featureFlagRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const db = require('./config/db');
require('./cron_jobs'); // Initialize cron jobs

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.set('trust proxy', 1); // Trust first proxy (Nginx) for correct rate limiting IP
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // Serve uploads

// SEO Endpoints (Robots.txt & Dynamic Sitemap.xml)
app.get('/robots.txt', (req, res) => {
  const host = req.get('host');
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /about
Allow: /search
Allow: /equipment/
Disallow: /login
Disallow: /signup
Disallow: /kyc
Disallow: /dashboard/
Disallow: /admin/
Disallow: /secret-admin-portal
Disallow: /sell
Disallow: /edit/

Sitemap: ${baseUrl}/sitemap.xml
`);
});

app.get('/sitemap.xml', async (req, res) => {
  const host = req.get('host');
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  try {
    // Query active equipment listings
    const { rows } = await db.query(
      "SELECT id, updated_at FROM equipment_posts WHERE status = 'Active' ORDER BY updated_at DESC"
    );

    // Date formatter helper
    const formatDate = (date) => {
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return new Date().toISOString().split('T')[0];
      }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>2026-08-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>`;

    rows.forEach(post => {
      const lastmod = formatDate(post.updated_at);
      xml += `
  <url>
    <loc>${baseUrl}/equipment/${post.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    const todayStr = new Date().toISOString().split('T')[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>2026-08-30</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  }
});

app.use(express.static(path.join(__dirname, 'frontend/dist'))); // Serve React app
app.use(apiLimiter); // Apply global rate limiter

// Make io accessible to routes if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Note: Should probably be 'users' to match REST conventions, but keeping existing 'user' for now.
app.use('/api/equipment', equipmentRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/feature-flags', featureFlagRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/contact', contactRoutes);
  app.use('/health', healthRoutes);

// React router catch-all route
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// Initialize Socket.IO handlers
require('./sockets/chatSocket')(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

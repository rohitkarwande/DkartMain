const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
-- 1. Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT FALSE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial feature flag
INSERT INTO feature_flags (key, is_enabled, name, description)
VALUES ('enable_hero_carousel', TRUE, 'Landing Page Hero Carousel', 'Enables dynamic auto-sliding medical equipment hero carousel on the homepage')
ON CONFLICT (key) DO NOTHING;

-- 2. Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    badge_text VARCHAR(100) DEFAULT 'Featured Equipment',
    image_url TEXT NOT NULL,
    link_url VARCHAR(255) DEFAULT '/search',
    button_text VARCHAR(100) DEFAULT 'Explore Now',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed default curated medical equipment banners if not existing
INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active)
SELECT 
  'Advanced 1.5T & 3.0T MRI Scanners',
  'Verified high-performance magnetic resonance imaging systems from GE, Siemens & Philips with complete service history.',
  'Premium Imaging',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1600',
  '/search?category=MRI',
  'Browse MRI Systems',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'Advanced 1.5T & 3.0T MRI Scanners');

INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active)
SELECT 
  'High-Precision 3D & 4D Ultrasound Machines',
  'State-of-the-art diagnostic ultrasound workstations with multi-probe packages for cardiology, radiology, and OB/GYN.',
  'Diagnostics & Imaging',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1600',
  '/search?category=Ultrasound',
  'Explore Ultrasounds',
  2,
  true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'High-Precision 3D & 4D Ultrasound Machines');

INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active)
SELECT 
  'Digital Radiography & Fixed C-Arm Systems',
  'Engineered for maximum patient throughput with low dose radiation and crystal clear surgical imaging.',
  'Surgical & Radiology',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1600',
  '/search?category=X-Ray',
  'View Radiography Systems',
  3,
  true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'Digital Radiography & Fixed C-Arm Systems');
`;

(async () => {
    const client = await pool.connect();
    try {
        console.log('Running Hero Carousel & Feature Flag migration...');
        await client.query(sql);
        console.log('✅ Migration completed successfully! feature_flags and hero_banners tables are ready.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();

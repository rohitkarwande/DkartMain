const bannerService = require('../services/marketing/bannerService');

// 1. Get active banners for public landing page
const getActiveBanners = async (req, res) => {
    try {
        const banners = await bannerService.getActiveBanners();
        res.json({ banners });
    } catch (error) {
        console.error('Error fetching active banners:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch hero banners' });
    }
};

// 2. Get all banners for Admin panel
const getAllBanners = async (req, res) => {
    try {
        const banners = await bannerService.getAllBanners();
        res.json({ banners });
    } catch (error) {
        console.error('Error fetching all banners:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch banners' });
    }
};

// 3. Create new banner (Admin)
const createBanner = async (req, res) => {
    try {
        let imageUrl = req.body.image_url;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const banner = await bannerService.createBanner({
            ...req.body,
            image_url: imageUrl
        });

        res.status(201).json({ 
            message: 'Hero banner created successfully', 
            banner 
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create banner' });
    }
};

// 4. Update banner (Admin)
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await bannerService.updateBanner(id, {
            ...req.body,
            file: req.file
        });

        res.json({ 
            message: 'Banner updated successfully', 
            banner 
        });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update banner' });
    }
};

// 5. Delete banner (Admin)
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await bannerService.deleteBanner(id);
        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete banner' });
    }
};

// 6. Reorder banners (Admin)
const reorderBanners = async (req, res) => {
    try {
        await bannerService.reorderBanners(req.body.bannerIds);
        res.json({ message: 'Banners reordered successfully' });
    } catch (error) {
        console.error('Error reordering banners:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to reorder banners' });
    }
};

// 7. Track banner impression/view (Public)
const trackBannerView = async (req, res) => {
    try {
        const banner = await bannerService.trackBannerView(req.params.id);
        res.json({ success: true, views_count: banner.views_count });
    } catch (error) {
        console.error('Error tracking banner view:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to track banner view' });
    }
};

// 8. Track banner click (Public)
const trackBannerClick = async (req, res) => {
    try {
        const banner = await bannerService.trackBannerClick(req.params.id);
        res.json({ success: true, clicks_count: banner.clicks_count });
    } catch (error) {
        console.error('Error tracking banner click:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to track banner click' });
    }
};

module.exports = {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
    trackBannerView,
    trackBannerClick
};

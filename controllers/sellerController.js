const sellerService = require('../services/communication/sellerService');

const addReview = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { rating, review_text } = req.body;

        const review = await sellerService.addReview({
            sellerId,
            reviewerId: req.user.id,
            rating,
            reviewText: review_text
        });

        res.status(201).json({ message: 'Review added', review });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Error adding review' });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await sellerService.getReviews(req.params.sellerId);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Error fetching reviews' });
    }
};

const getTrustProfile = async (req, res) => {
    try {
        const trustProfile = await sellerService.getTrustProfile(req.params.sellerId);
        res.json(trustProfile);
    } catch (error) {
        console.error('Error fetching trust profile:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Error fetching trust profile' });
    }
};

const getSellerAnalytics = async (req, res) => {
    try {
        const analytics = await sellerService.getSellerAnalytics(req.user.id);
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching seller analytics:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error fetching seller analytics' });
    }
};

module.exports = {
    addReview,
    getReviews,
    getTrustProfile,
    getSellerAnalytics
};

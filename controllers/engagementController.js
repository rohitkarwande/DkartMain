const engagementService = require('../services/marketing/engagementService');

const getNotifications = async (req, res) => {
    try {
        const notifications = await engagementService.getUserNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error('Error in getNotifications:', error);
        res.status(500).json({ error: 'Error fetching notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await engagementService.markNotificationRead({
            notificationId: id,
            userId: req.user.id
        });
        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error in markNotificationRead:', error);
        res.status(500).json({ error: 'Error updating notification' });
    }
};

const getRecentlyViewed = async (req, res) => {
    try {
        const items = await engagementService.getRecentlyViewed(req.user.id);
        res.json(items);
    } catch (error) {
        console.error('Error in getRecentlyViewed:', error);
        res.status(500).json({ error: 'Error fetching recently viewed' });
    }
};

const getSuggestions = async (req, res) => {
    try {
        const suggestions = await engagementService.getSuggestions(req.user.id);
        res.json(suggestions);
    } catch (error) {
        console.error('Error in getSuggestions:', error);
        res.status(500).json({ error: 'Error fetching suggestions' });
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
    getRecentlyViewed,
    getSuggestions
};

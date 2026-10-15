const serviceRequestService = require('../services/support/serviceRequestService');

// 1. Create Service Request
const createServiceRequest = async (req, res) => {
    try {
        const request = await serviceRequestService.createRequest(req.user.id, req.body);
        res.status(201).json({ message: 'Service request created', request });
    } catch (error) {
        console.error('Error creating service request:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error creating service request' });
    }
};

// 2. User Tracking (Get my requests)
const getMyServiceRequests = async (req, res) => {
    try {
        const requests = await serviceRequestService.getMyRequests(req.user.id);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error fetching service requests' });
    }
};

// 3. Admin Management
const getAllServiceRequests = async (req, res) => {
    try {
        const requests = await serviceRequestService.getAllRequests();
        res.json(requests);
    } catch (error) {
        console.error('Error fetching all service requests:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error fetching all service requests' });
    }
};

const updateServiceRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await serviceRequestService.updateRequestStatus(id, req.body);
        res.json({ message: 'Service request updated', request });
    } catch (error) {
        console.error('Error updating service request:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error updating service request' });
    }
};

module.exports = {
    createServiceRequest,
    getMyServiceRequests,
    getAllServiceRequests,
    updateServiceRequestStatus
};

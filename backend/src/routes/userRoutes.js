const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.get('/pincode/:pincode', userController.validatePincodeDelivery);
router.get('/dashboard-summary', userController.getCustomerDashboardSummary);

module.exports = router;

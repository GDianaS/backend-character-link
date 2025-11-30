const express = require('express');
const chartController = require('../controllers/chartController');
const { authMiddleware, optionalAuth } = require('../utils/auth')

const router = express.Router();

// Rotas públicas (com autenticação opcional)
router.get('/', optionalAuth, chartController.getAllCharts);
router.get('/work/:workId', chartController.getChartsByWork);
router.get('/:id', optionalAuth, chartController.getChart);

// Rotas protegidas (requerem autenticação)
router.use(authMiddleware);

router.get('/my/charts', chartController.getMyCharts);
router.post('/', chartController.createChart);
router.patch('/:id', chartController.updateChart);
router.delete('/:id', chartController.deleteChart);
router.post('/:id/snapshot', chartController.saveSnapshot);

module.exports = router;
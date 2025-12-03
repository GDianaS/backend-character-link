const express = require('express');
const workController = require('../controllers/workController');
const { authMiddleware, optionalAuth } = require('../utils/auth');

const router = express.Router();

// Rotas públicas (com autenticação opcional para mostrar creator)
router.get('/', optionalAuth, workController.getAllWorks);
router.get('/:id', optionalAuth, workController.getWork);
router.get('/:id/characters', workController.getWorkCharacters);

// Rotas protegidas (requerem autenticação)
router.use(authMiddleware);

// Estatísticas e obras recentes do usuário
router.get('/user/stats', workController.getStats);
router.get('/user/recent', workController.getRecentWorks);

router.post('/', workController.createWork);
router.patch('/:id', workController.updateWork);
router.delete('/:id', workController.deleteWork);

module.exports = router;
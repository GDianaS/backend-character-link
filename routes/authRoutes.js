const express = require('express');
const { authMiddleware } = require('../utils/auth.js');
const { googleLogin, verifySession, logout } = require('../controllers/authController.js');

const router = express.Router();

// POST /api/auth/google
router.post('/google', googleLogin);

// GET /api/auth/verify (requer autenticação)
router.get('/verify', authMiddleware, verifySession);

// POST /api/auth/logout (requer autenticação)
router.post('/logout', authMiddleware, logout);

module.exports = router;

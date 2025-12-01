const jwt = require('jsonwebtoken');

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Token decodificado:", decoded); // DEBUG
    return decoded;
  } catch (error) {
    return null;
  }
};

// Middleware para proteger rotas
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  console.log("✅ Auth Middleware - userId:", decoded.userId); // DEBUG
  req.userId = decoded.userId;
  next();
};

// Middleware opcional (permite convidados)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
    }
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuth,
};

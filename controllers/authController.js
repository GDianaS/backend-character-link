const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel.js');
const {generateToken} = require('../utils/auth.js');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login com Google
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Verificar token do Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Buscar ou criar usuário
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar: picture
      });
    }

    // Gerar JWT
    const authToken = generateToken(user._id);

    res.json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Falha na autenticação' 
    });
  }
};

// Verificar sessão
const verifySession = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-googleId');

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar sessão' });
  }
};

// Logout
const logout = async (req, res) => {
  // Com JWT, o logout é feito no client removendo o token
  res.json({ success: true, message: 'Logout realizado' });
};

module.exports = {
  googleLogin,
  verifySession,
  logout
};

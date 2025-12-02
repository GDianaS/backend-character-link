const express = require("express");
const dotenv = require('dotenv')
const cors = require("cors");
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const mongoose = require('mongoose');
const workRouters = require('./routes/workRoutes');
const characterRoutes = require('./routes/characterRoutes')
const authRoutes = require('./routes/authRoutes')
const chartRoutes = require('./routes/chartRoutes');

const app = express();

dotenv.config({path:'./config.env'}); 

// CONEXÃO COM O CLIENT
const corsOptions={
    origin: ["http://localhost:5173"]
};
app.use(cors(corsOptions));

// app.use(express.json());
// Aumenta o limite do body
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(express.static(`${__dirname}/public`));

// ROTAS
app.use('/api/auth', authRoutes);
app.use('/api/works', workRouters);
app.use('/api/characters', characterRoutes);
app.use('/api/charts', chartRoutes);


// ERROR GLOBAL
app.use((err, req, res, next) => {
    console.error('🔥 Erro capturado:', err);
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});



// BANCO DE DADOS
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB)
  .then(() =>{
    console.log('DB conectado com sucesso!');
  })
  .catch(err => console.log('DB erro na conexão:', err));

// INICIAR SERVIDOR
const porta = 8080;
function mostraPorta(){
    console.log("Servidor criado e rodando na porta ", porta)
}
app.listen(porta, mostraPorta);



//STATUS
// 200: OK
// 201: Created
// 204: No Content
// 400: Bad Request
// 401: Unauthorized
// 403: Forbidden
// 404: Not found
// 500: Internal Server Error
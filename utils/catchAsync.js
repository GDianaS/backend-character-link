//CATCHING ERROR IN ASYNC FUNCTIONS

module.exports = fn => {
    return(req, res, next)=> {
        fn(req, res, next).catch(next);
    };
};

//Ele recebe uma função assíncrona (fn) → ex: getAllTours.

// Controller executa (async).

// Se der erro → catchAsync intercepta e passa para next(err).

// Express chama o error handling middleware (app.use((err, req, res, next) => {...})).
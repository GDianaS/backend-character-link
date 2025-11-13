const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
}


module.exports = (err, req, res, next) =>{

    //console.log(error.stack);
    //console.log(error);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){

        sendErrorDev(err, res);

    }

    
}
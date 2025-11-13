const express = require('express');
const workController = require('../controllers/workController')

const router = express.Router();

router
    .route('/')
    .get(workController.getAllWorks)
    .post(workController.createWork);

router
    .route('/:id')
    .get(workController.getWork)
    .patch(workController.updateWork)
    .delete(workController.deleteWork); // TO FIX

router
    .route('/:id/characters')
    .get(workController.getWorkCharacters);

module.exports = router; 

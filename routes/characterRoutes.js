const express = require('express');
const characterController = require('../controllers/characterController');

const router = express.Router();

// Rotas gerais
router
    .route('/')
    .get(characterController.getAllCharacters)
    .post(characterController.createCharacter);

router
    .route('/:id')
    .get(characterController.getCharacter);

// Criar personagem para obra específica
router
    .route('/work/:workId')
    .post(characterController.createCharacterForWork);

// Rotas de relacionamentos (GRAFOS)
router
    .route('/:characterId/relationships')
    .post(characterController.addRelationship);

router
    .route('/:characterId/relationships/:relationshipId')
    .delete(characterController.removeRelationship);

// Rotas de análise de grafos
router
    .route('/:characterId/network')
    .get(characterController.getCharacterNetwork);

router
    .route('/:characterId/relationships/type')
    .get(characterController.getCharactersByRelationshipType);

router
    .route('/:characterId/stats')
    .get(characterController.getCharacterStats);

router
    .route('/:sourceId/path/:targetId')
    .get(characterController.findShortestPath);

module.exports = router;
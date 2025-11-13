// controllers/characterController.js
const Character = require('./../models/characterModel');
const Work = require('./../models/workModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// Buscar todos os personagens
exports.getAllCharacters = catchAsync(async (req, res, next) => {
    const characters = await Character.find().populate('work', 'title');

    res.status(200).json({
        status: 'success',
        results: characters.length,
        data: {
            characters
        }
    });
});

// Buscar personagem por ID
exports.getCharacter = catchAsync(async (req, res, next) => {
    const character = await Character.findById(req.params.id)
        .populate('work', 'title')
        .populate('relationships.character', 'name image');

    if (!character) {
        return next(new AppError('Personagem não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            character
        }
    });
});

// Criar personagem
exports.createCharacter = catchAsync(async (req, res, next) => {
    const newCharacter = await Character.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            character: newCharacter
        }
    });
});

// Criar personagem para uma obra específica
exports.createCharacterForWork = catchAsync(async (req, res, next) => {
    const { workId } = req.params;

    const work = await Work.findById(workId);
    if (!work) {
        return next(new AppError('Obra não encontrada', 404));
    }

    const newCharacter = await Character.create({
        ...req.body,
        work: workId
    });

    res.status(201).json({
        status: 'success',
        data: {
            character: newCharacter
        }
    });
});

//Atualizar dados persogaem
exports.updateCharacter = catchAsync(async (req, res, next) => {
    const character = await Character.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).populate('work', 'title');

    if (!character) {
        return next(new AppError('Personagem não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            character
        }
    });
});

// Adicionar relacionamento a um personagem
exports.addRelationship = catchAsync(async (req, res, next) => {
    const { characterId } = req.params;
    const { targetCharacterId, type, description, status, isDirectional } = req.body;

    // Verificar se ambos os personagens existem
    const character = await Character.findById(characterId);
    const targetCharacter = await Character.findById(targetCharacterId);

    if (!character || !targetCharacter) {
        return next(new AppError('Um ou ambos os personagens não foram encontrados', 404));
    }

    // Verificar se pertencem à mesma obra
    if (!character.work.equals(targetCharacter.work)) {
        return next(new AppError('Os personagens devem pertencer à mesma obra', 400));
    }

    // Verificar se o relacionamento já existe
    const relationshipExists = character.relationships.some(
        rel => rel.character.equals(targetCharacterId) && rel.type === type
    );

    if (relationshipExists) {
        return next(new AppError('Este relacionamento já existe', 400));
    }

    // Adicionar relacionamento ao primeiro personagem
    character.relationships.push({
        character: targetCharacterId,
        type,
        description,
        status: status || 'active',
        isDirectional: isDirectional || false
    });

    // Se não for direcional, adicionar relacionamento inverso
    if (!isDirectional) {
        targetCharacter.relationships.push({
            character: characterId,
            type,
            description,
            status: status || 'active',
            isDirectional: false
        });
        await targetCharacter.save();
    }

    await character.save();

    const updatedCharacter = await Character.findById(characterId)
        .populate('relationships.character', 'name image');

    res.status(200).json({
        status: 'success',
        data: {
            character: updatedCharacter
        }
    });
});

// Buscar rede de relacionamentos de um personagem usando $graphLookup
exports.getCharacterNetwork = catchAsync(async (req, res, next) => {
    const { characterId } = req.params;
    const maxDepth = parseInt(req.query.maxDepth) || 2; // Profundidade padrão: 2 níveis

    const character = await Character.findById(characterId);
    if (!character) {
        return next(new AppError('Personagem não encontrado', 404));
    }

    const network = await Character.aggregate([
        {
            $match: { _id: character._id }
        },
        {
            $graphLookup: {
                from: 'characters',
                startWith: '$relationships.character',
                connectFromField: 'relationships.character',
                connectToField: '_id',
                as: 'network',
                maxDepth: maxDepth,
                depthField: 'connectionDepth'
            }
        },
        {
            $project: {
                name: 1,
                image: 1,
                relationships: 1,
                network: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    connectionDepth: 1,
                    relationships: 1
                }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            character: network[0]
        }
    });
});

// Encontrar caminho mais curto entre dois personagens
exports.findShortestPath = catchAsync(async (req, res, next) => {
    const { sourceId, targetId } = req.params;

    const sourceChar = await Character.findById(sourceId);
    const targetChar = await Character.findById(targetId);

    if (!sourceChar || !targetChar) {
        return next(new AppError('Um ou ambos os personagens não foram encontrados', 404));
    }

    if (!sourceChar.work.equals(targetChar.work)) {
        return next(new AppError('Os personagens devem pertencer à mesma obra', 400));
    }

    // Usar $graphLookup para encontrar todos os caminhos
    const paths = await Character.aggregate([
        {
            $match: { _id: sourceChar._id }
        },
        {
            $graphLookup: {
                from: 'characters',
                startWith: '$relationships.character',
                connectFromField: 'relationships.character',
                connectToField: '_id',
                as: 'connectedCharacters',
                depthField: 'depth',
                restrictSearchWithMatch: {
                    work: sourceChar.work
                }
            }
        },
        {
            $unwind: '$connectedCharacters'
        },
        {
            $match: {
                'connectedCharacters._id': targetChar._id
            }
        },
        {
            $project: {
                source: {
                    _id: '$_id',
                    name: '$name',
                    image: '$image'
                },
                target: {
                    _id: '$connectedCharacters._id',
                    name: '$connectedCharacters.name',
                    image: '$connectedCharacters.image'
                },
                degrees: '$connectedCharacters.depth'
            }
        },
        {
            $sort: { degrees: 1 }
        },
        {
            $limit: 1
        }
    ]);

    if (paths.length === 0) {
        return res.status(200).json({
            status: 'success',
            message: 'Não há conexão entre esses personagens',
            data: null
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            path: paths[0]
        }
    });
});

// Buscar personagens por tipo de relacionamento
exports.getCharactersByRelationshipType = catchAsync(async (req, res, next) => {
    const { characterId } = req.params;
    const { type } = req.query;

    if (!type) {
        return next(new AppError('Tipo de relacionamento é obrigatório', 400));
    }

    const character = await Character.findById(characterId);
    if (!character) {
        return next(new AppError('Personagem não encontrado', 404));
    }

    const result = await Character.aggregate([
        {
            $match: { _id: character._id }
        },
        {
            $unwind: '$relationships'
        },
        {
            $match: { 'relationships.type': type }
        },
        {
            $lookup: {
                from: 'characters',
                localField: 'relationships.character',
                foreignField: '_id',
                as: 'relatedCharacter'
            }
        },
        {
            $unwind: '$relatedCharacter'
        },
        {
            $group: {
                _id: '$_id',
                name: { $first: '$name' },
                image: { $first: '$image' },
                relatedCharacters: {
                    $push: {
                        _id: '$relatedCharacter._id',
                        name: '$relatedCharacter.name',
                        image: '$relatedCharacter.image',
                        relationshipType: '$relationships.type',
                        description: '$relationships.description',
                        status: '$relationships.status'
                    }
                }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: result.length > 0 ? result[0].relatedCharacters.length : 0,
        data: {
            character: result[0] || null
        }
    });
});

// Estatísticas de relacionamentos de um personagem
exports.getCharacterStats = catchAsync(async (req, res, next) => {
    const { characterId } = req.params;

    const stats = await Character.aggregate([
        {
            $match: { _id: mongoose.Types.ObjectId(characterId) }
        },
        {
            $project: {
                name: 1,
                totalRelationships: { $size: '$relationships' },
                relationshipsByType: {
                    $arrayToObject: {
                        $map: {
                            input: {
                                $setUnion: ['$relationships.type']
                            },
                            as: 'type',
                            in: {
                                k: '$$type',
                                v: {
                                    $size: {
                                        $filter: {
                                            input: '$relationships',
                                            cond: { $eq: ['$$this.type', '$$type'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);

    if (stats.length === 0) {
        return next(new AppError('Personagem não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            stats: stats[0]
        }
    });
});

// Remover relacionamento
exports.removeRelationship = catchAsync(async (req, res, next) => {
    const { characterId, relationshipId } = req.params;

    const character = await Character.findById(characterId);
    if (!character) {
        return next(new AppError('Personagem não encontrado', 404));
    }

    const relationship = character.relationships.id(relationshipId);
    if (!relationship) {
        return next(new AppError('Relacionamento não encontrado', 404));
    }

    const targetCharacterId = relationship.character;
    const isDirectional = relationship.isDirectional;

    // Remover do personagem principal
    character.relationships.pull(relationshipId);
    await character.save();

    // Se não for direcional, remover também do personagem alvo
    if (!isDirectional) {
        const targetCharacter = await Character.findById(targetCharacterId);
        if (targetCharacter) {
            const reverseRelationship = targetCharacter.relationships.find(
                rel => rel.character.equals(characterId)
            );
            if (reverseRelationship) {
                targetCharacter.relationships.pull(reverseRelationship._id);
                await targetCharacter.save();
            }
        }
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
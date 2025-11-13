const Work = require('./../models/workModel');
const Character = require('./../models/characterModel');
const catchAsync = require ('./../utils/catchAsync');
const AppError = require ('./../utils/appError');

// OBRAS
exports.getAllWorks = catchAsync(async (req, res, next) => {
    const works = await Work.find();

    res.status(200).json({
        status: 'success',
        results: works.length,
        data: {
            works
        }
    });
});

exports.createWork = catchAsync(async (req, res, next) => {
    const newWork = await Work.create(req.body);

    res.status(200).json({
        status: 'success',
        data: {
            work: newWork
        }
    });
});

// BUSCAR OBRA POR ID - SEM POPULATE
exports.getWork = catchAsync(async (req, res, next) => {
    const work = await Work.findById(req.params.id); // Removido .populate('characters')

    if (!work) {
        return next(new AppError('Obra não encontrada', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            work
        }
    });
});

// BUSCAR PERSONAGENS DE UMA OBRA
exports.getWorkCharacters = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Verificar se a obra existe
    const work = await Work.findById(id);
    if (!work) {
        return next(new AppError('Obra não encontrada', 404));
    }

    // Buscar personagens dessa obra
    const characters = await Character.find({ work: id });

    res.status(200).json({
        status: 'success',
        results: characters.length,
        data: {
            characters
        }
    });
});

// ATUALIZAR OBRA
exports.updateWork = catchAsync(async (req, res, next) => {
    const work = await Work.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!work) {
        return next(new AppError('Obra não encontrada', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            work
        }
    });
});

// DELETAR OBRA
exports.deleteWork = catchAsync(async (req, res, next) => {
    const work = await Work.findByIdAndDelete(req.params.id);

    if (!work) {
        return next(new AppError('Obra não encontrada', 404));
    }

    // Deletar todos os personagens associados
    await Character.deleteMany({ work: req.params.id });

    res.status(204).json({
        status: 'success',
        data: null
    });
});






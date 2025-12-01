const Work = require('./../models/workModel');
const Character = require('./../models/characterModel');
const catchAsync = require ('./../utils/catchAsync');
const AppError = require ('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures')

// OBRAS
// exports.getAllWorks = catchAsync(async (req, res, next) => {
//     const works = await Work.find();

//     res.status(200).json({
//         status: 'success',
//         results: works.length,
//         data: {
//             works
//         }
//     });
// });


// TODAS AS OBRAS COM PAGINAÇÃO
exports.getAllWorks = catchAsync(async (req, res, next) => {

    // Criar features de filtragem, sort, fields e paginação
    const features = new APIFeatures(Work.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // Executar query final
    const works = await features.query;

    // Contar total para paginação (sem filter fields)
    const totalWorks = await Work.countDocuments();

    res.status(200).json({
        status: "success",
        results: works.length,
        total: totalWorks,
        page: req.query.page * 1 || 1,
        limit: req.query.limit * 1 || 100,
        data: {
            works
        }
    });
});

// exports.createWork = catchAsync(async (req, res, next) => {
//     const newWork = await Work.create(req.body);

//     res.status(200).json({
//         status: 'success',
//         data: {
//             work: newWork
//         }
//     });
// });

exports.createWork = catchAsync(async (req, res, next) => {

    // adiciona automaticamente o criador
    const newWork = await Work.create({
        ...req.body,
        creator: req.userId || null
    });

    const populated = await Work.findById(newWork._id)
        .populate('creator', 'name email avatar');

    console.log("NEWWORK", newWork);
    console.log("POPULATED", populated);
    console.log("USER ID",req.userId);

    res.status(200).json({
        status: 'success',
        data: { work: populated }
    });
});


// BUSCAR OBRA POR ID
exports.getWork = catchAsync(async (req, res, next) => {
    const work = await Work.findById(req.params.id)
        .populate('creator', 'name email avatar');

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


// STATS
// contagem das obras, dos personagens, número de charts



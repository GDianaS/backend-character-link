const Chart = require('../models/chartModel');
const Work = require ('../models/workModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


// BUSCAR TODOS OS CHARTS
exports.getAllCharts = catchAsync(async (req, res, next) => {
    // Se o usuário estiver logado, pode ver charts públicos + os que ele criou
    // Caso não esteja, só pode ver charts públicos
    const query = req.userId 
        ? { $or: [
            { creator: req.userId }, // charts criados pelo usuário
            { isPublic: true }] // charts públicos
        }
        : { isPublic: true };

    // Busca charts no banco e também carrega dados das obras e do criador
    const charts = await Chart.find(query)
        .populate('works', 'title category') // só pega título e categoria de works
        .populate('creator', 'name email') // só mostra nome e email de creator
        .sort('-createdAt'); // ordena do mais recente para o mais antigo

    res.status(200).json({
        status: 'success',
        results: charts.length,
        data: { charts }
    });
});

// BUSCAR APENAS DO USUÁRIO
exports.getMyCharts = catchAsync(async (req, res, next) => {
    // Só funciona se o usuário estiver logado
    if (!req.userId) {
        return next(new AppError('Você precisa estar autenticado', 401));
    }

    // Busca charts criados pelo próprio usuário
    const charts = await Chart.find({ creator: req.userId })
        .populate('works', 'title category')
        .sort('-updatedAt');

    res.status(200).json({
        status: 'success',
        results: charts.length,
        data: { charts }
    });
});

// BUSCAR CHART POR ID
exports.getChart = catchAsync(async (req, res, next) => {
    const chart = await Chart.findById(req.params.id)
        .populate('works', 'title category image')
        .populate('creator', 'name email')
        .populate({
            // Carrega informações dos personagens nos nós (se houver)
            path: 'flowData.nodes.characterId',
            select: 'name image defaultColor'
        });

    if (!chart) {
        return next(new AppError('Chart não encontrado', 404));
    }

    // Verifica se ele é público
    // Se for privado, só o criador pode acessar
    if (!chart.isPublic && (!req.userId || !chart.creator.equals(req.userId))) {
        return next(new AppError('Você não tem permissão para acessar este chart', 403));
    }

    // Contabiliza uma visualização
    chart.stats.views += 1;
    await chart.save({ validateBeforeSave: false }); // salva sem validar tudo

    res.status(200).json({
        status: 'success',
        data: { chart }
    });
});

// NOVO CHART
exports.createChart = catchAsync(async (req, res, next) => {
    const { title, description, works, flowData, settings, isPublic } = req.body;

    // Se o usuário vinculou obras, verifica se elas existem no banco
    if (works && works.length > 0) {
        const existingWorks = await Work.find({ _id: { $in: works } });
        if (existingWorks.length !== works.length) {
            return next(new AppError('Uma ou mais obras não foram encontradas', 404));
        }
    }

    // Cria o chart
    const newChart = await Chart.create({
        title,
        description,
        works: works || [],
        creator: req.userId || null, // se não tiver userId, salva como "sem criador"
        flowData: flowData || { nodes: [], edges: [], viewport: {} },
        settings: settings || {},
        isPublic: isPublic || false
    });

    // Carrega também dados das obras
    const populatedChart = await Chart.findById(newChart._id)
        .populate('works', 'title category');

    res.status(201).json({
        status: 'success',
        data: { chart: populatedChart }
    });
});

// EDITAR CHART
exports.updateChart = catchAsync(async (req, res, next) => {
    const chart = await Chart.findById(req.params.id);

    if (!chart) {
        return next(new AppError('Chart não encontrado', 404));
    }

    // Só o criador pode editar
    if (!req.userId || !chart.creator.equals(req.userId)) {
        return next(new AppError('Você não tem permissão para editar este chart', 403));
    }

    // Lista de campos permitidos para alteração
    const allowedFields = ['title', 'description', 'works', 'flowData', 'settings', 'isPublic'];
    const updates = {};

    // Copia apenas os campos enviados no body
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    // Atualiza o chart
    const updatedChart = await Chart.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    ).populate('works', 'title category');

    res.status(200).json({
        status: 'success',
        data: { chart: updatedChart }
    });
});

// EXCLUIR CHART
exports.deleteChart = catchAsync(async (req, res, next) => {
    const chart = await Chart.findById(req.params.id);

    if (!chart) {
        return next(new AppError('Chart não encontrado', 404));
    }

    // Só o criador pode deletar
    if (!req.userId || !chart.creator.equals(req.userId)) {
        return next(new AppError('Você não tem permissão para deletar este chart', 403));
    }

    await Chart.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});


// SALVAR "SNAPSHOT"
exports.saveSnapshot = catchAsync(async (req, res, next) => {
    const { flowData } = req.body;

    const chart = await Chart.findById(req.params.id);

    if (!chart) {
        return next(new AppError('Chart não encontrado', 404));
    }

    // Só o criador pode salvar snapshot
    if (!req.userId || !chart.creator.equals(req.userId)) {
        return next(new AppError('Você não tem permissão para editar este chart', 403));
    }

    // Atualiza apenas o flowData
    chart.flowData = flowData;
    await chart.save();

    res.status(200).json({
        status: 'success',
        data: { chart }
    });
});


// LISTAR CHARTS POR OBRA
exports.getChartsByWork = catchAsync(async (req, res, next) => {
    const { workId } = req.params;

    // Busca charts que usam uma obra específica, mas somente os públicos
    const charts = await Chart.find({ works: workId, isPublic: true })
        .populate('works', 'title category')
        .populate('creator', 'name');

    res.status(200).json({
        status: 'success',
        results: charts.length,
        data: { charts }
    });
});
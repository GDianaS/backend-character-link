const Work = require('./../models/workModel');
const Character = require('./../models/characterModel');
const catchAsync = require ('./../utils/catchAsync');
const AppError = require ('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures')
const { supabase, uploadImage, deleteImage } = require('../utils/supabase');

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

// CRIAR OBRA COM IMAGEM
exports.createWork = catchAsync(async (req, res, next) => {
  if (!req.userId) {
    return next(new AppError('Você precisa estar autenticado para criar obras', 401));
  }

  let imageCoverUrl = null;

  // Se houver imagem em base64
  if (req.body.imageCover && req.body.imageCover.startsWith('data:image')) {
    try {
      // Converter base64 para buffer
      const base64Data = req.body.imageCover.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Gerar nome único
      const fileName = `work-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload para Supabase
      imageCoverUrl = await uploadImage(imageBuffer, fileName, 'works');
      
      console.log('✅ Imagem enviada para Supabase:', imageCoverUrl);
    } catch (error) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      // Continuar mesmo se falhar o upload
    }
  }

  // Criar obra
  const newWork = await Work.create({
    ...req.body,
    imageCover: imageCoverUrl,
    creator: req.userId
  });

  const populated = await Work.findById(newWork._id)
    .populate('creator', 'name email avatar');

  res.status(201).json({
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


// ATUALIZAR OBRA COM IMAGEM
exports.updateWork = catchAsync(async (req, res, next) => {
  const work = await Work.findById(req.params.id);

  if (!work) {
    return next(new AppError('Obra não encontrada', 404));
  }

  // Verificar permissão (apenas criador pode editar)
  if (work.creator && work.creator.toString() !== req.userId) {
    return next(new AppError('Você não tem permissão para editar esta obra', 403));
  }

  let imageCoverUrl = work.imageCover;

  // Se houver nova imagem
  if (req.body.imageCover && req.body.imageCover.startsWith('data:image')) {
    try {
      // Deletar imagem antiga se existir
      if (work.imageCover) {
        await deleteImage(work.imageCover).catch(err => 
          console.log('Aviso: Não foi possível deletar imagem antiga:', err.message)
        );
      }

      // Upload nova imagem
      const base64Data = req.body.imageCover.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const fileName = `work-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      imageCoverUrl = await uploadImage(imageBuffer, fileName, 'works');
      
      console.log('✅ Nova imagem enviada:', imageCoverUrl);
    } catch (error) {
      console.error('❌ Erro ao atualizar imagem:', error);
    }
  }

  // Atualizar obra
  const updatedWork = await Work.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      imageCover: imageCoverUrl
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('creator', 'name email avatar');

  res.status(200).json({
    status: 'success',
    data: { work: updatedWork }
  });
});


// DELETAR OBRA E IMAGEM
exports.deleteWork = catchAsync(async (req, res, next) => {
  const work = await Work.findById(req.params.id);

  if (!work) {
    return next(new AppError('Obra não encontrada', 404));
  }

  // Deletar imagem se existir
  if (work.imageCover) {
    await deleteImage(work.imageCover).catch(err => 
      console.log('Aviso: Não foi possível deletar imagem:', err.message)
    );
  }

  // Deletar obra
  await Work.findByIdAndDelete(req.params.id);

  // Deletar personagens associados
  await Character.deleteMany({ work: req.params.id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});


// STATS
// contagem das obras, dos personagens, número de charts
exports.getStats = catchAsync(async (req, res, next) => {
  if (!req.userId) {
    return next(new AppError('Você precisa estar autenticado', 401));
  }

  // Total de obras do usuário
  const totalWorks = await Work.countDocuments({ creator: req.userId });

  // Total de personagens nas obras do usuário
  const userWorks = await Work.find({ creator: req.userId }).select('_id');
  const workIds = userWorks.map(work => work._id);
  const totalCharacters = await Character.countDocuments({ work: { $in: workIds } });

  // Total de charts do usuário
  const Chart = require('./../models/chartModel');
  const totalCharts = await Chart.countDocuments({ creator: req.userId });

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalWorks,
        totalCharacters,
        totalCharts
      }
    }
  });
});

// OBRAS RECENTES DO USUÁRIO
exports.getRecentWorks = catchAsync(async (req, res, next) => {
  if (!req.userId) {
    return next(new AppError('Você precisa estar autenticado', 401));
  }

  const limit = req.query.limit * 1 || 5;

  const recentWorks = await Work.find({ creator: req.userId })
    .sort('-createdAt')
    .limit(limit)
    .select('title category imageCover createdAt');

  res.status(200).json({
    status: 'success',
    results: recentWorks.length,
    data: {
      works: recentWorks
    }
  });
});


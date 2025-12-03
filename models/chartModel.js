const mongoose = require('mongoose');

const chartSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, 'Um chart precisa de um título'],
        trim: true
    },
    description:{
        type: String,
        trim: true
    },
    // Obras relacionadas ao chart
    // Cada item é o ID de uma obra da collection "Work"
    works: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Work',
        required: true
    }],
    // Usuário criador (null para convidados)
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Dados do ReactFlow
    // nós, ligações e posição da câmera
    flowData: {
        nodes: {
            type: [mongoose.Schema.Types.Mixed], // Array de objetos genéricos
            default: []
        },
        edges: {
            type: [mongoose.Schema.Types.Mixed], // Array de objetos genéricos
            default: []
        },
        viewport: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            zoom: { type: Number, default: 1 }
        }
    },

    // Configurações visuais
    settings: {
        backgroundColor: {
            type: String,
            default: '#ffffff'
        },
        gridColor: {
            type: String,
            default: '#e2e8f0'
        },
        showMinimap: {
            type: Boolean,
            default: true
        }
    },

    // Status de publicação
    isPublic: {
        type: Boolean,
        default: false
    },

    // Estatísticas
    stats: {
        totalNodes: {
            type: Number,
            default: 0
        },
        totalEdges: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        }
    }
},{
    timestamps: true // cria createdAt e updatedAt automaticamente
});

// Índices para tornar buscas mais rápidas (otimização do banco)
chartSchema.index({ works: 1 });
chartSchema.index({ creator: 1 });
chartSchema.index({ isPublic: 1 });
chartSchema.index({ createdAt: -1 });

// Antes de salvar, atualizar automaticamente as estatísticas
chartSchema.pre('save', function(next) {
    if (this.flowData) {
        // Conta automaticamente quantos nodes e edges existem
        this.stats.totalNodes = this.flowData.nodes?.length || 0;
        this.stats.totalEdges = this.flowData.edges?.length || 0;
    }
    next();
});

const Chart = mongoose.model('Chart', chartSchema);
module.exports = Chart;
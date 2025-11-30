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
        nodes: [{
            id: String,
            type: String,
            position: {
                x: Number,
                y: Number
            },
            data: mongoose.Schema.Types.Mixed,
            style: mongoose.Schema.Types.Mixed,
            // Referência ao personagem real
            // Caso esse node represente um personagem real,
            // aqui fica o id dele
            characterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Character'
            }
        }],
        edges: [{ // Lista de conexões (edges)
            id: String, 
            source: String, // id do node de onde a conexão sai
            target: String, // id do node onde a conexão termina
            type: String,
            label: String,
            style: mongoose.Schema.Types.Mixed,
            // Tipo de relacionamento
            relationshipType: {
                type: String,
                enum: ['family', 'romantic', 'friendship', 'rivalry', 'enemy', 'mentor', 'colleague', 'alliance', 'conflict', 'master-apprentice', 'parent-child', 'siblings', 'lovers', 'ex-lovers', 'unrequited', 'other']
            },
            description: String // descrição opcional do relacionamento
        }],

        // Posição da câmera e zoom da visualização
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
const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    work: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Work',
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
    },
    alias: [String],
    status: {
        type: String,
    },
    // Cor padrão para visualização em charts
    defaultColor: {
        type: String,
        default: '#A8C4F0'
    },
    // Array de relacionamentos diretos (edges do grafo)
    relationships: [{
        character: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Character'
        },
        type: {
            type: String,
            enum: [
                'family',           // Família
                'romantic',         // Romântico
                'friendship',       // Amizade
                'rivalry',          // Rivalidade
                'enemy',            // Inimigo
                'mentor',           // Mentor
                'colleague',        // Colega
                'alliance',         // Aliança
                'conflict',         // Conflito
                'master-apprentice', // Mestre-Aprendiz
                'parent-child',     // Pai/Mãe-Filho(a)
                'siblings',         // Irmãos
                'lovers',           // Amantes
                'ex-lovers',        // Ex-amantes
                'unrequited',       // Amor não correspondido
                'other'             // Outro
            ]
        },
        description: String,
        status: {
            type: String,
            enum: ['active', 'past', 'complicated'],
            default: 'active'
        },
        isDirectional: {
            type: Boolean,
            default: false
        },
        intensity: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        }
    }]
}, { timestamps: true });

// Índice para otimizar buscas por obra
characterSchema.index({ work: 1 });
characterSchema.index({ 'relationships.character': 1 });

const Character = mongoose.model("Character", characterSchema);
module.exports = Character;
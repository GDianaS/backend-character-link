// models/characterModel.js
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
    // Array de relacionamentos diretos (edges do grafo)
    relationships: [{
        character: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Character'
        },
        type: {
            type: String,
            enum: ['family', 'romantic', 'friendship', 'rivalry', 'enemy', 'mentor', 'colleague', 'other']
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
        }
    }]
}, { timestamps: true });

// Índice para otimizar buscas por obra
characterSchema.index({ work: 1 });
characterSchema.index({ 'relationships.character': 1 });

const Character = mongoose.model("Character", characterSchema);
module.exports = Character;
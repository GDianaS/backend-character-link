const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Uma obra precisa de um título']
    },
    subtitle: {
        type: String
    },
    author: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: {
            values: ['notStarted', 'inProgress', 'completed'],
            message: 'Status is either notStarted inProgress or completed'
        }
    },
    category: {
        type: String,
        required: true,
        enum: {
            values: ['movie', 'serie', 'book','series','comic', 'novel', 'ebook','manga', 'fanfic', 'theater','audiobook'],
            message: 'Status is either movie, serie, book, comic, novel, ebook, series, manga, fanfic, theater or audiobook'
        }
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    imageCover: {
        type: String
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { 
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

const Work = mongoose.model("Work", workSchema);
module.exports = Work;
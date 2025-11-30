// models/workModel.js
const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Uma obra precisa de um título']
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
        type: Boolean
    },
    imageCover: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    }
});

const Work = mongoose.model("Work", workSchema);
module.exports = Work;
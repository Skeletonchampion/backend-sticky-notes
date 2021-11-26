const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
    userId: String,
    title: {
        type: String,
        required: true,
    },
    body: String,
    date: {
        type: String,
        required: true,
    },
    ts: Number,
    bg: {
        type: String,
        default: "transparent",
    },
    noteId: {
        type: String,
    }
});

module.exports = mongoose.model("Note", NoteSchema);
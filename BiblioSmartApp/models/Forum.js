const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema de comentarios
const CommentSchema = new Schema({
  user: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  responses: [
    {
      user: { type: String, required: true },
      content: { type: String, required: true },
      date: { type: Date, default: Date.now },
      likes: { type: Number, default: 0 },
    },
  ],
});

// Esquema de temas
const TopicSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: String, required: true },
  date: { type: Date, default: Date.now },
  comments: [CommentSchema], // Comentarios dentro de los temas
});

const Topic = mongoose.model('Topic', TopicSchema);
module.exports = Topic;

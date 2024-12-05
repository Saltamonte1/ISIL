const express = require('express');
const router = express.Router();
const Topic = require('../models/Forum');

// Obtener todos los temas
router.get('/topics', async (req, res) => {
  try {
    const topics = await Topic.find();
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo tema
router.post('/topics', async (req, res) => {
  const topic = new Topic({
    title: req.body.title,
    description: req.body.description,
    user: req.body.user,
  });
  try {
    const newTopic = await topic.save();
    res.status(201).json(newTopic);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Agregar un comentario a un tema
router.post('/topics/:id/comments', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    topic.comments.push({
      user: req.body.user,
      content: req.body.content,
    });

    await topic.save();
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Agregar una respuesta a un comentario
router.post('/topics/:id/comments/:commentId/responses', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const comment = topic.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.responses.push({
      user: req.body.user,
      content: req.body.content,
    });

    await topic.save();
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    savedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
  });

module.exports = mongoose.model('User', UserSchema);

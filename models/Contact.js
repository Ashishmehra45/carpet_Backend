const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
   
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  number: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  }
}, {
  timestamps: true // Isse createdAt aur updatedAt automatically manage ho jayega
});

module.exports = mongoose.model('Contact', contactSchema);
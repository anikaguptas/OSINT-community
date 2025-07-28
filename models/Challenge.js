const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const challengeSchema = new Schema({
  title: String,
  description: String,
  images: [String],
  flag: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  hints : [String],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  officialSolution: { type: Schema.Types.ObjectId, ref: 'Solution' },
  // Community solutions submitted by others
  solutions: [{ type: Schema.Types.ObjectId, ref: 'Solution' }],
});

module.exports = mongoose.model('Challenge', challengeSchema);

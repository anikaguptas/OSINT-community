const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({

  name: String,
  email: { type: String, unique: true },
  password: String,
  username: { type: String, unique: true },
  avatar: String,
  googleId: String,

  challenges: [{ type: Schema.Types.ObjectId, ref: 'Challenge' }],
  solutions: [{ type: Schema.Types.ObjectId, ref: 'Solution' }]

});

module.exports = mongoose.model('User', userSchema);

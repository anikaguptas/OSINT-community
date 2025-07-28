const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const sampleChallenges = [
  {
    title: "Church Chasing",
    description: "Find the name of the nearest church to this location.",
    images: [
      "https://raw.githubusercontent.com/LinusKay/osint-challenges/main/Church%20Chasing/street.png",
      "https://images.unsplash.com/photo-1683009427042-e094996f9780?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxfHx8ZW58MHx8fHx8"
    ],
    flag: "obrechtkerk",
    createdAt: new Date()
  },
  {
    title: "Tag, You're Traced",
    description: "Can you find the selfie location?",
    images: [
      "https://plus.unsplash.com/premium_photo-1752111382495-97f90e81fab3?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyfHx8ZW58MHx8fHx8"
    ],
    flag: "times square",
    createdAt: new Date()
  }
];


const fillDatabase = async () => {
  const Challenge = require('../models/Challenge');
  await Challenge.deleteMany({});
  await Challenge.insertMany(sampleChallenges);
  console.log('Sample challenges inserted');
};

module.exports = {
  connectDB,
  fillDatabase
};

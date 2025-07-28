const express = require('express');
const Solution = require("../models/Solution")
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User')
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const tryCatchWrap = require('../middleware/trycatchwrap');
const ExpressError = require('../expressError');
const mongoose = require('mongoose')
const validateChallenge = require('../middleware/joi').validateChallenge; // Import the validateChallenge middleware
//BASE ROUTE .. SHOW ALL CHALLENGES
router.get('/', tryCatchWrap( async (req,res)=>{
    const allChallenges = await Challenge.find({}).populate('author');
    res.render('challenges', { allChallenges });
}))


//FORM TO CREATE A NEW CHALLENG
router.get("/new", tryCatchWrap(async (req, res) => {
  res.render('newChallenge');  
 }))


//POSTING NEW CHALLENGE TO DB
router.post("/new", validateChallenge ,upload.array('challenge[images]'), tryCatchWrap( async (req, res) => {
if (!req.user) throw new ExpressError(400, "Please Login to post a challenge");
const { title, description, hints } = req.body.challenge;
const challenge = await new Challenge({
    title,
    description,
images: req.files?.map(file => file.path) || [],
    hints: hints ? hints.split(',').map(hint => hint.trim()) : [],
    author : req.user.id
})

await challenge.save();
const user = await User.findById(req.user.id);
user.challenges.push(challenge._id);
await user.save();
console.log("Challenge created and user updated");  
res.redirect(`/challenges/${challenge._id}`); 
}))

//SHOW FORM TO EDIT A CHALLENGE
router.get("/:id/edit",tryCatchWrap( async (req, res) => {
    const id = req.params.id;
    const challenge = await Challenge.findById(id);
    res.render('editChallenge', { challenge});
}))
//SHOW A SINGLE CHALLENGE
router.get("/:id",  tryCatchWrap( 
    async (req,res)=>{
    const id = req.params.id;
    const challenge = await Challenge.findById(id)
        .populate('author')
        .populate({
            path: 'solutions',
            populate: {
                path: 'author',
                model: 'User' // replace with your actual user model name if different
            }
        });
    res.render('showChallenge', { challenge });  
} ))

//update a challenge
router.put("/:id", upload.array('challenge[images]'),tryCatchWrap( async (req, res) => {
    const id = req.params.id;
    const { title, description, hints } = req.body.challenge;

    const challenge = await Challenge.findById(id);

    let existingImages = challenge.images || [];

    // Remove images selected by user
    let imagesToRemove = req.body.removeImages || []; // could be string or array
    if (!Array.isArray(imagesToRemove)) {
        imagesToRemove = [imagesToRemove]; // make it an array if single checkbox checked
    }
    existingImages = existingImages.filter(img => !imagesToRemove.includes(img));

    // Add new images
    const newImages = req.files.map(file => file.path);
    const updatedImages = existingImages.concat(newImages);

    // Save
    challenge.title = title;
    challenge.description = description;
    challenge.images = updatedImages;
    challenge.hints = hints ? hints.split(',').map(hint => hint.trim()) : [];

    await challenge.save();
    res.redirect(`/challenges/${challenge._id}`);
}));

//MAKE SURE TO DELETE ALL SOLUTIONS RELATED TO THE CHALLENGE
router.delete("/:id",tryCatchWrap( async (req,res)=>{
    const id = req.params.id;
    const challenge =await  Challenge.findById(id);
        if (!challenge) throw new ExpressError(404, "Challenge not found");

    const user = await User.findById(challenge.author);
    const solutions = await Solution.find({ challenge: id });
for (let soln of solutions) {
    const solnUser = await User.findById(soln.author);
    if (solnUser) {
        solnUser.solutions = solnUser.solutions.filter(s => !s.equals(soln._id));
        await solnUser.save();
    }
}

    user.challenges = user.challenges.filter(chal => !chal.equals(id));
    await user.save();
    await Solution.deleteMany({ challenge: id });
    await Challenge.findByIdAndDelete(id);
        res.redirect('/challenges');
    }));

router.post("/:challengeId/newsol", upload.array('soln[images]'), tryCatchWrap( async(req,res)=>{
    if(!req.user) throw new ExpressError(400, "Please Login to post a solution")
    const challengeId = req.params.challengeId;
    console.log("challenge id " + typeof(challengeId)); // Should be a string
    const author = req.user.id;
    console.log("author id " + typeof(author)); // Should be a string
    const {soln} = req.body;
    const solution = new Solution({
        content : soln.content,
        author : author,
        challenge : challengeId,
    images: req.files ? req.files.map(f => f.path) : []
  });
    await solution.save();
    console.log("solution saved");
    const challenge = await Challenge.findById(challengeId);
    console.log("challenge found" + challenge);
challenge.solutions = [...challenge.solutions, solution._id];
    await challenge.save();
    console.log("challenge updated with solution");
    const user = await User.findById(author);
    user.solutions.push(solution._id);
    await user.save();
    console.log("everything is saved");
    res.redirect(`/challenges/${challengeId}`);
}))

module.exports = router;
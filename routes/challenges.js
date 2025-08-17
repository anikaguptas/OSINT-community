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
const validateChallenge = require('../middleware/joi').validateChallenge; // Import the validateChallenge middleware
const challengeController = require('../controllers/challengeController')
const {isAuthenticated} = require("../middleware/authMiddleware")
const {isChallengeOwner} = require('../middleware/authMiddleware')
// localhost:challenges/


router.get("/new",
    isAuthenticated, 
    tryCatchWrap(challengeController.rendernewChallengeForm));

router.get('/', 
    tryCatchWrap(challengeController.showChallenges))

//POSTING NEW CHALLENGE TO DB
router.post("/new", 
    isAuthenticated,
    validateChallenge ,
    upload.array('challenge[images]'), 
    tryCatchWrap(  challengeController.handlePostChallenge))

//SHOW FORM TO EDIT A CHALLENGE
router.get("/:id/edit",
    isAuthenticated,
    isChallengeOwner,
    challengeController.renderEditChallengeForm);


//SHOW A SINGLE CHALLENGE
router.get("/:id",  tryCatchWrap( challengeController.showSingleChallenge ));


//UPDATE CHALLENGE PUT REQUEST
router.put("/:id",
    isAuthenticated,
    isChallengeOwner,
    upload.array('challenge[images]'),
    tryCatchWrap(challengeController.updateChallengePUT));

//MAKE SURE TO DELETE ALL SOLUTIONS RELATED TO THE CHALLENGE
router.delete("/:id",
    isAuthenticated,
    isChallengeOwner,
    tryCatchWrap( challengeController.deleteChallenge));


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
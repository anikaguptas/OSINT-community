const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const tryCatchWrap = require('../middleware/trycatchwrap');
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


//POST A SOLUTION TO A CHALLENGE   
router.post("/:challengeId/newsol", 
    upload.array('soln[images]'), 
    tryCatchWrap(challengeController.postSolution));

module.exports = router;
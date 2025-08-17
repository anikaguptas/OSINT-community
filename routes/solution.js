const express = require('express');
const router = express.Router();
const Solution = require('../models/Solution');
const tryCatchWrap = require('../middleware/trycatchwrap');
const ExpressError = require('../expressError');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const { isAuthenticated } = require('../middleware/authMiddleware');
const { isSolutionOwner } = require('../middleware/authMiddleware');
const solutionController = require('../controllers/solutionController');
// localhost:solution/......

router.get('/:solnId/edit',
  isAuthenticated, 
  isSolutionOwner, 
  tryCatchWrap(solutionController.renderEditSolution) 
);


router.put('/:solnId',
  isAuthenticated,
  isSolutionOwner,
  upload.array('newImages'),
  tryCatchWrap( solutionController.updateSolutionPut
));

module.exports = router;
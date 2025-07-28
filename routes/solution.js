const express = require('express');
const router = express.Router();
const Solution = require('../models/Solution');
const tryCatchWrap = require('../middleware/trycatchwrap');
const ExpressError = require('../expressError');
const trycatchwrap = require('../middleware/trycatchwrap');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

router.get('/:solnId/edit', tryCatchWrap(async (req,res)=>{
    const solnId = req.params.solnId;
     const solution = await Solution.findById(solnId);
     if(!solution) throw new ExpressError(404, "solution not found");

    res.render("editSoln" , {solution});
} ) )
router.put('/:solnId', upload.array('newImages'), trycatchwrap(
  async (req, res) => {
    const solnId = req.params.solnId;
    const solution = await Solution.findById(solnId);
    if (!solution) throw new ExpressError(404, "Solution not found");

    const { newContent, RemovedImages } = req.body;
    console.log("Updated Solution:", newContent, RemovedImages);
    console.log("New Files:", req.files);

    // ✅ Update the text content
    solution.content = newContent;

    // ✅ Handle removed images
    let existingImages = solution.images || [];

    let imagesToRemove = [];
    if (RemovedImages) {
      // It could be a single string or array
      if (Array.isArray(RemovedImages)) {
        imagesToRemove = RemovedImages;
      } else {
        imagesToRemove = [RemovedImages];
      }

    }
          existingImages = existingImages.filter(img => !imagesToRemove.includes(img));


    // ✅ Add newly uploaded images
    const newImages = req.files.map(file => file.path);
    const updatedImages = existingImages.concat(newImages);

    solution.images = updatedImages;

    // ✅ Save the updated solution
    await solution.save();
    console.log("Solution updated successfully");

    const challengeId = await solution.challenge;

    res.redirect(`/challenges/${challengeId}`); // Or wherever you want to redirect
  }
));

module.exports = router;
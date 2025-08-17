const Solution = require('../models/Solution');
const ExpressError = require('../expressError');
const renderEditSolution = async (req,res)=>{
    const solnId = req.params.solnId;
     const solution = await Solution.findById(solnId);
     if(!solution) throw new ExpressError(404, "solution not found");
    res.render("editSoln" , {solution});
}

const updateSolutionPut = async (req, res) => {
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

module.exports = {
    renderEditSolution ,
    updateSolutionPut  
  }
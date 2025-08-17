const Challenge = require('../models/Challenge');
const User = require('../models/User');
const {cloudinary} = require('../config/cloudinary');
const ExpressError = require('../expressError');
const Solution = require('../models/Solution');
const { post } = require('../routes/challenges');
function extractPublicId(url) {
    const withoutParams = url.split('/upload/')[1];
    return withoutParams.substring(0, withoutParams.lastIndexOf('.'));
}

// renders form for a new challenge
const rendernewChallengeForm = async (req, res) => {
  res.render('newChallenge');  
 }

// shows all challenges
const showChallenges = async (req,res)=>{
    const allChallenges = await Challenge.find({}).populate('author');
    res.render('challenges', { allChallenges })};

// handle post request after create new challenge
const handlePostChallenge = async (req, res) => {
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
}

const renderEditChallengeForm =  async (req, res) => {
    const id = req.params.id;
    const challenge = await Challenge.findById(id);
    res.render('editChallenge', { challenge});
}


const showSingleChallenge =   async (req,res)=>{
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
} 

const updateChallengePUT=  async (req, res) => {
    const id = req.params.id;
    const { title, description, hints } = req.body.challenge;
    const challenge = await Challenge.findById(id);
    let existingImages = challenge.images || [];
    let imagesToRemove = req.body.removeImages || []; 
    if (!Array.isArray(imagesToRemove)) {
        imagesToRemove = [imagesToRemove]; 
    }
    for (let imageUrl of imagesToRemove) {
        try {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
            console.log("Image deleted successfully");
        } catch (err) {
            throw new ExpressError("Couldnt delete" + err);
        }
    }
    existingImages = existingImages.filter(img => !imagesToRemove.includes(img));
    const newImages = req.files.map(file => file.path);
    const updatedImages = existingImages.concat(newImages);
    challenge.title = title;
    challenge.description = description;
    challenge.images = updatedImages;
    challenge.hints = hints ? hints.split(',').map(hint => hint.trim()) : [];
    await challenge.save();
    res.redirect(`/challenges/${challenge._id}`);
}
const deleteChallenge = async (req, res) => {
  try {
    const id = req.params.id;

    // Populate challenge.author so we get a full user doc if possible
    let challenge = await Challenge.findById(id).populate('author');
    if (!challenge) throw new ExpressError(404, 'Challenge not found');

    // Fetch solutions and populate their authors
    const solutions = await Solution.find({ challenge: id }).populate('author');

    // Collect unique author documents to update (avoid saving same doc multiple times)
    const authorsToUpdate = new Map();

    for (const soln of solutions) {
      const solnAuthor = soln.author; // may be null if user deleted
      if (!solnAuthor) continue;

      // ensure array exists
      if (!Array.isArray(solnAuthor.solutions)) solnAuthor.solutions = [];

      // remove this solution id from the author's solutions array
      solnAuthor.solutions = solnAuthor.solutions.filter(s => !s.equals(soln._id));

      // add to map (overwrites duplicate keys, so each author saved once)
      authorsToUpdate.set(solnAuthor._id.toString(), solnAuthor);
    }

    // Ensure challenge.author (owner) is also updated & included in the save set
    if (challenge.author) {
      let chalAuthorDoc = challenge.author;

      // If challenge.author wasn't populated (rare because we populated above), fetch it.
      if (typeof chalAuthorDoc.save !== 'function') {
        chalAuthorDoc = await User.findById(chalAuthorDoc);
      }

      if (chalAuthorDoc) {
        if (!Array.isArray(chalAuthorDoc.challenges)) chalAuthorDoc.challenges = [];
        chalAuthorDoc.challenges = chalAuthorDoc.challenges.filter(ch => !ch.equals(id));
        authorsToUpdate.set(chalAuthorDoc._id.toString(), chalAuthorDoc);
      }
    }
    // Save each author once (in parallel is fine because they are different documents)
    await Promise.all(Array.from(authorsToUpdate.values()).map(a => a.save()));
    // Delete challenge images from Cloudinary (if any)
    if (Array.isArray(challenge.images) && challenge.images.length > 0) {
      await Promise.all(challenge.images.map(async (imageUrl) => {
        try {
          const publicId = extractPublicId(imageUrl);
          if (!publicId) return;
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted Cloudinary image: ${publicId}`);
        } catch (err) {
          console.error(`Failed to delete image ${imageUrl}`, err);
        }
      }));
    }

    // Delete solutions and the challenge itself
    await Promise.all([
      Solution.deleteMany({ challenge: id }),
      Challenge.findByIdAndDelete(id)
    ]);

    return res.redirect('/challenges');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error Has occured');
  }
};

const postSolution =  async(req,res)=>{
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
};

module.exports={
    rendernewChallengeForm, 
    showChallenges,
    handlePostChallenge,
    renderEditChallengeForm,
    showSingleChallenge,
    updateChallengePUT,
    deleteChallenge,
    postSolution
 }
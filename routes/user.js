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

router.get('/profile', tryCatchWrap( async (req,res)=>{
    if (!req.user) throw new ExpressError(400, "Please Login to view your profile");
    const id = req.user.id;
    const userdetails = await User.findById(id).populate('challenges');
    const solutions = await Solution.find({ author: id }).populate('challenge');
    // res.json(userdetails, solutions);
    res.render("profile", { userdetails, solutions });
}))

module.exports = router;
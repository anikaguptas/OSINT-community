const express = require('express');
const passport = require('passport');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const path = require('path');
const Challenge = require('./models/Challenge'); // Import the Challenge model  
const { connectDB, fillDatabase } = require('./config/db');
const cookieParser = require('cookie-parser');
const { checkAuth } = require('./middleware/authMiddleware'); // ✅ Fix here
const ejsMate = require('ejs-mate');
const ExpressError = require('./expressError'); // Import the ExpressError class
dotenv.config();


const app = express();

connectDB();
// fillDatabase();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.json());                         // (Optional) for JSON payloads


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.use(passport.initialize());
app.use(checkAuth); // ✅ Now this is a proper middleware function

app.get('/', (req, res) => {
  res.render('home');
});

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const userRoutes = require('./routes/user');
const solutionRoutes = require('./routes/solution');
app.use('/auth', authRoutes);
app.use('/challenges', challengeRoutes);
app.use("/user",userRoutes);
app.use('/solution', solutionRoutes);

// Catch-all 404 handler for undefined routes
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  const code = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  res.status(code).render('error.ejs', {error : message})
   })

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

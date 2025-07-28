const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
if(user){
   user.googleId = profile.id;
    await user.save();
} else {
 user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
}
         
        }

        // 🔥 Pass user to the route for custom JWT handling
        return done(null, user); 
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;

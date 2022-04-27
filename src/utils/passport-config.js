const LocalStrategy=require('passport-local').Strategy
const User=require('../models/user')
const bcrypt=require('bcrypt')

function initialize(passport){
    const authenticateUser=async(email,password,done)=>{
        const user=await User.findOne({email})
        if (user == null) {
            return done(null, false, { message: 'No user with that email' })
          }

        if(user.isVerified===false)
        {
            return done(null,false,{message:'Please Verify Your E mail First'})
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
              return done(null, user)
            } else {
              return done(null, false, { message: 'Password incorrect' })
            }
          } catch (e) {
            return done(e)
          }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser(async (id, done) => {
    return done(null, await User.findById({_id:id}))
  })
}

module.exports=initialize
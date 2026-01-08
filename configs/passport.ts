import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model";



passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: "http://ec2-13-233-23-20.ap-south-1.compute.amazonaws.com:4000/api/auth/google",
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error("Google account has no email"), undefined);
                }

                let user = await User.findOne({ email });

                if (!user) {
                    user = await User.create({
                        username: profile.displayName,
                        email,
                        profilePic: profile.photos?.[0]?.value || "",
                        googleId: profile.id,
                        provider: "google",
                        isOnline: true,
                        lastLogin: new Date(),
                    });
                } else {
                    user.isOnline = true;
                    user.lastLogin = new Date();
                    await user.save();
                }

                return done(null, user.toObject() as any);
            } catch (error) {
                return done(error as any, undefined);
            }
        }
    )
);

export default passport;

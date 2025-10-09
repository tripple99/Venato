import passport from "passport";

import { Strategy as TwitterStrategy } from "passport-twitter";
import {Strategy as GoogleStrategy}from "passport-google-oauth20";
import {Strategy as FacebookStrategy}from "passport-facebook";
import { Strategy as LocalStrategy } from "passport-local";
import {OauthProvider} from "../resources/auths/auth.interface";
import AuthService from "../resources/auths/auth.service";
import authModel from "../resources/auths/auth.model";


const authService = new AuthService();



passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
},
async(email,password,done)=>{
    try {
        const user = await authModel.findOne({email});
        if(!user) return done(null,false, {message: "User not found"});
        const isMatch = await user.isValidPassword(password);
        if(!isMatch) return done(null,false, {message: "Invalid credentials"});
        return done(null,user);
    } catch (error) {
        return done(error);
    }
}))



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: `${process.env.baseUrl}/auth/google/callback`,
},
async(_accessToken,_refreshToken,profile,done)=>{
    try{
     const user= await authService.loginWithOauth(profile,OauthProvider.Google);   
     return done(null,user);
    }catch(error){
        return done(error);
    }
}))


passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_API_KEY || "",
    consumerSecret: process.env.TWITTER_API_SECRET || "",
    callbackURL: `${process.env.baseUrl}/auth/twitter/callback`,
},
async(_accessToken,_refreshToken,profile,done)=>{
    try {
        const user = await authService.loginWithOauth(profile,OauthProvider.Twitter)
        return done(null,user)
    } catch (error) {
        return done(error)
    }
}
))
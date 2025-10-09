// import express from "express";
// import jwt from "jsonwebtoken";
// import cookie from "cookie";
// import dotenv from "dotenv";
// import Auth from "../models/Admin.js";

// dotenv.config();

// const authUser = async (req, res, next) => {
//   const refreshToken = req.cookies.refreshToken;
//   try {
//     if (!refreshToken) {
//       return res.status(401).json({ message: "Token not found" });
//     }
//     jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
//       if (err) return res.status(403).json({ message: "Invalid Token" });
//       req.user = user.userEmail;
//       req.email = user.userName;
//       next();
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// export const authAdmin = async (req, res, next) => {
//   const acessToken = req.cookies.acessToken;
//   try {
//     if (!acessToken) {
//       return res.status(400).json({ message: "Token not found" });
//     }
//     const decoded = jwt.verify(acessToken, process.env.ACCESS_TOKEN);
  
//     const userb = await Auth.findOne({sessionToken:acessToken}).lean()

//     if(!userb || userb.sessionToken !== acessToken){
//       res.status(401).json({message:'Unauthorised user'})
//     }
//     req.user = decoded.userEmail;
//     req.email = decoded.userName;
//     next();
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: `Error says this : ${error.message}` });
//   }
// };

// export default authUser;

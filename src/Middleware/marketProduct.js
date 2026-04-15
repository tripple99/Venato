import Auth from "../models/Admin.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";


const checkAllowedMarkets = async (req, res, next) => {
  try {
    if (!req.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await Auth.findOne({ email: req.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === 'User') {
      return res.status(403).json({ message: "Access denied: Users cannot access market operations" });
    }

    // Check if user has No access to any market
    if (!user.allowedMarkets) {
      return res.status(403).json({ message: "Access denied: No market access assigned" });
    }

    // Verify the market exists
    const collection = mongoose.connection.collection("market");
    const market = await collection.findOne({ name: user.allowedMarkets });
    
    if (!market) {
      return res.status(404).json({ message: "Assigned market not found" });
    }

    // Attach market info to request for later use
    req.market = market;
    next();
  } catch (error) {
    logger.error("Market access check error:", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error during market access check" });
  }
};

export default checkAllowedMarkets;

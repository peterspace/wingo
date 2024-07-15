const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    ipAddress: String, //'',
    deviceId: String, // profile.id,
    userLink: String, // profile.id,
    advertiserTrackingId: String,
    affiliateLink: String,
    email: String,
    phone: String,
    country: String,
    appInstalled: { type: Boolean, default: false },
    userIpAddresses: [String], // array of ips by same user. default been index 0

    role: {
      type: String,
      default: "User", // "User" and "Admin"
      // default:
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

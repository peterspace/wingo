const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    ipAddress: String, //'',
    deviceId: String, // profile.id,
    userLink: String, // profile.id,
    advertiserTrackingId: String,
    affiliateLink: String,
    email: String,
    phone: String,
    country: String,

    role: {
      type: String,
      default: "User", // "User" and "Admin"
      // default:
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);
module.exports = Purchase;

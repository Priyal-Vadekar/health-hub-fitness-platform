const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Payment = require("../models/Payment");
const UserMembership = require("../models/UserMembership");
const User = require("../models/User");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Find all payments and populate userMembership and user
  const payments = await Payment.find().populate({
    path: "userMembership",
    populate: { path: "user", select: "name email" }
  });

  let broken = [];
  for (const p of payments) {
    if (!p.userMembership) {
      broken.push({ paymentId: p._id, reason: "Missing userMembership" });
    } else if (!p.userMembership.user) {
      broken.push({ paymentId: p._id, userMembershipId: p.userMembership._id, reason: "Missing user" });
    }
  }

  if (broken.length === 0) {
    console.log("No orphaned payments found. All payments are linked to valid users.");
  } else {
    console.log("Orphaned payments found:");
    console.table(broken);

    // Optional: Uncomment to delete these payments
    // for (const b of broken) {
    //   await Payment.findByIdAndDelete(b.paymentId);
    //   console.log(`Deleted payment ${b.paymentId}`);
    // }
  }

  await mongoose.disconnect();
}

main();

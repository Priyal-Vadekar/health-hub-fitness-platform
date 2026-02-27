const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const Payment = require("../models/Payment");
const UserMembership = require("../models/UserMembership");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Find all payments and populate userMembership and user
  const payments = await Payment.find().populate({
    path: "userMembership",
    populate: { path: "user", select: "name email" }
  });

  let toDelete = [];
  for (const p of payments) {
    if (!p.userMembership || !p.userMembership.user) {
      toDelete.push(p._id);
    }
  }

  if (toDelete.length === 0) {
    console.log("No orphaned payments to delete.");
  } else {
    console.log(`Deleting ${toDelete.length} orphaned payments...`);
    for (const id of toDelete) {
      await Payment.findByIdAndDelete(id);
      console.log(`Deleted payment ${id}`);
    }
    console.log("Done.");
  }

  await mongoose.disconnect();
}

main();

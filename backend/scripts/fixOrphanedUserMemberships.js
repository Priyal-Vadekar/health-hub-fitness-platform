const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const UserMembership = require("../models/UserMembership");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Find a valid user to use as the fallback
  const fallbackUser = await User.findOne();
  if (!fallbackUser) {
    console.error("No users found in the database. Cannot fix orphaned memberships.");
    process.exit(1);
  }
  console.log(`Using fallback user: ${fallbackUser._id} (${fallbackUser.name || fallbackUser.email})`);

  const memberships = await UserMembership.find();
  let fixed = 0;

  for (const m of memberships) {
    const user = await User.findById(m.user);
    if (!user) {
      await UserMembership.findByIdAndUpdate(m._id, { user: fallbackUser._id });
      console.log(`Fixed userMembership ${m._id}: set user to ${fallbackUser._id}`);
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log("No orphaned userMemberships found.");
  } else {
    console.log(`Fixed ${fixed} orphaned userMemberships.`);
  }

  await mongoose.disconnect();
}

main();

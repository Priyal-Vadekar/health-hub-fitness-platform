const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const UserMembership = require("../models/UserMembership");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const memberships = await UserMembership.find();
  let broken = [];

  for (const m of memberships) {
    const user = await User.findById(m.user);
    if (!user) {
      broken.push({
        userMembershipId: m._id,
        missingUserId: m.user
      });
    }
  }

  if (broken.length === 0) {
    console.log("All userMemberships reference valid users.");
  } else {
    console.log("UserMemberships with missing users:");
    console.table(broken);
  }

  await mongoose.disconnect();
}

main();

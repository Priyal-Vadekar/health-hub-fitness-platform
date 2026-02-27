const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find();
  const plans = await MembershipPlan.find();
  if (plans.length === 0) {
    console.error("No membership plans found. Please seed plans first.");
    process.exit(1);
  }
  const defaultPlan = plans[0];

  let created = 0;
  for (const user of users) {
    const existing = await UserMembership.findOne({ user: user._id });
    if (!existing) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (defaultPlan.duration || 1));
      const totalPrice = defaultPlan.price + (defaultPlan.personalTrainerCharge || 0);

      await UserMembership.create({
        user: user._id,
        membershipPlan: defaultPlan._id,
        startDate,
        endDate,
        totalPrice,
        isActive: true
      });
      created++;
    }
  }
  console.log(`Created ${created} missing user memberships.`);
  await mongoose.disconnect();
}

main();


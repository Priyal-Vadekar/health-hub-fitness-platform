const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");

const TARGET_PLAN_ID = "6817cf897bf22910ce24517a";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Check if the plan exists
  const plan = await MembershipPlan.findById(TARGET_PLAN_ID);
  if (!plan) {
    console.error("Target membership plan not found!");
    process.exit(1);
  }

  const users = await User.find();
  let created = 0, updated = 0, removed = 0;

  for (const user of users) {
    const memberships = await UserMembership.find({ user: user._id });

    if (memberships.length === 0) {
      // Create a new membership for this user
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (plan.duration || 1));
      const totalPrice = plan.price + (plan.personalTrainerCharge || 0);

      await UserMembership.create({
        user: user._id,
        membershipPlan: plan._id,
        startDate,
        endDate,
        totalPrice,
        isActive: true
      });
      created++;
      console.log(`Created membership for user ${user._id}`);
    } else {
      // If more than one, keep the first, remove the rest
      const [keep, ...extras] = memberships;
      if (extras.length > 0) {
        for (const extra of extras) {
          await UserMembership.findByIdAndDelete(extra._id);
          removed++;
          console.log(`Removed extra membership ${extra._id} for user ${user._id}`);
        }
      }
      // Ensure the kept membership points to the correct plan
      if (String(keep.membershipPlan) !== TARGET_PLAN_ID) {
        keep.membershipPlan = plan._id;
        keep.startDate = keep.startDate || new Date();
        keep.endDate = new Date(keep.startDate);
        keep.endDate.setMonth(keep.endDate.getMonth() + (plan.duration || 1));
        keep.totalPrice = plan.price + (plan.personalTrainerCharge || 0);
        await keep.save();
        updated++;
        console.log(`Updated membership ${keep._id} for user ${user._id} to target plan`);
      }
    }
  }

  console.log(`Created: ${created}, Updated: ${updated}, Removed extras: ${removed}`);
  await mongoose.disconnect();
}

main();

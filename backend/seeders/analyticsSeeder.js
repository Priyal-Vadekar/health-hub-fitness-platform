const mongoose = require("mongoose");
const User = require("../models/User");
const UserMembership = require("../models/UserMembership");
const MembershipPlan = require("../models/MembershipPlan");
const Payment = require("../models/Payment");
const DietPlans = require("../models/DietPlans");
const AssignedDietPlan = require("../models/AssignedDietPlan");
const Staff = require("../models/Staff");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/healthhub",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const generateRandomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const generateTransactionId = () => {
  return "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const seedAnalyticsData = async () => {
  try {
    console.log("Starting comprehensive analytics data seeding...");

    // 3. Create User Memberships
    console.log("Creating user memberships...");
    const userMemberships = [];
    for (let i = 0; i < 15; i++) {
      const user = members[Math.floor(Math.random() * members.length)];
      const plan =
        membershipPlans[Math.floor(Math.random() * membershipPlans.length)];
      const startDate = generateRandomDate(
        new Date("2023-01-01"),
        new Date("2024-12-31")
      );

      const membership = new UserMembership({
        user: user._id,
        membershipPlan: plan._id,
        startDate: startDate,
        totalPrice: plan.price + (plan.personalTrainerCharge || 0),
        isActive: Math.random() > 0.2,
      });

      await membership.save();
      userMemberships.push(membership);
    }

    // 4. Create Payments (Revenue data)
    console.log("Creating payments...");
    const paymentMethods = ["Credit Card", "PayPal", "Bank Transfer", "Cash"];
    const paymentStatuses = ["Completed", "Pending", "Failed"];

    for (let i = 0; i < 15; i++) {
      const membership =
        userMemberships[Math.floor(Math.random() * userMemberships.length)];
      const paymentDate = generateRandomDate(
        new Date("2023-01-01"),
        new Date("2024-12-31")
      );
      const status =
        paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

      const payment = new Payment({
        userMembership: membership._id,
        amount: Math.floor(Math.random() * 5000) + 1000,
        paymentMethod:
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transactionId: generateTransactionId(),
        status: status,
        paymentDate: paymentDate,
      });

      await payment.save();
    }

    // 5. Create Staff Records for Trainers
    console.log("Creating staff records...");
    const specialties = [
      "Weight Training",
      "Cardio",
      "Yoga",
      "Nutrition",
      "CrossFit",
    ];
    for (const trainer of trainers) {
      const staff = new Staff({
        user: trainer._id,
        role: "Trainer",
        description: "Certified fitness trainer",
        specialty: specialties[Math.floor(Math.random() * specialties.length)],
        image: "staffImages/default.jpg",
      });
      await staff.save();
    }

    // 6. Create Diet Plans
    console.log("Creating diet plans...");
    const dietPlans = [];
    const categories = [
      "Weight Loss",
      "Muscle Gain",
      "Maintenance",
      "Athletic Performance",
    ];
    const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snack"];
    const foodItems = [
      "Oatmeal with fruits",
      "Grilled chicken breast",
      "Salmon with vegetables",
      "Protein shake",
      "Greek yogurt",
      "Brown rice",
      "Sweet potato",
      "Broccoli",
      "Spinach",
      "Eggs",
      "Avocado",
      "Nuts and seeds",
    ];

    for (let i = 0; i < 15; i++) {
      const trainer = trainers[Math.floor(Math.random() * trainers.length)];
      const meals = mealTimes.map((time) => ({
        timeOfDay: time,
        items: [
          foodItems[Math.floor(Math.random() * foodItems.length)],
          foodItems[Math.floor(Math.random() * foodItems.length)],
        ],
      }));

      const dietPlan = new DietPlans({
        trainer: trainer._id,
        category: categories[Math.floor(Math.random() * categories.length)],
        meals: meals,
      });

      await dietPlan.save();
      dietPlans.push(dietPlan);
    }

    // 7. Create Assigned Diet Plans
    console.log("Creating assigned diet plans...");
    for (let i = 0; i < 15; i++) {
      const trainer = trainers[Math.floor(Math.random() * trainers.length)];
      const member = members[Math.floor(Math.random() * members.length)];
      const dietPlan = dietPlans[Math.floor(Math.random() * dietPlans.length)];

      const assignedPlan = new AssignedDietPlan({
        trainer: trainer._id,
        member: member._id,
        dietPlan: dietPlan._id,
        assignedAt: generateRandomDate(
          new Date("2023-01-01"),
          new Date("2024-12-31")
        ),
      });

      await assignedPlan.save();
    }

    console.log("Analytics data seeding completed successfully!");
    console.log(
      `Created: ${members.length} members, ${trainers.length} trainers, ${userMemberships.length} memberships, 15 payments, ${dietPlans.length} diet plans, 15 assigned plans`
    );
  } catch (error) {
    console.error("Error seeding analytics data:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
seedAnalyticsData();

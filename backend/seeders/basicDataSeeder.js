const mongoose = require('mongoose');
const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedBasicData = async () => {
  try {
    console.log('Starting basic data seeding...');

    // Check if users exist
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      console.log('Creating sample users...');
      
      // Create sample members
      const members = [
        { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'Member' },
        { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'Member' },
        { name: 'Mike Johnson', email: 'mike@example.com', password: 'password123', role: 'Member' },
        { name: 'Sarah Wilson', email: 'sarah@example.com', password: 'password123', role: 'Member' },
        { name: 'David Brown', email: 'david@example.com', password: 'password123', role: 'Member' },
        { name: 'Lisa Davis', email: 'lisa@example.com', password: 'password123', role: 'Member' },
        { name: 'Tom Miller', email: 'tom@example.com', password: 'password123', role: 'Member' },
        { name: 'Emma Wilson', email: 'emma@example.com', password: 'password123', role: 'Member' },
        { name: 'Alex Taylor', email: 'alex@example.com', password: 'password123', role: 'Member' },
        { name: 'Sophie Anderson', email: 'sophie@example.com', password: 'password123', role: 'Member' }
      ];

      for (const member of members) {
        const user = new User(member);
        await user.save();
      }

      // Create sample trainers
      const trainers = [
        { name: 'Trainer Alex', email: 'trainer1@example.com', password: 'password123', role: 'Trainer' },
        { name: 'Trainer Maria', email: 'trainer2@example.com', password: 'password123', role: 'Trainer' },
        { name: 'Trainer Chris', email: 'trainer3@example.com', password: 'password123', role: 'Trainer' },
        { name: 'Trainer Emma', email: 'trainer4@example.com', password: 'password123', role: 'Trainer' },
        { name: 'Trainer James', email: 'trainer5@example.com', password: 'password123', role: 'Trainer' }
      ];

      for (const trainer of trainers) {
        const user = new User(trainer);
        await user.save();
      }

      console.log('Sample users created successfully!');
    } else {
      console.log('Users already exist, skipping user creation...');
    }

    // Check if membership plans exist
    const existingPlans = await MembershipPlan.countDocuments();
    if (existingPlans === 0) {
      console.log('Creating sample membership plans...');
      
      const plans = [
        {
          plan: '1-month',
          title: 'Basic Plan',
          description: 'Access to gym facilities and basic equipment',
          duration: 1, // 1 month
          price: 1500,
          personalTrainerAvailable: false,
          personalTrainerCharge: 0,
          benefits: ['Access to gym facilities', 'Basic equipment usage', 'Locker room access']
        },
        {
          plan: '3-month',
          title: 'Premium Plan',
          description: 'Full access to gym facilities, equipment, and group classes',
          duration: 3, // 3 months
          price: 4000,
          personalTrainerAvailable: true,
          personalTrainerCharge: 500,
          benefits: ['Full gym access', 'Group classes', 'Personal trainer option', 'Sauna access']
        },
        {
          plan: '6-month',
          title: 'Elite Plan',
          description: 'Premium access with personal trainer sessions',
          duration: 6, // 6 months
          price: 7500,
          personalTrainerAvailable: true,
          personalTrainerCharge: 1000,
          benefits: ['All premium features', 'Personal trainer sessions', 'Nutrition consultation', 'Priority booking']
        }
      ];

      for (const plan of plans) {
        const membershipPlan = new MembershipPlan(plan);
        await membershipPlan.save();
      }

      console.log('Sample membership plans created successfully!');
    } else {
      console.log('Membership plans already exist, skipping plan creation...');
    }

    console.log('Basic data seeding completed!');
    console.log('You can now run the analytics seeder to populate analytics data.');

  } catch (error) {
    console.error('Error seeding basic data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
seedBasicData(); 
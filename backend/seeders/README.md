# Database Seeders

This directory contains scripts to populate your database with sample data for testing and development.

## Available Seeders

### 1. Basic Data Seeder (`basicDataSeeder.js`)

Creates foundational data needed for the application:

- Sample users (members and trainers)
- Sample membership plans

### 2. Analytics Data Seeder (`analyticsSeeder.js`)

Creates data for analytics and reporting:

- User memberships
- Payments (for revenue tracking)
- Diet plans
- Assigned diet plans (for trainer performance)
- Staff records

## How to Run

### Option 1: Using npm scripts (Recommended)

```bash
# Run basic seeder only (users and membership plans)
npm run seed:basic

# Run analytics seeder only (requires basic data to exist)
npm run seed:analytics

# Run both seeders in sequence
npm run seed:all
```

### Option 2: Direct execution

```bash
# Run basic seeder
node seeders/basicDataSeeder.js

# Run analytics seeder
node seeders/analyticsSeeder.js
```

## Prerequisites

1. **MongoDB Connection**: Ensure your MongoDB is running and the connection string is set in your environment variables (`MONGODB_URI`).

2. **Environment Variables**: Make sure your `.env` file contains:
   ```
   MONGODB_URI=mongodb://localhost:27017/gym_management
   ```

## What Data is Created

### Basic Seeder

- **10 Members**: John Doe, Jane Smith, Mike Johnson, etc.
- **5 Trainers**: Trainer Alex, Trainer Maria, Trainer Chris, etc.
- **3 Membership Plans**: Basic Plan (₹1500), Premium Plan (₹4000), Elite Plan (₹7500)

### Analytics Seeder

- **30 User Memberships**: Random assignments of users to membership plans
- **50 Payments**: Mix of completed, pending, and failed payments with amounts ₹1000-6000
- **15 Diet Plans**: Various categories (Weight Loss, Muscle Gain, Maintenance, Athletic Performance)
- **40 Assigned Diet Plans**: Random assignments of diet plans to members by trainers
- **Staff Records**: Creates staff records for trainers if they don't exist

## Data Distribution

The seeders create realistic data with:

- **Payment Status Distribution**: ~70% Completed, ~20% Pending, ~10% Failed
- **Membership Activity**: ~80% active memberships
- **Payment Amounts**: Random amounts between ₹1000-6000
- **Date Range**: Data spread across 2023-2024 for meaningful analytics

## Troubleshooting

### "Users already exist" message

This is normal if you've run the seeder before. The seeder checks for existing data and skips creation if data already exists.

### "Please ensure you have users and membership plans"

Run the basic seeder first: `npm run seed:basic`

### Connection errors

Check that:

1. MongoDB is running
2. Your `MONGODB_URI` environment variable is correct
3. You're in the backend directory when running the scripts

## After Running Seeders

Once you've populated your database, your admin dashboard should display:

- **Membership Growth Chart**: Shows user registration over time
- **Revenue Chart**: Shows monthly revenue from payments
- **Outstanding Payments Table**: Lists pending payments
- **Trainer Performance Table**: Shows how many diet plans each trainer has assigned
- **Diet Plan Popularity Chart**: Shows which diet plans are most popular

## Resetting Data

To start fresh, you can manually delete collections from MongoDB or drop the entire database:

```bash
# Connect to MongoDB shell
mongosh

# Drop the database
use gym_management
db.dropDatabase()
```

Then run the seeders again.

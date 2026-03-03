// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "./Components/context/AuthProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout Components
import Header from './Components/layout/Header';
import Footer from './Components/layout/Footer';

// Page Components
import { Home } from './Components/pages/Home';
import { About } from './Components/pages/About';
import { Contact } from './Components/pages/Contact';
import AnnouncementPage from './Components/pages/AnnouncementPage';

// Auth Components
import Login from './Components/auth/Login';
import Register from './Components/auth/Register';
import ForgotPassword from "./Components/auth/ForgotPassword";
import ResetPasswordPage from "./Components/auth/ResetPasswordPage";
import VerifyEmail from "./Components/auth/VerifyEmail";

// Workout Components
import Workouts from './Components/workouts/Workouts';
import GymCalendar from './Components/workouts/GymCalendar';

// Profile Components
import MyProfile from './Components/profile/MyProfile';
import ProgressTracking from './Components/profile/ProgressTracking';
import MealLogging from './Components/profile/MealLogging';

// Membership Components
import Membership from './Components/membership/Membership';
import MembershipManagement from './Components/membership/MembershipManagement';
import MembershipPlan from './Components/membership/MembershipPlan';
import PaymentPage from "./Components/membership/PaymentPage";
import StripePaymentPage from "./Components/membership/StripePaymentPage";
import PaymentSuccess from "./Components/membership/PaymentSuccess";
import PaymentCancel from "./Components/membership/PaymentCancel";
import CheckoutPage from "./Components/membership/CheckoutPage";
import RazorpayPaymentPage from "./Components/membership/RazorpayPaymentPage";
import RazorpaySuccess from "./Components/membership/RazorpaySuccess";
import RazorpayCancel from "./Components/membership/RazorpayCancel";
import ChoosePaymentMethod from "./Components/membership/ChoosePaymentMethod";
import FakeErrorPage from "./Components/membership/FakeErrorPage";
import TrainerCheckout from "./Components/membership/TrainerCheckout";
import TrainerBookingSuccess from "./Components/membership/TrainerBookingSuccess";
import TrainerBooking from "./Components/membership/TrainerBooking";

// Dashboard Components
import DietitianDashboard from "./Components/Dietitian/DietitianDashboard";
import MemberDashboard from "./Components/Member/MemberDashboard";
import TrainerDashboard from "./Components/Trainer/TrainerDashboard";

// Common Components
import { Feedback } from './Components/common/Feedback';
import { Trainer } from './Components/common/Trainer';
import DietPlan from './Components/common/DietPlan';
import Logout from './Components/common/Logout';

// Admin Components
import { Index } from "./Components/Admin/Index";
import AdminMyProfile from "./Components/Admin/Myprofile";
import TrainerList from "./Components/Admin/Trainer";
import StaffList from "./Components/Admin/staffs";
import UserList from "./Components/Admin/users";
import Workout from "./Components/Admin/Workout";
import ShowExercises from "./Components/Admin/ShowExercises";
import DietPlanList from "./Components/Admin/DietPlan";
import PaymentsList from "./Components/Admin/Transaction";
import Announcement from './Components/Admin/Announcement';
import FeedbackList from "./Components/Admin/Feedback";
import MembershipPlans from "./Components/Admin/MembershipPlan";
import DietitiansList from "./Components/Admin/Dietitians";
import RoleSimulator from "./Components/Admin/RoleSimulator";

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main className='content-container'>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/announcement" element={<AnnouncementPage />} />
            <Route path="/trainer" element={<Trainer />} />
            <Route path="/dietplan" element={<DietPlan />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Workout Routes */}
            <Route path="/gym-workouts" element={<Workouts workoutId="68178f597f016591cf92673d" />} />
            <Route path="/home-workouts" element={<Workouts workoutId="68178f597f016591cf92673f" />} />
            <Route path="/calendar" element={<GymCalendar />} />

            {/* Profile Routes */}
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/progress" element={<ProgressTracking />} />
            <Route path="/meal-logging" element={<MealLogging />} />

            {/* Membership Routes */}
            <Route path="/membership" element={<MembershipManagement />} />
            <Route path="/membership-plan" element={<MembershipPlan />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/stripe-payment" element={<StripePaymentPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/razorpay-payment" element={<RazorpayPaymentPage />} />
            <Route path="/razorpay-success" element={<RazorpaySuccess />} />
            <Route path="/razorpay-cancel" element={<RazorpayCancel />} />
            <Route path="/razorpay-failed" element={<RazorpaySuccess />} />
            <Route path="/choose-payment" element={<ChoosePaymentMethod />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            <Route path="/payment-error" element={<FakeErrorPage />} />

            {/* Trainer Session Booking Routes */}
            <Route path="/book-trainer/:trainerId" element={<TrainerBooking />} />
            <Route path="/book-trainer" element={<TrainerBooking />} />
            <Route path="/trainer-checkout" element={<TrainerCheckout />} />
            <Route path="/trainer-booking-success" element={<TrainerBookingSuccess />} />

            {/* Trainer Dashboard */}
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />

            {/* Dietitian Routes */}
            <Route path="/dietitian" element={<DietitianDashboard />} />

            {/* Member Routes */}
            <Route path="/member-dashboard" element={<MemberDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin/" element={<Index />} />
            <Route path="/admin/myprofile" element={<AdminMyProfile />} />
            <Route path="/admin/trainer" element={<TrainerList />} />
            <Route path="/admin/dietitians" element={<DietitiansList />} />
            <Route path="/admin/staff" element={<StaffList />} />
            <Route path="/admin/users" element={<UserList />} />
            <Route path="/admin/membershipplan" element={<MembershipPlans />} />
            <Route path="/admin/workout" element={<Workout />} />
            <Route path="/admin/dietplan" element={<DietPlanList />} />
            <Route path="/admin/transaction" element={<PaymentsList />} />
            <Route path="/admin/feedback" element={<FeedbackList />} />
            <Route path="/admin/announcement" element={<Announcement />} />
            <Route path="/admin/role-simulator" element={<RoleSimulator />} />
            <Route path="/admin/show-exercises/:id" element={<ShowExercises />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
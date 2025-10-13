import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/organisms/Header";
import { Footer } from "./components/organisms/Footer";
import { HomePage } from "./pages/HomePage";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CreateListing } from "./pages/CreateListing";
import { EditListing } from "./pages/EditListing";
import { MyListings } from "./pages/MyListings";
import { Trash } from "./pages/Trash";
import { LoginForm } from "./components/organisms/auth/LoginForm";
import { RegisterForm } from "./components/organisms/auth/RegisterForm";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { AuthCallback } from "./pages/AuthCallback";
import { ToastProvider } from "./contexts/ToastContext";
import { About } from "./pages/footer/About";
import { HowItWorks } from "./pages/footer/HowItWorks";
import { Careers } from "./pages/footer/Careers";
import { Contact } from "./pages/footer/Contact";
import { FAQ } from "./pages/footer/FAQ";
import { Terms } from "./pages/footer/Terms";
import { Privacy } from "./pages/footer/Privacy";
import { HelpCenter } from "./pages/footer/HelpCenter";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly) {
    // Check admin status using roleId or role
    const roleId =
      user?.roleId || profile?.roleId || user?.role || profile?.role;
    const roleName = (
      user?.roleName ||
      profile?.roleName ||
      user?.role ||
      profile?.role ||
      ""
    )
      .toString()
      .toLowerCase();
    const isAdmin = roleId === 1 || roleId === "1" || roleName === "admin";

    if (!isAdmin) {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Footer informational pages */}
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<HelpCenter />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <Trash />
              </ProtectedRoute>
            }
          />

          <Route
            path="/listing/:id/edit"
            element={
              <ProtectedRoute>
                <EditListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

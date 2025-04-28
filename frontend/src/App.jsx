import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

// Pages
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

// Components
import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";

// Stores
import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";

function App() {
  const { user, checkAuth, checkingAuth, error: authError } = useUserStore();
  const { getCartItems } = useCartStore();
  const navigate = useNavigate();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Check authentication on app load
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkUserAuth();
  }, [checkAuth]);

  // Load cart items when user is authenticated
  useEffect(() => {
    if (user) {
      getCartItems().catch(err => console.error("Error fetching cart:", err));
    }
  }, [getCartItems, user]);

  // Handle authentication errors
  useEffect(() => {
    if (authError === "Session expired" && initialCheckDone) {
      navigate("/login");
    }
  }, [authError, navigate, initialCheckDone]);

  // Show loading spinner only during initial auth check
  if (checkingAuth && !initialCheckDone) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#2D1C24] text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(255,107,156,0.3)_0%,rgba(232,77,138,0.2)_45%,rgba(0,0,0,0.1)_100%)]" />
        </div>
      </div>

      <div className="relative z-50 pt-20">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route
            path="/secret-dashboard"
            element={user?.role === "admin" ? <AdminPage /> : <Navigate to="/login" />}
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/cart" element={user ? <CartPage /> : <Navigate to="/login" />} />
          <Route
            path="/purchase-success"
            element={user ? <PurchaseSuccessPage /> : <Navigate to="/login" />}
          />
          <Route path="/purchase-cancel" element={user ? <PurchaseCancelPage /> : <Navigate to="/login" />} />
          {/* Catch-all route for 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2D1C24',
            color: '#FFF',
            border: '1px solid rgba(255,107,156,0.3)',
          },
          success: {
            iconTheme: {
              primary: '#FF6B9C',
              secondary: '#FFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#E84D8A',
              secondary: '#FFF',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
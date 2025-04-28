import { Navigate, Route, Routes } from "react-router-dom";
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
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();
	const [authError, setAuthError] = useState(null);

	// Handle authentication
	useEffect(() => {
		const initAuth = async () => {
			try {
				await checkAuth();
				setAuthError(null);
			} catch (error) {
				logError("App - initAuth", error);
				setAuthError("Unable to authenticate. Please try again later.");
			}
		};
		
		initAuth();
	}, [checkAuth]);

	// Get cart items when user is authenticated
	useEffect(() => {
		const loadCartItems = async () => {
			if (!user) return;
			try {
				await getCartItems();
			} catch (error) {
				logError("App - loadCartItems", error);
				// No need to show error here as it's handled in the store
			}
		};
		
		loadCartItems();
	}, [getCartItems, user]);

	// Show loading spinner while checking authentication
	if (checkingAuth) {
		return (
			<div className="bg-gray-900 min-h-screen">
				<LoadingSpinner />
			</div>
		);
	}

	// Show auth error if there's an issue
	if (authError) {
		return (
			<div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 text-white">
				<div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
					<h2 className="text-xl text-red-400 mb-4">Authentication Error</h2>
					<p className="text-gray-300 mb-6">{authError}</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-900 text-white relative overflow-hidden'>
			{/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]' />
				</div>
			</div>

			<div className='relative z-50 pt-20'>
				<Navbar />
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route
						path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
					<Route
						path='/purchase-success'
						element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />}
					/>
					<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
				</Routes>
			</div>
			<Toaster 
				position="top-center"
				toastOptions={{
					duration: 3000,
					style: {
						background: '#333',
						color: '#fff',
					},
					success: {
						style: {
							background: '#10B981',
						},
					},
					error: {
						style: {
							background: '#EF4444',
						},
						duration: 4000,
					},
				}}
			/>
		</div>
	);
}

export default App;
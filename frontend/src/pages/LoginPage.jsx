import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Loader } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const { login, loading } = useUserStore();

	const handleSubmit = (e) => {
		e.preventDefault();
		login(email, password);
	};

	return (
		<div className="flex min-h-screen relative overflow-hidden">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
				<div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-pink-500/30 to-purple-500/20 rounded-bl-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-pink-500/20 to-purple-500/10 rounded-tr-full blur-3xl"></div>
				<div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-pink-400/20 to-transparent rounded-full blur-xl"></div>
			</div>

			{/* Content */}
			<div className="flex flex-col md:flex-row w-full">
				{/* Left side - decorative/branding area */}
				<motion.div 
					className="hidden md:flex md:w-1/2 bg-gradient-to-br from-pink-600 to-purple-700 justify-center items-center p-12"
					initial={{ x: -100, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.8 }}
				>
					<div className="text-white max-w-md">
						<h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
						<p className="text-pink-100 mb-8 text-lg">
							Log in to access your account and continue your shopping experience with exclusive offers and personalized recommendations.
						</p>
						<div className="space-y-4">
							<div className="flex items-center">
								<div className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center mr-4">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<span>Special offers exclusively for members</span>
							</div>
							<div className="flex items-center">
								<div className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center mr-4">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<span>Fast checkout with saved preferences</span>
							</div>
							<div className="flex items-center">
								<div className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center mr-4">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
									</svg>
								</div>
								<span>Personalized shopping experience</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Right side - login form */}
				<motion.div 
					className="w-full md:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24"
					initial={{ x: 100, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					<div className="max-w-md mx-auto w-full">
						<h2 className="text-4xl font-bold text-center mb-2 text-pink-500">Login</h2>
						<p className="text-gray-400 text-center mb-8">Enter your credentials to access your account</p>

						<div className="bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-700">
							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
										Email address
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Mail className="h-5 w-5 text-pink-400" aria-hidden="true" />
										</div>
										<input
											id="email"
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="block w-full px-3 py-3 pl-10 bg-gray-700/50 border border-gray-600 
											rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 
											focus:border-pink-500 transition-all duration-200"
											placeholder="you@example.com"
										/>
									</div>
								</div>

								<div>
									<div className="flex justify-between items-center mb-2">
										<label htmlFor="password" className="block text-sm font-medium text-gray-300">
											Password
										</label>
										<a href="#" className="text-sm text-pink-400 hover:text-pink-300">
											Forgot password?
										</a>
									</div>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Lock className="h-5 w-5 text-pink-400" aria-hidden="true" />
										</div>
										<input
											id="password"
											type="password"
											required
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="block w-full px-3 py-3 pl-10 bg-gray-700/50 border border-gray-600 
											rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 
											focus:border-pink-500 transition-all duration-200"
											placeholder="••••••••"
										/>
									</div>
								</div>

								<div>
									<button
										type="submit"
										className="w-full flex justify-center py-3 px-4 border border-transparent 
										rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 
										hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2
										focus:ring-pink-500 transition-all duration-200 hover:shadow-pink-500/30 
										disabled:opacity-50 transform hover:-translate-y-1"
										disabled={loading}
									>
										{loading ? (
											<>
												<Loader className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
												Logging in...
											</>
										) : (
											<>
												<LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
												Login to Account
											</>
										)}
									</button>
								</div>
							</form>

							<div className="mt-8">
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-gray-600"></div>
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-3">
									<button className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-xl
									 shadow-sm bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white focus:outline-none 
									 transition-all duration-200">
										<svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.56V20.34H19.28C21.36 18.42 22.56 15.61 22.56 12.25Z" fill="#4285F4"/>
											<path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.56C14.73 18.19 13.48 18.58 12 18.58C9.02 18.58 6.54 16.61 5.72 13.96H2.05V16.83C3.86 20.52 7.62 23 12 23Z" fill="#34A853"/>
											<path d="M5.72 13.96C5.5 13.34 5.37 12.68 5.37 12C5.37 11.32 5.5 10.66 5.72 10.04V7.17H2.05C1.38 8.64 1 10.28 1 12C1 13.72 1.38 15.36 2.05 16.83L5.72 13.96Z" fill="#FBBC05"/>
											<path d="M12 5.42C13.62 5.42 15.06 5.96 16.21 7.05L19.36 3.92C17.46 2.15 14.97 1 12 1C7.62 1 3.86 3.48 2.05 7.17L5.72 10.04C6.54 7.39 9.02 5.42 12 5.42Z" fill="#EA4335"/>
										</svg>
										Google
									</button>
									<button className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-xl
									 shadow-sm bg-gray-700 hover:bg-gray-600 text-sm font-medium text-white focus:outline-none 
									 transition-all duration-200">
										<svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 16.9913 5.65687 21.1283 10.4375 21.8785V14.8906H7.89844V12H10.4375V9.79688C10.4375 7.29063 11.9304 5.90625 14.2146 5.90625C15.3087 5.90625 16.4531 6.10156 16.4531 6.10156V8.5625H15.1921C13.9499 8.5625 13.5625 9.33334 13.5625 10.1242V12H16.3359L15.8926 14.8906H13.5625V21.8785C18.3431 21.1283 22 16.9913 22 12Z" fill="#1877F2"/>
										</svg>
										Facebook
									</button>
								</div>
							</div>
						</div>

						<p className="mt-8 text-center text-base text-gray-400">
							Not a member yet?{" "}
							<Link to="/signup" className="font-medium text-pink-400 hover:text-pink-300 transition-colors duration-200 flex items-center justify-center mt-2">
								Sign up for an account <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</p>
					</div>
				</motion.div>
			</div>
		</div>
	);
};
export default LoginPage;
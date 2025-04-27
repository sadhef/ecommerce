import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader, PenLine, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signup, loading } = useUserStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };
  
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };
  
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    checkPasswordStrength(password);
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-b from-purple-500/30 to-pink-500/20 rounded-br-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-t from-purple-500/20 to-pink-500/10 rounded-tl-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-bl from-purple-400/20 to-transparent rounded-full blur-xl"></div>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row w-full">
        {/* Left side - signup form */}
        <motion.div 
          className="w-full md:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 order-2 md:order-1"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-4xl font-bold text-center mb-2 text-purple-500">Create Account</h2>
            <p className="text-gray-400 text-center mb-8">Join our community and start shopping</p>

            <div className="bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-purple-400" aria-hidden="true" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full px-3 py-3 pl-10 bg-gray-700/50 border border-gray-600 
                      rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
                      focus:border-purple-500 transition-all duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-purple-400" aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-3 pl-10 bg-gray-700/50 border border-gray-600 
                      rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
                      focus:border-purple-500 transition-all duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-purple-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handlePasswordChange}
                      className="block w-full px-3 py-3 pl-10 bg-gray-700/50 border border-gray-600 
                      rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
                      focus:border-purple-500 transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              passwordStrength === 1 ? 'bg-red-500' : 
                              passwordStrength === 2 ? 'bg-yellow-500' : 
                              passwordStrength === 3 ? 'bg-green-400' : 
                              passwordStrength === 4 ? 'bg-green-500' : ''
                            }`}
                            style={{ width: `${passwordStrength * 25}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {passwordStrength === 0 ? 'Weak' : 
                           passwordStrength === 1 ? 'Fair' : 
                           passwordStrength === 2 ? 'Good' : 
                           passwordStrength === 3 ? 'Strong' : 'Very Strong'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CheckCircle 
                        className={`h-5 w-5 ${
                          formData.confirmPassword && formData.password === formData.confirmPassword 
                          ? 'text-green-400' : 'text-purple-400'
                        }`} 
                        aria-hidden="true" 
                      />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`block w-full px-3 py-3 pl-10 bg-gray-700/50 border 
                      ${formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'} 
                      rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                      transition-all duration-200`}
                      placeholder="••••••••"
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="terms" className="text-sm text-gray-400">
                      I agree to the <a href="#" className="text-purple-400 hover:text-purple-300">Terms of Service</a> and <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent 
                  rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 
                  hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                  focus:ring-purple-500 transition-all duration-200 hover:shadow-purple-500/30 
                  disabled:opacity-50 transform hover:-translate-y-1"
                  disabled={loading || (formData.password !== formData.confirmPassword && formData.confirmPassword)}
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" aria-hidden="true" />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or sign up with</span>
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
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200 flex items-center justify-center mt-2">
                Login to your account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </p>
          </div>
        </motion.div>
        
        {/* Right side - decorative/branding area */}
        <motion.div 
          className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-600 to-pink-700 justify-center items-center p-12 order-1 md:order-2"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="text-white max-w-md">
            <h1 className="text-4xl font-bold mb-6">Join Our Community</h1>
            <p className="text-purple-100 mb-8 text-lg">
              Create your account today and unlock a world of fashion, deals, and personalized experiences designed just for you.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center mr-4">
                  <PenLine className="h-5 w-5" />
                </div>
                <span>Create your unique style profile</span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>Secure checkout and saved payment info</span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span>Exclusive member-only offers and events</span>
              </div>
            </div>

            <div className="mt-12 bg-white/10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Customer" 
                  className="w-12 h-12 rounded-full mr-4 border-2 border-white"
                />
                <div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-yellow-300 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm mt-1 italic">"Creating an account was so easy! I love the personalized recommendations and exclusive deals!"</p>
                  <p className="text-xs mt-2 font-semibold">- Sarah J., Member since 2023</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
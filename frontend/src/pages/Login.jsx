import { Link, useNavigate } from "react-router";
import axios from "axios";
import FormInput from "../components/FormInput";
import { useState } from "react";
import { UserRound, Mail, Lock, ArrowRight, Shield, Fingerprint, Bot, LayoutGrid, Settings, LogIn, User, LifeBuoy } from "lucide-react";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);

    // The URL for your Python backend's login endpoint
    const loginUrl = "http://localhost:8001/api/login/";

    try {
      const response = await axios.post(loginUrl, {
        email: email, // Use the 'email' state directly
        password: password,
      });

      // --- SUCCESS ---
      setIsLoading(false);
      console.log("Login successful:", response.data);
      toast.success("Login successful")

      const user = response.data.user;
      localStorage.setItem("user_id", user.user_id);
      localStorage.setItem("name", user.name);

      navigate(`/chat/${user.user_id}`);

    } catch (err) {
      // --- ERROR ---
      setIsLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        // Error from the API (e.g., "Invalid credentials")
        console.log(err.response.data.message);
      } else {
        // Network or other generic error
        toast("Login failed. Please try again later.");
      }
      console.error("Login error:", err);
    }
  };


  return (
    <div className="h-auto grid place-items-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-20">
      <div className="flex flex-col justify-between md:flex-row">
        {/* Left Side - Visual/Content */}
        <div className="w-full md:w-1/2 relative hidden md:flex items-center justify-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* <div className="absolute -top-60 -left-20 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-float-slow"></div> */}
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-float-slow-delay"></div>
          </div>
          <div className="relative z-20 h-full flex flex-col justify-center items-center p-8 lg:p-12 max-w-2xl">
            {/* Hero Text */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Welcome to Cywarden <span className="text-blue-700">Support</span>
              </h2>
              <p className="text-slate-300 text-lg">
                Your AI-powered assistant for fast, secure insurance help
              </p>
            </div>

            {/* Features */}
            <div className="w-full space-y-6">

              {/* Quick Login */}
              <div className="flex items-start p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300">
                <div className="bg-blue-500/10 p-2 rounded-lg mr-4 mt-0.5">
                  <LogIn className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure Login</h3>
                  <p className="text-slate-400">Access your dashboard safely with multi-layer authentication</p>
                </div>
              </div>

              {/* AI Chat Assistant */}
              <div className="flex items-start p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 hover:border-green-500/30 transition-all duration-300">
                <div className="bg-green-500/10 p-2 rounded-lg mr-4 mt-0.5">
                  <Bot className="text-green-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Instant Chat Support</h3>
                  <p className="text-slate-400">Let our AI guide you through claims, policies, and FAQs</p>
                </div>
              </div>

              {/* Personalized Experience */}
              <div className="flex items-start p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                <div className="bg-purple-500/10 p-2 rounded-lg mr-4 mt-0.5">
                  <User className="text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Personalized Dashboard</h3>
                  <p className="text-slate-400">Tailored insights based on your policies and interactions</p>
                </div>
              </div>

              {/* Help at Every Level */}
              <div className="flex items-start p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 hover:border-yellow-500/30 transition-all duration-300">
                <div className="bg-yellow-500/10 p-2 rounded-lg mr-4 mt-0.5">
                  <LifeBuoy className="text-yellow-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">L1 & L2 Support Ready</h3>
                  <p className="text-slate-400">From quick fixes to expert help—you're always covered</p>
                </div>
              </div>

            </div>
          </div>


        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="bg-slate-800/100 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-500">
              <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl font-bold text-white bg-clip-text">
                  Welcome Back
                </h2>
                <p className="text-slate-400 mt-2">
                  Sign in to your secure dashboard
                </p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-y-6">
                <div className="space-y-5">
                  <div className="relative">
                    <div className="absolute left-3 top-2/3 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <FormInput
                      type="email"
                      label="email"
                      name="email"
                      value={email}
                      handleInputChange={setEmail}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-lg text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-2/3 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <FormInput
                      type="password"
                      label="password"
                      name="password"
                      value={password}
                      handleInputChange={setPassword}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-lg text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* --- MODIFIED --- Submit button with loading state */}
                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-red-400 hover:to-purple-700 rounded-4xl text-white font-medium flex justify-center items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                    {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </form>

              {/* Social Login Divider */}
              <div className="relative mt-8 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <div className="relative bg-slate-800 px-4 text-sm text-slate-400">
                  or continue with
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="flex justify-center items-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-400/30 transition-all duration-300 group">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57C21.08,18.3,22.56,15.57,22.56,12.25Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06c-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l2.85-2.22.81-.62Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="group-hover:text-blue-400 transition-colors">Google</span>
                </button>
                <button className="flex justify-center items-center py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-purple-400/30 transition-all duration-300 group">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-500 group-hover:text-purple-500 transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 16.9913 5.65686 21.1283 10.4375 21.8785V14.8906H7.89844V12H10.4375V9.79688C10.4375 7.29063 11.9304 5.90625 14.2146 5.90625C15.3088 5.90625 16.4531 6.10156 16.4531 6.10156V8.5625H15.1922C13.95 8.5625 13.5625 9.33334 13.5625 10.1242V12H16.3359L15.8926 14.8906H13.5625V21.8785C18.3431 21.1283 22 16.9913 22 12Z" />
                  </svg>
                  <span className="group-hover:text-purple-400 transition-colors">Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
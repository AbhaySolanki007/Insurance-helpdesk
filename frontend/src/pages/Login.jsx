import { Link, useNavigate } from "react-router";
import axios from "axios";
import FormInput from "../components/FormInput";
import { useState } from "react";
import { UserRound, Mail, Lock, ArrowRight, Shield, Fingerprint, Bot, LayoutGrid, Settings, LogIn, User, LifeBuoy, Sparkles, Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loginUrl = "http://localhost:8001/api/login/";

    try {
      const response = await axios.post(loginUrl, {
        email: email,
        password: password,
      });

      setIsLoading(false);
      console.log("Login successful:", response.data);
      toast.success("Login successful")

      const user = response.data.user;
      localStorage.setItem("user_id", user.user_id);
      localStorage.setItem("name", user.name);

      navigate(`/chat/${user.user_id}`);

    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data) {
        if (err.response.status === 401) {
          toast.error("Invalid email or password");
        } else if (err.response.data.message) {
          toast.error(err.response.data.message);
        } else {
          toast.error("Login failed. Please try again later.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-slate-100 to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-cyan-500/5 dark:bg-cyan-500/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        {/* Subtle Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-200/20 via-transparent to-purple-200/20 dark:from-blue-500/5 dark:via-transparent dark:to-purple-500/5 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Enhanced Visual Content */}
          <div className="hidden lg:block relative">
            <div className="relative z-20 space-y-8">
              {/* Hero Section */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-500/5 backdrop-blur-sm rounded-full border border-blue-200 dark:border-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                  <Sparkles size={16} className="animate-pulse" />
                  AI-Powered Insurance Platform
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-gray-100 mb-6 leading-tight">
                  Welcome to
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Cywarden Support
                  </span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-gray-400 leading-relaxed max-w-lg">
                  Experience the future of insurance support with our intelligent AI assistant, designed for speed, security, and seamless interactions.
                </p>
              </div>

              {/* Enhanced Feature Cards */}
              <div className="grid gap-4">
                <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-gray-800 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/5 rounded-xl border border-blue-200 dark:border-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Shield className="text-blue-600 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-slate-900 dark:text-gray-100 group-hover:text-slate-900 dark:group-hover:text-blue-100 transition-colors">
                        Bank-Grade Security
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">
                        Advanced encryption and multi-factor authentication protect your sensitive insurance data
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-gray-800 hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-500/5 rounded-xl border border-green-200 dark:border-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <Zap className="text-green-600 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-slate-900 dark:text-gray-100 group-hover:text-slate-900 dark:group-hover:text-green-100 transition-colors">
                        Lightning Fast AI
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">
                        Get instant answers to complex insurance questions with our advanced AI system
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white/80 dark:bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-gray-800 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-500/5 rounded-xl border border-purple-200 dark:border-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <User className="text-purple-600 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-slate-900 dark:text-gray-100 group-hover:text-slate-900 dark:group-hover:text-purple-100 transition-colors">
                        Smart Personalization
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">
                        Tailored insights and recommendations based on your unique insurance portfolio
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="relative group">
                {/* Outer Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-50 dark:opacity-30"></div>
                
                {/* Top Center Blue Light Glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-30 dark:opacity-20 animate-pulse"></div>
                
                {/* Main Form Container */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/80 via-white/70 to-white/80 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/[0.08] shadow-xl">
                  {/* Glass Shine Effects */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/5"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_50%)]"></div>
                  
                  {/* Glass Border Effects */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/30 dark:via-blue-200/10 to-transparent"></div>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 dark:via-white/10 to-transparent"></div>
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-slate-300/50 dark:via-white/10 to-transparent"></div>
                  <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-slate-300/50 dark:via-white/10 to-transparent"></div>
                  
                  {/* Inner Blue Glow */}
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
                  
                  {/* Content Container with Glass Effect */}
                  <div className="relative p-8 bg-gradient-to-b from-white/5 via-transparent to-white/5 dark:from-white/[0.02] dark:via-transparent dark:to-white/[0.02]">
                    {/* Header */}
                    <div className="text-center mb-8 relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-blue-500/20 dark:via-blue-400/20 to-transparent blur-sm"></div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 [text-shadow:0_4px_8px_rgba(0,0,0,0.1)] dark:[text-shadow:0_4px_8px_rgba(0,0,0,0.2)]">
                        Welcome Back
                      </h2>
                      <p className="text-slate-600 dark:text-gray-400">
                        Sign in to access your secure dashboard
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                      {/* Email Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                          Email Address
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400">
                            <Mail className="transition-transform duration-200 group-focus-within:scale-110" size={20} />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full pl-12 pr-4 py-3 bg-white/40 dark:bg-gray-900/40 border border-slate-200/50 dark:border-white/[0.12] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/20 dark:focus:border-blue-400 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all duration-300 backdrop-blur-sm outline-none"
                            required
                            autoComplete="email"
                          />
                          {/* Icon Glow Effect */}
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 bg-blue-500/20 dark:bg-blue-400/20 blur-lg -z-10"></div>
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                          Password
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400">
                            <Lock className="transition-transform duration-200 group-focus-within:scale-110" size={20} />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-12 pr-12 py-3 bg-white/40 dark:bg-gray-900/40 border border-slate-200/50 dark:border-white/[0.12] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/20 dark:focus:border-blue-400 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-all duration-300 backdrop-blur-sm outline-none"
                            required
                          />
                          {/* Icon Glow Effect */}
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 bg-blue-500/20 dark:bg-blue-400/20 blur-lg -z-10"></div>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="relative w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium flex justify-center items-center gap-2 shadow-lg shadow-blue-500/25 dark:shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden group"
                      >
                        {/* Button Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[1500ms] ease-in-out"></div>
                        
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative mt-8 flex items-center justify-center">
                      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 dark:via-white/10 to-transparent"></div>
                      <div className="relative px-4 text-sm text-slate-500 dark:text-gray-500 bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm">
                        or continue with
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <button className="flex justify-center items-center py-3 px-4 bg-white/40 hover:bg-white/60 dark:bg-gray-900/40 dark:hover:bg-gray-900/60 border border-slate-200/50 dark:border-white/[0.12] hover:border-blue-400/50 dark:hover:border-white/20 rounded-xl transition-all duration-300 group backdrop-blur-sm">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57C21.08,18.3,22.56,15.57,22.56,12.25Z" fill="#4285F4"/>
                          <path d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06c-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z" fill="#34A853"/>
                          <path d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
                          <path d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1C7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z" fill="#EA4335"/>
                        </svg>
                        <span className="text-slate-700 group-hover:text-slate-900 dark:text-gray-300 dark:group-hover:text-white transition-colors">Google</span>
                      </button>
                      
                      <button className="flex justify-center items-center py-3 px-4 bg-white/40 hover:bg-white/60 dark:bg-gray-900/40 dark:hover:bg-gray-900/60 border border-slate-200/50 dark:border-white/[0.12] hover:border-blue-400/50 dark:hover:border-white/20 rounded-xl transition-all duration-300 group backdrop-blur-sm">
                        <svg className="w-5 h-5 mr-3 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 16.9913 5.65686 21.1283 10.4375 21.8785V14.8906H7.89844V12H10.4375V9.79688C10.4375 7.29063 11.9304 5.90625 14.2146 5.90625C15.3088 5.90625 16.4531 6.10156 16.4531 6.10156V8.5625H15.1922C13.95 8.5625 13.5625 9.33334 13.5625 10.1242V12H16.3359L15.8926 14.8906H13.5625V21.8785C18.3431 21.1283 22 16.9913 22 12Z"/>
                        </svg>
                        <span className="text-slate-700 group-hover:text-slate-900 dark:text-gray-300 dark:group-hover:text-white transition-colors">Facebook</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                      <p className="text-sm text-slate-500 dark:text-gray-500">
                        Protected by advanced encryption and security protocols
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
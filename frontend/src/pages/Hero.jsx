import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  MessageSquare, 
  FileText, 
  Activity, 
  Shield, 
  Clock, 
  Users, 
  Bell, 
  CheckCircle2, 
  XCircle,
  PieChart,
  BarChart3,
  TrendingUp,
  LineChart,
  Percent
} from "lucide-react";
import VideoBg5 from '../assets/videoplayback.mp4';
import gsap from 'gsap';
import chroma from 'chroma-js';
import './hero.css';

const rotatingWords = ["Business", "Website", "Helpdesk", "Ecommerce"];

// Features data
const features = [
  {
    title: "Real-time Support",
    description: "Connect instantly with our AI-powered helpdesk for immediate insurance assistance.",
    icon: MessageSquare,
    gradient: "from-blue-500/20 to-purple-500/20",
    iconColor: "text-blue-400"
  },
  {
    title: "Policy Management",
    description: "Seamlessly manage and track all your insurance policies in one place.",
    icon: FileText,
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400"
  },
  {
    title: "Health Coverage",
    description: "Comprehensive health insurance solutions with instant claim processing.",
    icon: Activity,
    gradient: "from-emerald-500/20 to-blue-500/20",
    iconColor: "text-emerald-400"
  },
  {
    title: "24/7 Protection",
    description: "Round-the-clock insurance coverage and support for your peace of mind.",
    icon: Shield,
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400"
  },
  {
    title: "Quick Claims",
    description: "Fast and efficient claims processing with real-time status updates.",
    icon: Clock,
    gradient: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-400"
  },
  {
    title: "Family Coverage",
    description: "Protect your entire family with our comprehensive insurance plans.",
    icon: Users,
    gradient: "from-pink-500/20 to-purple-500/20",
    iconColor: "text-pink-400"
  }
];

const Hero = () => {
  const [displayedWord, setDisplayedWord] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = localStorage.getItem("user_id");
  const userName = localStorage.getItem("name");
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  const handleButtonClick = () => {
    if (userId && userName) {
      navigate(`/chat/${userId}`);
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handlePointerMove = (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(button, {
        "--pointer-x": `${x}px`,
        "--pointer-y": `${y}px`,
        duration: 0.1,
      });

      const startColor = "#B000E8";
      const endColor = "#009FFD";
      const mix = chroma.mix(startColor, endColor, x / rect.width)
        .brighten(2)
        .saturate(1.5)
        .hex();

      const outerGlow = chroma(mix).alpha(0.3).css();
      
      gsap.to(button, {
        "--button-glow": mix,
        "--button-glow-outer": outerGlow,
        duration: 0.1,
      });
    };

    button.addEventListener("pointermove", handlePointerMove);
    return () => button.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    const currentWord = rotatingWords[wordIndex];
    let typingSpeed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (isDeleting) {
        if (charIndex > 0) {
          setDisplayedWord(currentWord.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          const nextIndex = (wordIndex + 1) % rotatingWords.length;
          setWordIndex(nextIndex);
          setIsDeleting(false);
          setCharIndex(0);
        }
      } else {
        if (charIndex < currentWord.length) {
          setDisplayedWord(currentWord.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 1000);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, wordIndex]);

  // Add mouse tracking for feature boxes
  useEffect(() => {
    const boxes = document.querySelectorAll('.feature-box');
    
    const handleMouseMove = (e, box) => {
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      box.style.setProperty('--mouse-x', `${x}px`);
      box.style.setProperty('--mouse-y', `${y}px`);
    };

    boxes.forEach(box => {
      box.addEventListener('mousemove', (e) => handleMouseMove(e, box));
    });

    return () => {
      boxes.forEach(box => {
        box.removeEventListener('mousemove', (e) => handleMouseMove(e, box));
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="relative scrollbar-hide w-full min-h-screen overflow-x-hidden overflow-y-auto pt-16">
      {/* Video Background */}
      <video
        className="fixed top-0 left-0 w-full h-full object-cover"
        src={VideoBg5}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay for better readability */}
      <div className="fixed top-0 left-0 w-full h-full   z-0" />

      {/* Content Container */}
      <div className="min-h-screen flex flex-col justify-start items-center px-4 relative z-10 py-20">
        {/* Floating Blurs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-40 right-40 w-72 h-72 bg-cyan-400 rounded-full opacity-10 blur-3xl" />
        </div>

        {/* Hero Text and Button */}
        <div className="text-center space-y-8 relative z-10 max-w-4xl mx-auto mt-50">
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            <span className="font-(family-name:--font-anurati) text-[63px]">A</span>I that talks for your{" "}
            <br />
            <span className="text-blue-500 inline-block">{displayedWord}</span>
            <span className="animate-ping font-extralight">|</span>
          </h1>

          <div className="pt-6 flex justify-center">
            <button
              ref={buttonRef}
              onClick={handleButtonClick}
              className="glow-button min-w-[180px] whitespace-nowrap"
              style={{
                "--button-background": "rgb(229, 231, 235)",
                "--button-color": "rgb(31, 41, 55)",
                "padding": "12px 24px",
                "--button-width": "auto",
                "--pointer-x": "50%",
                "--pointer-y": "50%",
                "backdropFilter": "blur(10px)",
                "backgroundColor": "rgb(197, 197, 197)",
                "borderRadius": "9999px"
              }}
            >
              <div className="gradient"></div>
              <span className="relative z-10 flex items-center justify-center gap-2 text-gray-800 font-medium">
                {userId && userName ? "Chat Now" : "Chat Now"}
                <ChevronRight size={16} className="transform translate-y-[1px]" />
              </span>
            </button>
          </div>
        </div>

        {/* Site Information Cards */}
        <div className="max-w-7xl mx-auto w-full mt-50 mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Why Choose Our Insurance Helpdesk?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-101 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-full">
                <h3 className="text-white text-2xl font-semibold mb-6">AI-Powered Assistance</h3>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start">
                    <ChevronRight className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                    <span>24/7 automated support with advanced AI technology</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                    <span>Natural language processing for human-like interactions</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                    <span>Instant responses to insurance-related queries</span>
                  </li>
                </ul>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-purple-500/0 opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-101 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-full">
                <h3 className="text-white text-2xl font-semibold mb-6">Automatic Escalation</h3>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start">
                    <ChevronRight className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                    <span>Smart ticket routing based on query complexity</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                    <span>Seamless handoff to human agents when needed</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                    <span>Priority-based escalation system</span>
                  </li>
                </ul>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-pink-500/0 opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto w-full px-4 mt-20">
          <div className="grid grid-cols-12 gap-4 auto-rows">
            {/* Create Tasks Box - Large */}
            <div className="col-span-12 md:col-span-4 row-span-2 feature-box rounded-3xl">
              <div className="h-full flex flex-col justify-between p-6">
                <div>
                  <h3 className="text-white text-2xl font-semibold mb-2">Create tickets.</h3>
                  <p className="text-gray-400">Schedule and manage your insurance queries efficiently.</p>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="bg-[#1A1A1A]/50 backdrop-blur rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-500 h-5 w-5" />
                      <p className="text-gray-300 text-sm">Policy renewal request</p>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 backdrop-blur rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-500 h-5 w-5" />
                      <p className="text-gray-300 text-sm">Claim status inquiry</p>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 backdrop-blur rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Shield className="text-purple-500 h-5 w-5" />
                      <p className="text-gray-300 text-sm">Coverage verification</p>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 backdrop-blur rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Users className="text-yellow-500 h-5 w-5" />
                      <p className="text-gray-300 text-sm">Add beneficiary</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Progress Box */}
            <div className="col-span-12 md:col-span-8 feature-box rounded-3xl">
              <div className="flex flex-col gap-4 p-6">
                <div>
                  <h3 className="text-white text-2xl font-semibold mb-2">Track progress.</h3>
                  <p className="text-gray-400">Monitor your insurance activities in real-time.</p>
                </div>
                <div className="flex flex-col md:flex-row items-stretch gap-4">
                  <div className="flex-1 bg-[#1A1A1A]/50 rounded-lg p-4 transform transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Claims Processed</span>
                      <span className="text-green-500">85%</span>
                    </div>
                    <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-green-500 rounded-full transition-all duration-300 group-hover:w-[85%]"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#1A1A1A]/50 rounded-lg p-4 transform transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Response Time</span>
                      <span className="text-blue-500">2.5s</span>
                    </div>
                    <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                      <div className="w-[70%] h-full bg-blue-500 rounded-full transition-all duration-300 group-hover:w-[70%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation Box */}
            <div className="col-span-12 md:col-span-4 feature-box rounded-3xl">
              <div className="p-6">
                <h3 className="text-white text-2xl font-semibold mb-2">Documentation</h3>
                <p className="text-gray-400">Access comprehensive insurance guides and FAQs</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 bg-[#1A1A1A]/50 p-3 rounded-lg transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <FileText className="text-emerald-500 h-5 w-5" />
                    <span className="text-gray-300">Insurance Guidelines</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1A1A1A]/50 p-3 rounded-lg transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <MessageSquare className="text-emerald-500 h-5 w-5" />
                    <span className="text-gray-300">FAQ Database</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Box */}
            <div className="col-span-12 md:col-span-4 feature-box rounded-3xl">
              <div className="p-6">
                <h3 className="text-white text-2xl font-semibold mb-2">Chat support</h3>
                <p className="text-gray-400">Get instant responses from our AI</p>
                <div className="mt-4 bg-[#1A1A1A]/50 rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-300 text-sm">How can I help you today?</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Quick Help</span>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Updates Box - Large */}
            <div className="col-span-12 md:col-span-8 row-span-2 feature-box rounded-3xl">
              <div className="h-full flex flex-col justify-between p-6">
                <div>
                  <h3 className="text-white text-2xl font-semibold mb-2">Real-time updates</h3>
                  <p className="text-gray-400">Stay connected with your insurance team instantly.</p>
                </div>
                <div className="space-y-3 mt-6">
                  <div className="bg-[#1A1A1A]/50 rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Bell className="text-yellow-500 h-5 w-5" />
                      <div>
                        <p className="text-gray-300 text-sm">New claim processed</p>
                        <p className="text-gray-500 text-xs">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-500 h-5 w-5" />
                      <div>
                        <p className="text-gray-300 text-sm">Policy renewal approved</p>
                        <p className="text-gray-500 text-xs">5 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 rounded-xl p-4 transform transition-all duration-300 hover:translate-y-[-5px] hover:bg-[#222] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <XCircle className="text-red-500 h-5 w-5" />
                      <div>
                        <p className="text-gray-300 text-sm">Document verification pending</p>
                        <p className="text-gray-500 text-xs">10 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>  

            {/* Analytics Box */}
            <div className="col-span-12 md:col-span-4 row-span-2 feature-box rounded-3xl">
              <div className="h-full flex flex-col justify-between p-6">
                <div>
                  <h3 className="text-white text-2xl font-semibold mb-2">Analytics</h3>
                  <p className="text-gray-400">Track your insurance metrics</p>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="bg-[#1A1A1A]/50 rounded-lg p-4 transform transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center gap-3">
                      <PieChart className="text-orange-500 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">Success Rate</span>
                          <span className="text-orange-500">92%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                          <div className="w-[92%] h-full bg-orange-500 rounded-full transition-all duration-300 group-hover:w-[92%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 rounded-lg p-4 transform transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="text-blue-500 h-5 w-5 group-hover:scale-110 transition-transform duration-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">User Satisfaction</span>
                          <span className="text-blue-500">88%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                          <div className="w-[88%] h-full bg-blue-500 rounded-full transition-all duration-300 group-hover:w-[88%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 rounded-lg p-4 transform transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-green-500 h-5 w-5 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform duration-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">Growth Rate</span>
                          <span className="text-green-500">95%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                          <div className="w-[95%] h-full bg-green-500 rounded-full transition-all duration-300 group-hover:w-[95%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A]/50 rounded-lg p-4 transform transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex items-center gap-3">
                      <Percent className="text-purple-500 h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">Conversion Rate</span>
                          <span className="text-purple-500">78%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden">
                          <div className="w-[78%] h-full bg-purple-500 rounded-full transition-all duration-300 group-hover:w-[78%]"></div>
                        </div>
                      </div>
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

export default Hero;
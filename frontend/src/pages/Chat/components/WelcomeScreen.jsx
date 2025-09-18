import { FileText, AlertCircle, User } from "lucide-react";

function WelcomeScreen({ setManualInput, textareaRef }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px-8rem)] text-center px-4 mt-10">
      <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-transparent bg-clip-text leading-relaxed">
        Welcome to QuantumEra
      </h2>
      <p className="text-[#94A3B8] max-w-md mb-8">
        Your AI-powered insurance guide. Ask me anything about your policies, claims, or general insurance inquiries.
      </p>

      {/* Example Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl px-4">
        {/* Example Card 1 - Health Insurance */}
        <div 
          onClick={() => {
            setManualInput("What does my health insurance policy cover for preventive care?");
            textareaRef.current?.focus();
          }}
          className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 cursor-pointer aspect-[4/3]"
        >
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80" 
              alt="Health Insurance" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/50 via-[#000000]/30 to-[#000000]/10"></div>
          </div>
          <div className="relative p-6 h-full flex flex-col">
            <div className="bg-[#9333EA]/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-[#9333EA]/80" />
            </div>
            <div className="mt-auto">
              <h3 className="text-[#F1F5F9] text-xl font-medium mb-3">Policy Coverage</h3>
              <p className="text-[#CBD5E1]">
                "What does my health insurance policy cover for preventive care?"
              </p>
            </div>
          </div>
        </div>

        {/* Example Card 2 - Car Insurance */}
        <div 
          onClick={() => {
            setManualInput("How do I file a claim for my recent car accident?");
            textareaRef.current?.focus();
          }}
          className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 cursor-pointer aspect-[4/3]"
        >
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80" 
              alt="Car Insurance" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/50 via-[#000000]/30 to-[#000000]/10"></div>
          </div>
          <div className="relative p-6 h-full flex flex-col">
            <div className="bg-[#3B82F6]/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-6 w-6 text-[#3B82F6]/80" />
            </div>
            <div className="mt-auto">
              <h3 className="text-[#F1F5F9] text-xl font-medium mb-3">Claims Process</h3>
              <p className="text-[#CBD5E1]">
                "How do I file a claim for my recent car accident?"
              </p>
            </div>
          </div>
        </div>

        {/* Example Card 3 - Policy Updates */}
        <div 
          onClick={() => {
            setManualInput("What are my current policy renewal dates?");
            textareaRef.current?.focus();
          }}
          className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 cursor-pointer aspect-[4/3]"
        >
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80" 
              alt="Policy Updates" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/50 via-[#000000]/30 to-[#000000]/10"></div>
          </div>
          <div className="relative p-6 h-full flex flex-col">
            <div className="bg-[#10B981]/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <User className="h-6 w-6 text-[#10B981]/80" />
            </div>
            <div className="mt-auto">
              <h3 className="text-[#F1F5F9] text-xl font-medium mb-3">Policy Updates</h3>
              <p className="text-[#CBD5E1]">
                "What are my current policy renewal dates?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen; 
import React from "react";

const Loader = ({ size = "default", text = "Loading...", className = "" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-12 w-12",
    large: "h-16 w-16",
  };

  return (
    <div className={`flex items-center justify-center h-[650px] ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
        {text && <p className="text-gray-600 dark:text-gray-400 font-medium">{text}</p>}
      </div>
    </div>
  );
};

export default Loader; 
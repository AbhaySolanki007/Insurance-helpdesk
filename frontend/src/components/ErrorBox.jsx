import React from "react";

const ErrorBox = ({ 
  error, 
  onRetry, 
  retryText = "Retry", 
  className = "",
  showRetry = true 
}) => {
  return (
    <div className={`flex items-center justify-center h-[650px] ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="font-medium text-lg text-red-600 dark:text-red-400">
          {error}
        </p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBox; 
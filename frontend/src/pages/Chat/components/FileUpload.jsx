import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Loader from '../../../components/Loader';
import ErrorBox from '../../../components/ErrorBox';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md', '.csv'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 10;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type === 'application/pdf') {
      return '📄';
    } else if (file.type.startsWith('text/')) {
      return '📝';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return '📄';
    } else if (file.type.includes('sheet') || file.type.includes('excel')) {
      return '📊';
    } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
      return '📈';
    }
    return '📁';
  };

  const validateFile = (file) => {
    const errors = [];
    
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${formatFileSize(maxFileSize)} limit`);
    }

    const isSupported = Object.values(supportedTypes).some(extensions => 
      extensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );
    
    if (!isSupported) {
      errors.push('File type not supported');
    }

    return errors;
  };

  const handleFileSelect = useCallback((selectedFiles) => {
    setError(null);
    const fileArray = Array.from(selectedFiles);
    
    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending'
        });
      } else {
        errors.push(`${file.name}: ${fileErrors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('; '));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, [files.length]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    handleFileSelect(selectedFiles);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
  };

  const simulateUpload = async (file) => {
    return new Promise((resolve, reject) => {
      const duration = Math.random() * 3000 + 1000; // 1-4 seconds
      const interval = 100;
      let progress = 0;

      const timer = setInterval(() => {
        progress += (interval / duration) * 100;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          resolve();
        }
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: Math.round(progress)
        }));
      }, interval);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const fileItem of files) {
        if (fileItem.status === 'pending') {
          setUploadStatus(prev => ({
            ...prev,
            [fileItem.id]: 'uploading'
          }));

          // Simulate upload process
          await simulateUpload(fileItem);

          setUploadStatus(prev => ({
            ...prev,
            [fileItem.id]: 'success'
          }));

          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'success' } : f
          ));
        }
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploadStatus(prev => {
        const newStatus = { ...prev };
        files.forEach(f => {
          if (f.status === 'pending') {
            newStatus[f.id] = 'error';
          }
        });
        return newStatus;
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setUploadProgress({});
    setUploadStatus({});
    setError(null);
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const uploadedFiles = files.filter(f => f.status === 'success');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            File Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload documents, images, and other files to the system
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept={Object.values(supportedTypes).flat().join(',')}
          />

          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Files ({files.length})
              </h3>
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFileIcon(fileItem.file)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {fileItem.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(fileItem.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Upload Progress */}
                      {uploadStatus[fileItem.id] === 'uploading' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[fileItem.id] || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {uploadProgress[fileItem.id] || 0}%
                          </span>
                        </div>
                      )}

                      {/* Status Icons */}
                      {uploadStatus[fileItem.id] === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {uploadStatus[fileItem.id] === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        disabled={uploadStatus[fileItem.id] === 'uploading'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {pendingFiles.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Summary */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700 dark:text-green-400">
                Successfully uploaded {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Supported File Types */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Supported file types:
          </h4>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
            {Object.entries(supportedTypes).map(([type, extensions]) => (
              <span key={type} className="px-2 py-1 bg-white dark:bg-gray-700 rounded">
                {extensions.join(', ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

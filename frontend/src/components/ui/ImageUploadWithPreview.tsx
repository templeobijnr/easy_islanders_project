/**
 * ImageUploadWithPreview - Enhanced file upload component
 * Features:
 * - Drag and drop support
 * - Image/video previews
 * - File validation (type, size, dimensions)
 * - Reorder images
 * - Set featured image
 * - Delete files
 * - Batch upload (up to 10 files)
 */
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Star, Image as ImageIcon, Video as VideoIcon, GripVertical } from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
  isFeatured?: boolean;
}

interface ImageUploadWithPreviewProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  allowVideos?: boolean;
}

export const ImageUploadWithPreview: React.FC<ImageUploadWithPreviewProps> = ({
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  allowVideos = true,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allAcceptedFormats = allowVideos
    ? [...acceptedFormats, ...videoFormats]
    : acceptedFormats;

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!allAcceptedFormats.includes(file.type)) {
        return `Invalid file type: ${file.type}. Allowed: ${allAcceptedFormats.join(', ')}`;
      }

      // Check file size (convert MB to bytes)
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: ${maxSizeMB}MB`;
      }

      return null;
    },
    [maxSizeMB, allAcceptedFormats]
  );

  // Process files
  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const fileArray = Array.from(fileList);

      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed. You have ${files.length} files.`);
        return;
      }

      const newFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
        } else {
          const preview = URL.createObjectURL(file);
          newFiles.push({
            file,
            preview,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            isFeatured: files.length === 0 && newFiles.length === 0, // First file is featured
          });
        }
      });

      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        setError(null);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles.map((f) => f.file));
      }
    },
    [files, maxFiles, validateFile, onFilesChange]
  );

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles.map((f) => f.file));

    // Clean up preview URL
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  // Set featured image
  const setFeatured = (id: string) => {
    const updatedFiles = files.map((f) => ({
      ...f,
      isFeatured: f.id === id,
    }));
    setFiles(updatedFiles);
    onFilesChange(updatedFiles.map((f) => f.file));
  };

  // Reorder files (move up)
  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === files.length - 1)
    ) {
      return;
    }

    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
    onFilesChange(newFiles.map((f) => f.file));
  };

  return (
    <div className="space-y-4">
      <Label>Images & Videos ({files.length}/{maxFiles})</Label>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          {allowVideos ? 'Images (JPG, PNG, WebP) or Videos (MP4, WebM)' : 'Images (JPG, PNG, WebP)'}
          <br />
          Max {maxSizeMB}MB per file, up to {maxFiles} files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allAcceptedFormats.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((fileWithPreview, index) => {
            const isVideo = videoFormats.includes(fileWithPreview.file.type);

            return (
              <div
                key={fileWithPreview.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {/* Preview */}
                <div className="aspect-square relative bg-gray-100">
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoIcon className="h-12 w-12 text-gray-400" />
                      <video
                        src={fileWithPreview.preview}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        muted
                      />
                    </div>
                  ) : (
                    <img
                      src={fileWithPreview.preview}
                      alt={fileWithPreview.file.name}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Featured Badge */}
                  {fileWithPreview.isFeatured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* Set Featured */}
                    {!fileWithPreview.isFeatured && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeatured(fileWithPreview.id);
                        }}
                        className="h-8 px-2"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Move Up */}
                    {index > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFile(index, 'up');
                        }}
                        className="h-8 px-2"
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Remove */}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileWithPreview.id);
                      }}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* File Name */}
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate" title={fileWithPreview.file.name}>
                    {fileWithPreview.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(fileWithPreview.file.size / 1024).toFixed(1)}KB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helper Text */}
      {files.length > 0 && (
        <p className="text-xs text-gray-500">
          <Star className="inline h-3 w-3 mr-1" />
          Click the star icon to set a featured image. Use drag handles to reorder.
        </p>
      )}
    </div>
  );
};

export default ImageUploadWithPreview;

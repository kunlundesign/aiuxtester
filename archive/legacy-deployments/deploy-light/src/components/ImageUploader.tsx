'use client';

import React, { useCallback, useState } from 'react';
import { UploadedImage } from '@/types';

// 使用与主页面相同的设计系统
const designSystem = {
  colors: {
    primary: '#8B7355',
    secondary: '#B5A99A',
    accent: '#D4C4B0',
    background: {
      primary: '#EFEAE7',
      secondary: '#F5F1EE',
      card: 'rgba(255, 255, 255, 0.7)',
    },
    text: {
      primary: '#2D2A26',
      secondary: '#5A5550',
      light: '#8B8680',
    },
    brand: '#0078d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xl: '16px',
  },
  shadows: {
    subtle: '0 2px 8px rgba(45, 42, 38, 0.05)',
    card: '0 8px 32px rgba(45, 42, 38, 0.1)',
    cardHover: '0 12px 40px rgba(45, 42, 38, 0.15)',
  },
};

// 样式对象
const styles = {
  container: {
    padding: designSystem.spacing.xl,
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    borderRadius: designSystem.borderRadius.medium,
    textAlign: 'center' as const,
    backgroundColor: designSystem.colors.background.card,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    backdropFilter: 'blur(10px)',
  },
  containerHover: {
    border: `2px dashed ${designSystem.colors.brand}`,
  },
  uploadText: {
    marginTop: designSystem.spacing.lg,
    color: designSystem.colors.text.secondary,
    fontSize: '14px',
  },
  hiddenInput: {
    display: 'none',
  },
  thumbnailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: designSystem.spacing.lg,
    marginTop: designSystem.spacing.xl,
  },
  thumbnail: {
    position: 'relative' as const,
    borderRadius: designSystem.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: designSystem.colors.background.card,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  thumbnailImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover' as const,
  },
  thumbnailActions: {
    position: 'absolute' as const,
    top: designSystem.spacing.sm,
    right: designSystem.spacing.sm,
    display: 'flex',
    gap: designSystem.spacing.xs,
  },
  actionButton: {
    minWidth: '24px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: designSystem.colors.background.card,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: designSystem.colors.text.primary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    opacity: 0.9,
    transition: 'all 0.2s ease',
  },
  actionButtonHover: {
    opacity: 1,
    transform: 'scale(1.1)',
  },
  dragHandle: {
    position: 'absolute' as const,
    bottom: designSystem.spacing.sm,
    right: designSystem.spacing.sm,
    cursor: 'grab',
    color: designSystem.colors.text.light,
    fontSize: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '2px 4px',
    borderRadius: designSystem.borderRadius.small,
  },
  dragHandleActive: {
    cursor: 'grabbing',
  },
};

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  analysisType?: 'single' | 'flow' | 'side-by-side';
}

export default function ImageUploader({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  analysisType = 'single'
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select image files only.');
      return;
    }

    // Check analysis type limits
    const totalImages = images.length + imageFiles.length;
    if (analysisType === 'single' && totalImages > 1) {
      alert('Single analysis mode supports only 1 image. Please remove existing images first.');
      return;
    }
    if (analysisType === 'side-by-side' && totalImages > 3) {
      alert('Side-by-side analysis mode supports maximum 3 images.');
      return;
    }
    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const newImages: UploadedImage[] = imageFiles.map((file, index) => ({
      id: `image-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      order: (images?.length ?? 0) + index,   // ✅ 补上 order
    }));

    onImagesChange([...images, ...newImages]);
  }, [images, onImagesChange, maxImages, analysisType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  }, [handleFiles]);

  const removeImage = useCallback((imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== imageId));
  }, [images, onImagesChange]);

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Update order field for all images after reordering
    const updatedImages = newImages.map((image, index) => ({
      ...image,
      order: index,
    }));
    
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOverThumbnail = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropThumbnail = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveImage(dragIndex, dropIndex);
    }
  }, [moveImage]);

  return (
    <div>
      {/* Upload Area */}
      <div
        style={{
          ...styles.container,
          ...(isDragOver ? styles.containerHover : {}),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div style={{ fontSize: '24px', color: designSystem.colors.text.secondary }}>
          📁
        </div>
        <div style={styles.uploadText}>
          {analysisType === 'single' && 'Drop or click to upload 1 image'}
          {analysisType === 'flow' && `Drop or click to upload up to ${maxImages} images`}
          {analysisType === 'side-by-side' && 'Drop or click to upload 2-3 images for comparison'}
        </div>
        <input
          id="file-input"
          type="file"
          multiple={analysisType !== 'single'}
          accept="image/*"
          style={styles.hiddenInput}
          onChange={handleFileInput}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div style={styles.thumbnailsGrid}>
          {images.map((image, index) => (
            <div
              key={image.id}
              style={styles.thumbnail}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOverThumbnail}
              onDrop={(e) => handleDropThumbnail(e, index)}
              onMouseEnter={() => setHoveredThumbnail(index)}
              onMouseLeave={() => setHoveredThumbnail(null)}
            >
              <img
                src={image.preview}
                alt={image.name}
                style={styles.thumbnailImage}
              />
              
              {/* Action Buttons */}
              <div style={styles.thumbnailActions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...(hoveredThumbnail === index ? styles.actionButtonHover : {}),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  title="Remove image"
                >
                  🗑️
                </button>
              </div>

              {/* Drag Handle */}
              <div style={styles.dragHandle}>
                ⋮⋮
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
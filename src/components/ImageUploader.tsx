'use client';

import React, { useCallback, useState } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Card,
} from '@fluentui/react-components';
import { CloudArrowUp24Regular, Delete24Regular } from '@fluentui/react-icons';
import { UploadedImage } from '@/types';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalL,
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    '&:hover': {
  // Use full border to avoid type mismatch on borderColor in nested selector
  border: `2px dashed ${tokens.colorBrandStroke1}`,
    },
  },
  uploadText: {
    marginTop: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2,
  },
  hiddenInput: {
    display: 'none',
  },
  thumbnailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  thumbnail: {
    position: 'relative',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  thumbnailImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
  },
  thumbnailActions: {
    position: 'absolute',
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  actionButton: {
    minWidth: '24px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralBackground1,
    opacity: 0.9,
  },
  dragHandle: {
    position: 'absolute',
    bottom: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    cursor: 'grab',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

function ImageUploader({ images, onImagesChange, disabled }: ImageUploaderProps) {
  const styles = useStyles();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: UploadedImage[] = [];
    const existingOrder = Math.max(0, ...images.map(img => img.order));

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const id = `image-${Date.now()}-${index}`;
        const preview = URL.createObjectURL(file);
        
        newImages.push({
          id,
          file,
          preview,
          order: existingOrder + index + 1,
        });
      }
    });

    onImagesChange([...images, ...newImages]);
  }, [images, onImagesChange, disabled]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // Clean up object URL
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(updatedImages);
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const reorderedImages = [...images];
    const [moved] = reorderedImages.splice(fromIndex, 1);
    reorderedImages.splice(toIndex, 0, moved);
    
    // Update order values
    reorderedImages.forEach((img, index) => {
      img.order = index;
    });
    
    onImagesChange(reorderedImages);
  };

  const openFileDialog = () => {
    document.getElementById('file-input')?.click();
  };

  return (
    <div>
      {/* Upload Area */}
      <div
        className={styles.container}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        style={{
          borderColor: dragOver ? tokens.colorBrandStroke1 : undefined,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className={styles.hiddenInput}
          disabled={disabled}
        />
        
        <CloudArrowUp24Regular />
        <Text className={styles.uploadText}>
          {dragOver 
            ? 'Drop images here...' 
            : 'Drop images here or click to upload'
          }
        </Text>
        <Text className={styles.uploadText}>
          Supports multiple images (PNG, JPG, WebP)
        </Text>
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className={styles.thumbnailGrid}>
          {images
            .sort((a, b) => a.order - b.order)
            .map((image, index) => (
              <Card key={image.id} className={styles.thumbnail}>
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className={styles.thumbnailImage}
                />
                
                <div className={styles.thumbnailActions}>
                  <Button
                    className={styles.actionButton}
                    icon={<Delete24Regular />}
                    size="small"
                    appearance="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.id);
                    }}
                    disabled={disabled}
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {images.length === 0 && (
        <div className={styles.emptyState}>
          <Text>No images uploaded yet</Text>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;

// src/components/ImagePreloader.tsx
import React, { useEffect } from 'react';
import { preloadImages } from '../assetUtils';

interface ImagePreloaderProps {
  imageUrls: string[];
  onComplete: () => void;
}

const ImagePreloader: React.FC<ImagePreloaderProps> = ({ imageUrls, onComplete }) => {
  useEffect(() => {
    let isMounted = true;
    preloadImages(imageUrls).then(() => {
        if (isMounted) onComplete();
    });
    return () => { isMounted = false; };
  }, [imageUrls, onComplete]);

  return null;
};

export default ImagePreloader;
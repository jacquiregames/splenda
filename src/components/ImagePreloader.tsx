// src/components/ImagePreloader.tsx
import React, { useEffect } from 'react';

export const preloadImages = async (urls: string[]): Promise<void> => {
    const promises = urls.map((url) => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = () => {
                console.warn(`Failed to load: ${url}`);
                resolve(); // Resolve anyway to prevent hanging
            };
        });
    });
    await Promise.all(promises);
};

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
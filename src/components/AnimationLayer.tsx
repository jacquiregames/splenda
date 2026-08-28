// src/components/AnimationLayer.tsx

import React, { useEffect, useState } from 'react';

export interface AnimationRequest {
  id: number;
  src: string;
  backSrc?: string; 
  start: DOMRect;
  end: DOMRect;
  flip?: boolean | 'half';   
  type?: 'token' | 'card'; 
  playerId?: string; 
}

export const AnimationLayer: React.FC<{ 
  animations: AnimationRequest[]; 
  onComplete: (id: number) => void; 
}> = ({ animations, onComplete }) => {
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      pointerEvents: 'none', zIndex: 9999,
      perspective: '1000px'
    }}>
      {animations.map(anim => (
        <FlyingItem key={anim.id} anim={anim} onComplete={() => onComplete(anim.id)} />
      ))}
    </div>
  );
};

const FlyingItem: React.FC<{ anim: AnimationRequest; onComplete: () => void }> = ({ anim, onComplete }) => {
  // 1. Keep base dimensions locked to the starting dimensions
  const baseWidth = anim.start.width;
  const baseHeight = anim.start.height;

  // 2. Calculate the destination coordinates relative to the start
  const deltaX = anim.end.left - anim.start.left;
  const deltaY = anim.end.top - anim.start.top;

  // 3. Calculate scale safely (handling aspect ratio logic)
  const startRatio = baseWidth / baseHeight;
  let targetWidth = anim.end.width;
  let targetHeight = anim.end.height;

  const endRatio = targetWidth / targetHeight;
  
  // Tight threshold: if the target container (like a tall card stack) has a different 
  // aspect ratio, lock the target height to match the target width to prevent cropping.
  if (Math.abs(startRatio - endRatio) > 0.01) {
      targetHeight = targetWidth / startRatio;
  }
  
  const scaleX = targetWidth / baseWidth;
  const scaleY = targetHeight / baseHeight;

  // State now stores transform values instead of absolute positioning
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotateY: 0
  });

  useEffect(() => {
    // Force a reflow, then apply target transforms
    requestAnimationFrame(() => {
      setTransform({
        x: deltaX,
        y: deltaY,
        scaleX,
        scaleY,
        rotateY: anim.flip === 'half' ? 90 : (anim.flip ? 180 : 0)
      });
    });

    const timer = setTimeout(onComplete, 800); 
    return () => clearTimeout(timer);
  }, [anim, deltaX, deltaY, scaleX, scaleY, onComplete]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: anim.start.left, 
    top: anim.start.top,   
    width: baseWidth,      
    height: baseHeight,    
    transformOrigin: 'top left', // Crucial so scaling matches the bounding box
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX}, ${transform.scaleY}) rotateY(${transform.rotateY}deg)`, 
    transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s ease',
    transformStyle: 'preserve-3d', 
    zIndex: 10000,
    pointerEvents: 'none'
  }; 

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    backfaceVisibility: 'hidden', 
    borderRadius: anim.type === 'token' ? '50%' : '12px', // Matches the 12px board border-radius
    boxShadow: anim.type === 'token' ? '0 5px 10px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.5)',
    // 'fill' ensures the image scales exactly with the container.
    // Since we tightly manage the container's aspect ratio above, this prevents all cropping.
    objectFit: 'fill' 
  };

  return (
    <div style={containerStyle}>
      <img src={anim.src} style={{...imgStyle, zIndex: 2}} alt="" />
      {anim.flip && anim.backSrc && (
        <img 
            src={anim.backSrc} 
            style={{
                ...imgStyle, 
                transform: 'rotateY(180deg)', 
                zIndex: 1
            }} 
            alt="" 
        />
      )}
    </div>
  );
};
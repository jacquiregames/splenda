// src/components/FireworksLayer.tsx

import { Fireworks } from "@fireworks-js/react";

interface FireworksLayerProps {
    intensity?: 'low' | 'high';
}

export const FireworksLayer: React.FC<FireworksLayerProps> = ({ intensity = 'low' }) => {
  const isHigh = intensity === 'high';

  return (
    <Fireworks
      options={{
        opacity: 0.5,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 50, 
        explosion: 5,
        intensity: isHigh ? 45 : 15, // Much more fireworks for winner
        flickering: 50,
        lineStyle: 'round',
        hue: {
          min: 0,
          max: 360
        },
        delay: {
          min: isHigh ? 15 : 30,
          max: isHigh ? 30 : 60
        },
        rocketsPoint: {
          min: 50,
          max: 50
        },
        lineWidth: {
          explosion: {
            min: 1,
            max: 3
          },
          trace: {
            min: 1,
            max: 2
          }
        },
        brightness: {
          min: 50,
          max: 80
        },
        decay: {
          min: 0.015,
          max: 0.03
        },
        mouse: {
          click: false,
          move: false,
          max: 1
        }
      }}
      style={{
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        position: "fixed",
        background: "transparent", // Keep transparent to see background image 
        pointerEvents: "none", // Click through to buttons
      }}
    />
  );
};
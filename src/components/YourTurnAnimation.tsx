// src/components/YourTurnAnimation.tsx

import React from 'react';
import '../styles/YourTurnAnimation.css';

interface YourTurnAnimationProps {
    isMyTurn: boolean;
}

export const YourTurnAnimation: React.FC<YourTurnAnimationProps> = ({ isMyTurn }) => {
    if (!isMyTurn) {
        return null;
    }

    return (
        <div className="your-turn-animation-container">
            <img 
                src="/images/yourturn/yourturn_left.webp" 
                alt="Your Turn" 
                className="your-turn-image left-image" 
            />
            <img 
                src="/images/yourturn/yourturn_right.webp" 
                alt="Your Turn" 
                className="your-turn-image right-image" 
            />
        </div>
    );
};
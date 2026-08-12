// src/components/AnimatedScore.tsx
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedScoreProps {
    score: number;
    className?: string;
    animClassName?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ 
    score, 
    className = '', 
    animClassName = 'score-increase-anim' 
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const prevScore = useRef(score);

    useEffect(() => {
        if (score > prevScore.current) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 350); // matches the new bump animation length
            prevScore.current = score;
            return () => clearTimeout(timer);
        }
        prevScore.current = score;
    }, [score]);

    return (
        <span className={`${className} ${isAnimating ? animClassName : ''}`}>
            {score}
        </span>
    );
};
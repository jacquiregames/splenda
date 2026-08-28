// src/components/TokenArea.tsx

import React from 'react';
import type { GameState } from '../types';
import { COLORS, getAssetUrl } from '../constants'; 
import '../styles/Tokens.css';

interface TokenAreaProps {
    gameState: GameState;
    onTokenClick: (color: string) => void;
    isMyTurn: boolean;
    isDiscarding: boolean;
}


export const TokenArea: React.FC<TokenAreaProps> = ({ 
    gameState, onTokenClick, isMyTurn, isDiscarding 
}) => { 
    const interactive = isMyTurn && !isDiscarding;  

    return (
        <div className="tokens-container">
            <div className="tokens-area">
                {COLORS.map((color) => {
                    const count = gameState.board.tokens[color];
                    
                    // Standard Logic: Dim if empty
                    const isDimmed = count === 0;

                    return (
                        <div 
                            key={color}
                            id={`token-bank-${color}`}
                            className={`token-container token-glow-${color} ${isDimmed ? 'dimmed' : ''} ${interactive ? 'interactive' : ''}`}
                            onClick={() => interactive && onTokenClick(color)}
                        >
                            <img src={getAssetUrl(color, 'token')} className="token-img" alt={`${color} token`} />
                            <span className="token-count">{count}</span>
                        </div>
                    );
                })}
                
                {/* Gold Token: Never interactive for discarding (handled in footer) */}
                <div 
                    id="token-bank-gold"
                    className={`token-container token-glow-gold ${interactive ? 'interactive' : ''}`} 
                    onClick={() => interactive && onTokenClick('gold')}
                >
                    <img src={getAssetUrl('gold', 'token')} className="token-img" alt="gold token" />
                    <span className="token-count">{gameState.board.tokens.gold}</span>
                </div>

                {isMyTurn && !isDiscarding && (
                    <div className="token-container your-turn-indicator">
                        <img src="/images/yourturn.webp" className="token-img" alt="Your Turn" />
                    </div>
                )}
            </div>
        </div>
    );
};
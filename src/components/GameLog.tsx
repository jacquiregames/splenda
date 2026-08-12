// src/components/GameLog.tsx

import React from 'react';
import type { Player } from '../types';
import { AnimatedScore } from './AnimatedScore';
import '../styles/GameLog.css';

interface GameLogProps {
    roundNumber: number;
    players: Player[];
    currentTurn: string;
}

export const GameLog: React.FC<GameLogProps> = ({ roundNumber, players, currentTurn }) => {
    return (
        <div className="gamelog-container">
            <div className="round-header">
                ROUND <span className="round-num">{roundNumber}</span>
            </div>
            <div className="turn-list">
                {players.map((p, index) => {
                    const isTurn = p.id === currentTurn;
                    return (
                        <div key={p.id} className={`turn-row ${isTurn ? 'active-turn' : ''}`}>
                            <span className="turn-idx">{index + 1}.</span>
                            <span className="turn-name">{p.id}</span>
                            <AnimatedScore 
                                score={p.points} 
                                className="turn-score" 
                                animClassName="gamelog-score-anim" 
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
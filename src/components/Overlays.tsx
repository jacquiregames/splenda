// src/components/Overlays.tsx
import React from 'react';
import { getAssetUrl } from '../constants';  
import { FireworksLayer } from './FireworksLayer';  
import type { CardData } from '../types';
import '../styles/Overlays.css';

interface NobleSelectionProps {
    nobles: CardData[];
    pendingIndices: number[];
    onSelect: (idx: number) => void; 
}

interface GameOverProps {
    winner: string;
    onRestart: () => void; 
}

export const GameOverOverlay: React.FC<GameOverProps> = ({ winner, onRestart }) => (
    <div className="game-over-overlay">
        <FireworksLayer intensity="high" />
        <div className="winner-box">
            <img src="/images/crown.png" alt="Winner Crown" className="winner-crown" />
            <div className="winner-name">{winner}</div>
            <button className="restart-btn" onClick={onRestart}> Back to Lobby </button>
        </div>
    </div>
);

interface GoldConfirmProps {
    goldCost: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const GoldConfirmationOverlay: React.FC<GoldConfirmProps> = ({ goldCost, onConfirm, onCancel }) => ( 
    <div className="modal-backdrop" onClick={onCancel}>         
        <div className="gold-confirmation-box" onClick={e => e.stopPropagation()}>
            <h2>Use Gold Token?</h2> 
            <p>You need {goldCost} Gold token{goldCost > 1 ? 's' : ''} to buy this.</p>
            <div className="action-buttons-row">
                <button className="confirm-btn" onClick={onConfirm}> Yes, Buy </button>
                <button className="reset-btn" onClick={onCancel}> Cancel </button>
            </div>
        </div>
    </div>
);

export const NobleSelectionOverlay: React.FC<NobleSelectionProps> = ({ nobles, pendingIndices, onSelect }) => (
    <div className="modal-backdrop">
        <div className="noble-selection-overlay" onClick={e => e.stopPropagation()}>
            <h2>Select a Noble</h2>
            <p>Your engine attracted multiple nobles at once! Choose one:</p>
            
            <div className="noble-choices">
                {pendingIndices.map(idx => {
                    const noble = nobles[idx];
                    return (
                        <img 
                            key={idx} 
                            src={getAssetUrl(noble.FileName, 'card')} 
                            className="noble-choice-img" 
                            onClick={() => onSelect(idx)}
                            alt="Noble" 
                        />
                    );
                })}
            </div>
        </div>
    </div>
);
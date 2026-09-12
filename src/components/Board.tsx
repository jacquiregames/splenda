// src/components/Board.tsx

import React from 'react';
import type { GameState, CardData } from '../types'; 
import { getAssetUrl } from '../constants';  
import { CardTooltip } from './CardTooltip'; // <-- IMPORT TOOLTIP
import '../styles/Board.css';
import '../styles/CardTooltip.css'; // <-- IMPORT STYLES

interface BoardProps {
    gameState: GameState;
    canBuy: (card: CardData) => boolean;
    onBuy: (row: number, idx: number) => void;
    onReserve: (row: number, idx: number | string) => void;
    onNobleClick: (idx: number) => void;
    isSelectingNoble: boolean;
    myReservedCount: number;
    isMyTurn: boolean;
    myId: string; // <-- ADD THIS PROP
}

export const Board: React.FC<BoardProps> = ({ 
    gameState, canBuy, onBuy, onReserve, onNobleClick, isSelectingNoble, myReservedCount, isMyTurn, myId 
}) => { 

    return (
        <div className="board-area">
            {/* --- NOBLES --- */}
            <div className="row nobles-row">
                {gameState.board.nobles.map((noble, i) => {
                    const isSelectable = isSelectingNoble && gameState.pending_nobles?.includes(i);
                    const delay = `${i * 0.1}s`; 
                    return (
                        <img 
                            key={noble.FileName}
                            id={`noble-${i}`}
                            src={getAssetUrl(noble.FileName, 'card')} 
                            className={`card noble ${isSelectable ? 'noble-selectable' : ''} ${isSelectingNoble && !isSelectable ? 'noble-dimmed' : ''} card-enter-anim`} 
                            style={{ animationDelay: delay }}
                            onClick={() => onNobleClick(i)}
                            alt="Noble Card"
                        />
                    );
                })}
            </div>

            {/* --- CARD LEVELS --- */}
            {[3, 2, 1].map(lvl => {
                const levelKey = `level${lvl}` as keyof GameState['board'];
                const cards = gameState.board[levelKey] as (CardData | null)[];
                
                const isDeckEmpty = gameState.deck_counts?.[lvl] === 0;

                return (
                    <div key={lvl} className={`row card-row row-${lvl}`}>
                        {!isDeckEmpty ? (
                            <img 
                                id={`deck-back-${lvl}`}
                                src={getAssetUrl(`images/row${lvl}back.webp`, 'card')} 
                                className={`card deck-back ${isMyTurn && myReservedCount < 3 ? 'affordable' : ''}`}
                                alt={`Level ${lvl} Deck`}
                                onClick={() => isMyTurn && myReservedCount < 3 && onReserve(lvl, "deck")}
                                style={{ cursor: isMyTurn && myReservedCount < 3 ? 'pointer' : 'default' }}
                            />
                        ) : (
                            <div 
                                className="card-wrapper empty-slot" 
                                style={{ width: '140px', height: '200px' }}
                                title={`Level ${lvl} Deck Empty`}
                            ></div>
                        )}

                        {cards.map((card, i) => {
                            if (!card) return <div key={`empty-${lvl}-${i}`} className="card-wrapper empty-slot"></div>;
                            
                            const affordable = isMyTurn && canBuy(card);
                            const canRes = isMyTurn && myReservedCount < 3;
                            
                            const delay = `${(lvl * 0.1) + (i * 0.05)}s`;
                            
                            return (
                                <div 
                                    key={card.FileName} 
                                    className={`card-wrapper ${affordable ? 'affordable' : ''} card-enter-anim`}
                                    style={{ animationDelay: delay }}
                                >
                                    <img 
                                        id={`board-card-${lvl}-${i}`} 
                                        src={getAssetUrl(card.FileName, 'card')} 
                                        className="card"
                                        onClick={() => affordable && onBuy(lvl, i)}
                                        alt={`Card Level ${lvl}`}
                                    />
                                    
                                    {/* --- ADD TOOLTIP HERE --- */}
                                    <CardTooltip card={card} players={gameState.players} myId={myId} />

                                    {canRes && (
                                        <button 
                                            className="reserve-btn" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                onReserve(lvl, i); 
                                            }}
                                            title="Reserve Card"
                                        >R</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};
// src/components/Board.tsx

import React from 'react';
import type { GameState, CardData } from '../types'; 
import { getAssetUrl } from '../constants';  
import '../styles/Board.css';

interface BoardProps {
    gameState: GameState;
    canBuy: (card: CardData) => boolean;
    onBuy: (row: number, idx: number) => void;
    onReserve: (row: number, idx: number | string) => void;
    onNobleClick: (idx: number) => void;
    isSelectingNoble: boolean;
    myReservedCount: number;
    isMyTurn: boolean;
}

export const Board: React.FC<BoardProps> = ({ 
    gameState, canBuy, onBuy, onReserve, onNobleClick, isSelectingNoble, myReservedCount, isMyTurn 
}) => {
    const style = gameState.deck_style || 'original';

    return (
        <div className="board-area">
            {/* --- NOBLES --- */}
            <div className="row nobles-row">
                {gameState.board.nobles.map((noble, i) => {
                    const isSelectable = isSelectingNoble && gameState.pending_nobles?.includes(i);
                    const delay = `${i * 0.1}s`; 
                    return (
                        <img 
                            key={i} 
                            id={`noble-${i}`} // <--- ADD THIS ID
                            src={getAssetUrl(noble.FileName, 'card', style)} 
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
                
                // Determine if this row's deck is empty
                const isDeckEmpty = gameState.deck_counts?.[lvl] === 0;

                return (
                    <div key={lvl} className="row card-row">
                        
                        {!isDeckEmpty ? (
                            <img 
                                id={`deck-back-${lvl}`}
                                src={getAssetUrl(`images/row${lvl}back.jpg`, 'card', style)} 
                                className={`card deck-back ${isMyTurn && myReservedCount < 3 ? 'affordable' : ''}`}
                                alt={`Level ${lvl} Deck`}
                                onClick={() => isMyTurn && myReservedCount < 3 && onReserve(lvl, "deck")}
                                style={{ cursor: isMyTurn && myReservedCount < 3 ? 'pointer' : 'default' }}
                            />
                        ) : (
                            // Use explicit 140x200 styling to override the default 110px empty-slot size
                            // This guarantees the board elements will not jiggle horizontally when the deck empties.
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
                            
                            // Calculate stagger delay based on the row level and column index
                            const delay = `${(lvl * 0.1) + (i * 0.05)}s`;
                            
                            return (
                                <div 
                                    key={card.FileName} 
                                    className={`card-wrapper ${affordable ? 'affordable' : ''} card-enter-anim`}
                                    style={{ animationDelay: delay }}
                                >
                                    <img 
                                        id={`board-card-${lvl}-${i}`} 
                                        src={getAssetUrl(card.FileName, 'card', style)} 
                                        className="card"
                                        onClick={() => affordable && onBuy(lvl, i)}
                                        alt={`Card Level ${lvl}`}
                                    />
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
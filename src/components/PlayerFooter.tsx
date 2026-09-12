// src/components/PlayerFooter.tsx
import React, { useState, useEffect } from 'react';
import type { Player, CardData } from '../types';
import { getAssetUrl, COLORS } from '../constants';
import { GameLog } from './GameLog';
import ThemeToggle from './ThemeToggle';
import { AnimatedScore } from './AnimatedScore';
import '../styles/Players.css';

interface PlayerFooterProps {
  players: Player[];
  currentTurn: string;
  myId: string;
  sendMove: (action: string, payload: any) => void;
  canBuy: (card: CardData) => boolean;
  selectedTokens: string[];
  onConfirmTokens: () => void;
  onClearTokens: () => void;
  isTokenMoveValid: boolean;
  isMyTurn: boolean; 
  roundNumber: number;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  useGreyBg: boolean;
  onGreyToggle: () => void;
  isDiscarding: boolean; 
  onTokenClick: (color: string) => void;
  onConfirmDiscard: () => void;
  isDiscardValid: boolean;
  excessCount: number;
  lastMove?: any; 
  actionFocusPlayerId: string | null;
}

const TokenCountDisplay: React.FC<{ count: number }> = ({ count }) => {
  const [error, setError] = useState(false);
  
  useEffect(() => { 
      setError(false); 
  }, [count]);

  // Fallback to text if image errors out or if count > 10
  if (error || count > 10) {
      return <span className="p-token-count">{count}</span>;
  }
  
  return (
      <img 
          src={`/images/count/${count}.png`} 
          alt={count.toString()} 
          className="p-token-count-img" 
          onError={() => setError(true)} 
      />
  );
};

// FIX: Lifted pure function outside of component render cycle
const getStacks = (purchased: CardData[]) => {
  const stacks: Record<string, CardData[]> = {
    white: [], blue: [], green: [], red: [], brown: [],
  };
  purchased.forEach(card => {
    const color = card.gemColor?.toLowerCase();
    if (color && stacks[color]) {
      stacks[color].push(card);
    }
  });
  return stacks;
};

export const PlayerFooter: React.FC<PlayerFooterProps> = ({
  players,
  currentTurn,
  myId,
  sendMove,
  canBuy,
  selectedTokens,
  onConfirmTokens,
  onClearTokens,
  isTokenMoveValid,
  isMyTurn, 
  roundNumber,
  theme,
  onThemeToggle,
  useGreyBg,
  onGreyToggle,
  isDiscarding, 
  onTokenClick,
  onConfirmDiscard,
  isDiscardValid,
  excessCount,
  lastMove,
  actionFocusPlayerId,
}) => {
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);

  const me = players.find(p => p.id === myId);
  const others = players.filter(p => p.id !== myId);
  
  let displayPlayerId = myId;
  if (actionFocusPlayerId) {
      displayPlayerId = actionFocusPlayerId;
  } else if (hoveredPlayerId) {
      displayPlayerId = hoveredPlayerId;
  }
  const displayPlayer = players.find(p => p.id === displayPlayerId) || me;

  const renderPlayerCard = (p: Player, isMe: boolean, scaleClass: string = '', isPeek: boolean = false) => {
    const stacks = getStacks(p.purchased_cards || []);
    const isActive = p.id === currentTurn;
    const reservedCards = p.reserved || [];
    
    const totalTokens = Object.values(p.tokens).reduce((sum, val) => sum + val, 0);
    
    const domId = (base: string) => isPeek ? `${base}-peek` : base;
    
    const showTokenActions = isMe && isMyTurn && !isDiscarding && selectedTokens.length > 0;
    const showDiscardActions = isMe && isDiscarding;
    const tokensInteract = isMe && isDiscarding;

    const isLastMoveGold = lastMove?.type === 'RESERVE' && lastMove.player_id === p.id && lastMove.got_gold;
    
    const effectiveColor = (isMe && useGreyBg) ? 'grey' : (p.color || 'blue');
    const mode = theme === 'dark' ? 'dark' : 'light';
    const dynamicBg = `url('/images/backgrounds/${mode}3${effectiveColor}.webp')`;
    
    return (
      <div 
        key={p.id} 
        className={`player-summary ${isActive ? "active-p" : ""} ${scaleClass}`}
        style={{ '--bg-player': dynamicBg } as React.CSSProperties}
      >
        <div className="player-header-row">
          <div className="header-left-group">

            {showTokenActions && (
              <div className="token-staging-row">
                <div className="staging-tokens">
                  {selectedTokens.map((c, i) => (
                    <img
                      key={i}
                      src={getAssetUrl(c, 'token')}
                      className="staging-token-img"
                      alt={c}
                    />
                  ))}
                </div>

                <div className="staging-actions">
                  <button
                    className="confirm-btn"
                    disabled={!isTokenMoveValid}
                    onClick={onConfirmTokens}
                  >
                    <img src="/images/buttons/confirm.webp" alt="Confirm" className="btn-icon" />
                  </button>

                  <button className="reset-btn" onClick={onClearTokens}>
                    <img src="/images/buttons/clear.webp" alt="Clear" className="btn-icon" />
                  </button>
                </div>
              </div>
            )}            
            <div className="p-identity">
              <AnimatedScore score={p.points} className="p-score" animClassName="score-increase-anim" />
              <span className="p-separator">|</span>
              <TokenCountDisplay count={totalTokens} />
              <span className="p-separator">-</span>
              <div className="p-name">{isMe ? 'You' : p.id}</div>
            </div>
          </div>

          {showDiscardActions && (
            <div className="token-staging-row discard-mode">
              <div className="discard-prompt">
                <h3>Discard Tokens</h3>
                <p>Select {excessCount} to remove</p>
              </div>
              <div className="staging-tokens">
                {selectedTokens.map((c, i) => (
                  <img
                    key={i}
                    src={getAssetUrl(c, 'token')}
                    className="staging-token-img"
                    alt={c}
                  />
                ))}
              </div>
              <div className="staging-actions">
                <button className="confirm-btn" disabled={!isDiscardValid} onClick={onConfirmDiscard}>
                  <img src="/images/buttons/confirm.webp" alt="Confirm" className="btn-icon" />
                </button>
                <button className="reset-btn" onClick={onClearTokens}>
                  <img src="/images/buttons/clear.webp" alt="Clear" className="btn-icon" />
                </button>
              </div>
            </div>
          )}

          <div className="p-nobles">
            {p.nobles.map((noble, i) => (
              <img
                key={i}
                src={getAssetUrl(noble.FileName, 'card')}
                className="mini-noble"
                title="Noble"
                alt="Noble"
              />
            ))}
          </div>
        </div>

        <div className="player-card-body">
            {COLORS.map(color => {
                const isLastMoveToken = lastMove?.type === 'TAKE_TOKENS' && lastMove.player_id === p.id && lastMove.tokens?.includes(color);

                return (
                  <div key={color} className="strategy-column">
                      
                      <div className="micro-token-wrapper" id={domId(`player-tokens-header-${p.id}`)}>
                          <img 
                              id={domId(`player-token-${p.id}-${color}`)}
                              src={getAssetUrl(color, 'token')} 
                              className={`micro-token-img ${isLastMoveToken ? 'last-move-glow-token' : ''}`} 
                              style={{ 
                                  opacity: p.tokens[color] > 0 ? 1 : 0.2,
                                  cursor: (tokensInteract && p.tokens[color] > 0) ? 'pointer' : 'default',
                                  border: (tokensInteract && p.tokens[color] > 0) ? '2px solid white' : ''
                              }}
                              onClick={() => (tokensInteract && p.tokens[color] > 0) && onTokenClick(color)}
                              alt={`${color} token`}
                          />
                          {p.tokens[color] > 0 && (
                              <span className="micro-token-count">{p.tokens[color]}</span>
                          )}
                      </div>

                      <div className="p-purchased-stack" id={domId(`player-stack-${p.id}-${color}`)}>
                          {stacks[color].map((card, idx) => {
                              const isLastMoveCard = lastMove?.type === 'BUY' && lastMove.player_id === p.id && lastMove.card_filename === card.FileName;
                              
                              return (
                                <img 
                                    key={`${card.FileName}-${idx}`}
                                    src={getAssetUrl(card.FileName, 'card')} 
                                    className={`stacked-card ${isLastMoveCard ? 'last-move-glow-card' : ''}`}
                                    style={{ top: `${idx * 35}px`, zIndex: isLastMoveCard ? 99 : idx }}
                                    alt="purchased card"
                                />
                              );
                          })}
                      </div>
                  </div>
                );
            })}

            <div className="reserved-column">
                <div className="micro-token-wrapper">
                    <img 
                        id={domId(`player-token-${p.id}-gold`)} 
                        src={getAssetUrl('gold', 'token')} 
                        className={`micro-token-img ${isLastMoveGold ? 'last-move-glow-token' : ''}`} 
                        style={{ 
                            opacity: p.tokens.gold > 0 ? 1 : 0.2,
                            cursor: (tokensInteract && p.tokens.gold > 0) ? 'pointer' : 'default',
                            border: (tokensInteract && p.tokens.gold > 0) ? '2px solid white' : ''
                        }}
                        onClick={() => (tokensInteract && p.tokens.gold > 0) && onTokenClick('gold')}
                        alt="gold token"
                    />
                    {p.tokens.gold > 0 && <span className="micro-token-count">{p.tokens.gold}</span>}
                </div>

                <div className="reserved-label">Reserved</div>
                <div className="reserved-cards-stack">
                    {reservedCards.length > 0 ? (
                        isMe ? (
                            reservedCards.map((card, i) => {
                                const affordable = isActive && canBuy(card);
                                return (
                                    <img 
                                        key={i} 
                                        id={domId(`reserved-card-${p.id}-${i}`)}
                                        src={getAssetUrl(card.FileName, 'card')} 
                                        className="res-card-img"
                                        style={{ 
                                            border: affordable ? '3px solid #2ecc71' : '2px solid gold',
                                            top: `${i * 35}px`, zIndex: i
                                        }}
                                        onClick={() => affordable && sendMove('BUY_RESERVED', { cardIndex: i })}
                                        alt="reserved card"
                                    />
                                );
                            })
                        ) : (
                            reservedCards.map((card, i) => (
                                <img 
                                    key={i} 
                                    id={domId(`reserved-card-${p.id}-${i}`)} 
                                    className="res-back"
                                    src={getAssetUrl(`images/row${card.cardRow}back.webp`, 'card')}
                                    style={{ top: `${i * 35}px`, zIndex: i }}
                                    alt="opponent reserved card"
                                />
                            ))
                        )
                    ) : (
                        <div style={{color: '#95a5a6', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', marginTop: '20px'}}>Empty</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  };
    
  return (
    <div className="player-list">
      {displayPlayer && renderPlayerCard(
          displayPlayer, 
          displayPlayer.id === myId, 
          '', 
          displayPlayer.id !== myId
      )}

      <div
        className="bottom-area-wrapper"
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'flex-start',
        }}
      >
        {others.length > 0 && (
          <div className={`opponents-row count-${players.length}`}>
            {others.map(p => (
              <div 
                key={p.id} 
                className="opponent-slot"
                onMouseEnter={() => setHoveredPlayerId(p.id)}
                onMouseLeave={() => setHoveredPlayerId(null)}
                style={{ cursor: 'pointer' }}
              >
                {renderPlayerCard(p, false, 'other-player-summary')}
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-container">
          <GameLog
            roundNumber={roundNumber}
            players={players}
            currentTurn={currentTurn}
          />
          <ThemeToggle 
              theme={theme} 
              onThemeToggle={onThemeToggle} 
              useGreyBg={useGreyBg}
              onGreyToggle={onGreyToggle}
              playerColor={me?.color || 'blue'}
          />
        </div>
      </div>
    </div>
  );
};
// src/components/GameScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Board } from './Board';
import { TokenArea } from './TokenArea';
import { PlayerFooter } from './PlayerFooter';
import { GameOverOverlay, GoldConfirmationOverlay, NobleSelectionOverlay } from './Overlays';
import { HowToPlay } from './HowToPlay';
import { AnimationLayer, type AnimationRequest } from './AnimationLayer';
import { YourTurnAnimation } from './YourTurnAnimation';
import { getAssetUrl, COLORS } from '../constants';
import type { GameState, CardData, Player } from '../types';
import { useGameNotifications } from '../hooks/useGameNotifications';
import { useOpponentMoveAnimator } from '../hooks/useGameAnimations';
import { useTurnBanner } from "../hooks/useTurnBanner";

interface GameScreenProps {
  playerName: string;
  playerColor: string;  
  gameState: GameState;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  useGreyBg: boolean;
  setUseGreyBg: (v: boolean) => void;
  showHowToPlay: boolean;
  setShowHowToPlay: (v: boolean) => void;
  sendMoveRaw: (action: string, payload?: any) => void;
  isAwaitingServer: boolean;
  setIsAwaitingServer: (v: boolean) => void;
  animations: AnimationRequest[];
  triggerAnimation: any;
  removeAnimation: (id: number) => void;
}

// FIX: Lifted pure function outside of component render cycle
const getPaymentDetails = (player: Player, card: CardData) => {
    const payment: Record<string, number> = {};
    let goldNeeded = 0;
    COLORS.forEach(color => {
        const c = color.charAt(0).toUpperCase() + color.slice(1);
        const costKey = `cost${c}` as keyof CardData;
        const cost = (card[costKey] as number) || 0;
        const bonus = player.cards[color] || 0;
        const actualCost = Math.max(0, cost - bonus);
        const playerHas = player.tokens[color] || 0;
        
        if (playerHas >= actualCost) {
            if (actualCost > 0) payment[color] = actualCost;
        } else {
            if (playerHas > 0) payment[color] = playerHas;
            goldNeeded += (actualCost - playerHas);
        }
    });
    if (goldNeeded > 0) payment['gold'] = goldNeeded;
    return payment;
};

export const GameScreen: React.FC<GameScreenProps> = ({
  playerName, gameState, theme, onThemeToggle, useGreyBg, setUseGreyBg, showHowToPlay, setShowHowToPlay,
  sendMoveRaw, isAwaitingServer, setIsAwaitingServer,
  animations, triggerAnimation, removeAnimation
}) => {
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [pendingMove, setPendingMove] = useState<{ action: string; payload: any; goldCost: number } | null>(null);
  const [actionFocusPlayerId, setActionFocusPlayerId] = useState<string | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = gameState.players.find((p) => p.id === playerName);
  const isMyTurn = gameState.current_turn === playerName && gameState.status === 'active' && !isAwaitingServer;
  const isDiscarding = gameState.status === 'discarding' && gameState.current_turn === playerName && !isAwaitingServer;
  const isSelectingNoble = gameState.status === 'selecting_noble' && gameState.current_turn === playerName && !isAwaitingServer;
  
  const totalTokens = me ? Object.values(me.tokens).reduce((a, b) => a + b, 0) : 0;
  const isDiscardValid = totalTokens - selectedTokens.length === 10;
  const excessCount = totalTokens > 10 ? totalTokens - 10 : 0;

  useEffect(() => { setSelectedTokens([]); }, [gameState]);

  useGameNotifications(gameState, !!isMyTurn, !!isDiscarding, !!isSelectingNoble);

  const executeWithFocus = useCallback((playerId: string, animationLogic: () => void) => {
    setActionFocusPlayerId(playerId);
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    setTimeout(() => { animationLogic(); }, 50);
    focusTimeoutRef.current = setTimeout(() => { setActionFocusPlayerId(null); }, 1500);
  }, []);

  useOpponentMoveAnimator(gameState, playerName, triggerAnimation, executeWithFocus);

  const calculateGoldNeeded = (card: CardData) => {
    if (!me || !card) return 0;
    let goldNeeded = 0;
    for (const c of ['White', 'Blue', 'Green', 'Red', 'Brown']) {
      const costKey = `cost${c}` as keyof CardData;
      const cost = (card[costKey] as number) || 0;
      const colorKey = c.toLowerCase();
      const bonus = me.cards[colorKey] || 0;
      const tokens = me.tokens[colorKey] || 0;
      const actualCost = Math.max(0, cost - bonus);
      if (tokens < actualCost) goldNeeded += (actualCost - tokens);
    }
    return goldNeeded;
  };

  const sendMove = (action: string, payload: any = {}) => { 
    executeWithFocus(playerName, () => {
        const getEl = (id: string) => document.getElementById(`${id}-peek`) || document.getElementById(id);

        if (action === 'BUY' || action === 'BUY_RESERVED') {
            let card: CardData | null = null;
            let startElCard: HTMLElement | null = null;
            
            if (action === 'BUY') {
                const { row, cardIndex } = payload;
                const levelKey = `level${row}` as 'level1' | 'level2' | 'level3';
                card = gameState.board[levelKey][cardIndex];
                startElCard = document.getElementById(`board-card-${row}-${cardIndex}`);
                if (startElCard) {
                    startElCard.style.opacity = '0';
                    startElCard.style.pointerEvents = 'none'; 
                }
            } else {
                const { cardIndex } = payload;
                if (me && me.reserved) {
                    card = me.reserved[cardIndex];
                    startElCard = getEl(`reserved-card-${playerName}-${cardIndex}`);
                    if (startElCard) {
                        startElCard.style.opacity = '0';
                        startElCard.style.pointerEvents = 'none'; 
                    }
                }
            }
            if (card && me) {
                const color = card.gemColor?.toLowerCase() || 'white';
                const endCardIds = [`player-stack-${playerName}-${color}-peek`, `player-stack-${playerName}-${color}`];
                triggerAnimation(getAssetUrl(card.FileName, 'card'), startElCard, endCardIds, 0, undefined, false, 'card', playerName);
                
                if (action === 'BUY') {
                    const { row, cardIndex } = payload;
                    const deckStartEl = document.getElementById(`deck-back-${row}`);
                    const slotEndId = `board-card-${row}-${cardIndex}`; 
                    triggerAnimation(getAssetUrl(`images/row${row}back.webp`, 'card'), deckStartEl, slotEndId, 100, undefined, 'half', 'card', playerName);
                }

                const payment = getPaymentDetails(me, card);
                let stagger = 0;
                Object.entries(payment).forEach(([payColor, amount]) => {
                    for (let i = 0; i < amount; i++) {
                        const tokenStartEl = getEl(`player-token-${playerName}-${payColor}`);
                        const tokenEndId = `token-bank-${payColor}`;
                        stagger += 80; 
                        triggerAnimation(getAssetUrl(payColor, 'token'), tokenStartEl, tokenEndId, stagger, undefined, false, 'token', playerName);
                    }
                });
            }
        } else if (action === 'RESERVE') {
            const { row, cardIndex } = payload;
            if (me) {
                const nextSlot = me.reserved ? me.reserved.length : 0;
                const deckStartEl = document.getElementById(`deck-back-${row}`);
                const endTargets = [`reserved-card-${playerName}-${nextSlot}-peek`, `reserved-card-${playerName}-${nextSlot}`];

                if (cardIndex === "deck") {
                    triggerAnimation(getAssetUrl(`images/row${row}back.webp`, 'card'), deckStartEl, endTargets, 0, undefined, false, 'card', playerName);
                } else {
                    const levelKey = `level${row}` as 'level1' | 'level2' | 'level3';
                    const card = gameState.board[levelKey][cardIndex];
                    const startEl = document.getElementById(`board-card-${row}-${cardIndex}`);
                    if (startEl) {
                        startEl.style.opacity = '0'; 
                        startEl.style.pointerEvents = 'none'; 
                    }
                    
                    triggerAnimation(getAssetUrl(card.FileName, 'card'), startEl, endTargets, 0, undefined, false, 'card', playerName);
                    const slotEndId = `board-card-${row}-${cardIndex}`;
                    triggerAnimation(getAssetUrl(`images/row${row}back.webp`, 'card'), deckStartEl, slotEndId, 100, undefined, 'half', 'card', playerName);
                }

                if (gameState.board.tokens.gold > 0) {
                    const goldStart = document.getElementById('token-bank-gold');
                    const goldEnd = [`player-token-${playerName}-gold-peek`, `player-token-${playerName}-gold`];
                    triggerAnimation(getAssetUrl('gold', 'token'), goldStart, goldEnd, 200, undefined, false, 'token', playerName);
                }
            }
        } else if (action === 'TAKE_TOKENS') {
            payload.tokens.forEach((color: string, i: number) => {
                const startEl = document.getElementById(`token-bank-${color}`);
                const endTargets = [
                    `player-token-${playerName}-${color}-peek`,
                    `player-token-${playerName}-${color}`,
                    `player-tokens-header-${playerName}-peek`,
                    `player-tokens-header-${playerName}`
                ];
                triggerAnimation(getAssetUrl(color, 'token'), startEl, endTargets, i * 100, undefined, false, 'token', playerName);
            });
        } else if (action === 'DISCARD_TOKENS') { 
            payload.tokens.forEach((color: string, i: number) => {
                const startEl = getEl(`player-token-${playerName}-${color}`);
                const endTargets = [`token-bank-${color}`];
                triggerAnimation(getAssetUrl(color, 'token'), startEl, endTargets, i * 100, undefined, false, 'token', playerName);
            });
             
        } else if (action === 'SELECT_NOBLE') {
            const { nobleIndex } = payload;
            const startEl = document.getElementById(`noble-${nobleIndex}`);
            const endTargets = [`player-tokens-header-${playerName}-peek`, `player-tokens-header-${playerName}`];
            if (startEl && gameState.board.nobles[nobleIndex]) {
                triggerAnimation(getAssetUrl(gameState.board.nobles[nobleIndex].FileName, 'card'), startEl, endTargets, 0, undefined, false, 'card', playerName);
            } 
        }

        setIsAwaitingServer(true);
        sendMoveRaw(action, payload);
    });
  };

  const initiateBuy = (row: number, cardIndex: number, isReserved: boolean = false) => {
      let card: CardData | null = null;
      if (isReserved) {
          if (me?.reserved && me.reserved[cardIndex]) card = me.reserved[cardIndex];
      } else {
          const levelKey = `level${row}` as 'level1' | 'level2' | 'level3';
          card = gameState.board[levelKey][cardIndex];
      }
      if (!card) return;
      
      const goldNeeded = calculateGoldNeeded(card);
      const action = isReserved ? 'BUY_RESERVED' : 'BUY';
      const payload = isReserved ? { cardIndex } : { row, cardIndex };
      
      if (goldNeeded > 0) {
          setPendingMove({ action, payload, goldCost: goldNeeded });
      } else {
          sendMove(action, payload);
      }
  };

  const confirmPendingMove = () => {
      if (pendingMove) {
          sendMove(pendingMove.action, pendingMove.payload);
          setPendingMove(null);
      }
  };
  const cancelPendingMove = () => setPendingMove(null);
  
  const handleBankTokenClick = (color: string) => {
    if (!isMyTurn || isDiscarding || color === 'gold') return;
    const boardCount = gameState.board.tokens[color];
    const currentSel = selectedTokens.filter((c) => c === color).length;
    if (boardCount - currentSel <= 0) return;

    const newSel = [...selectedTokens, color];
    if (selectedTokens.length === 2 && selectedTokens[0] === selectedTokens[1]) return;
    if (currentSel === 1 && (boardCount < 4 || selectedTokens.length > 1)) return;
    if (currentSel === 0 && (selectedTokens.length >= 3 || (selectedTokens.length === 2 && selectedTokens[0] === selectedTokens[1]))) return;
    setSelectedTokens(newSel);
  };

  const handlePlayerTokenClick = (color: string) => {
      if (!isDiscarding || !me) return;
      const myCount = me.tokens[color] || 0;
      const alreadySelected = selectedTokens.filter(c => c === color).length;
      if (myCount - alreadySelected > 0 && selectedTokens.length < excessCount) {
          setSelectedTokens([...selectedTokens, color]);
      }
  };

  const isTokenMoveValid = () => {
    const count = selectedTokens.length;
    if (count === 0) return false; 
    const uniqueCount = new Set(selectedTokens).size; 
    if (count === 2 && uniqueCount === 1) return true;
    if (count === uniqueCount && count <= 3) {
        const availableColors = COLORS.filter(c => (gameState.board.tokens[c] ?? 0) > 0).length;
        const requiredCount = Math.min(3, availableColors);
        return count === requiredCount;
    } 
    return false;
  };

  const canBuy = (card: CardData) => {
    if (!me) return false;
    let goldNeeded = 0;
    for (const color of COLORS) {
        const c = color.charAt(0).toUpperCase() + color.slice(1);
        const costKey = `cost${c}` as keyof CardData;
        const cost = (card[costKey] as number) || 0;
        const bonus = me.cards[color] || 0;
        const actualCost = Math.max(0, cost - bonus);
        const has = me.tokens[color] || 0;
        if (has < actualCost) goldNeeded += actualCost - has;
    }
    return goldNeeded <= (me.tokens['gold'] || 0);
  };

  const showTurnBanner = useTurnBanner(isMyTurn);

  const activeColor = useGreyBg ? 'grey' : (me?.color || 'blue');
  const mode = theme === 'dark' ? 'dark' : 'light';
  
  const dynamicStyles = {
    '--bg-board': `url('/images/backgrounds/${mode}1${activeColor}.webp')`,
    '--bg-tokens': `url('/images/backgrounds/${mode}2${activeColor}.webp')`
  } as React.CSSProperties;

  return (
    <div className={`game-container theme-${theme}`} style={dynamicStyles}>
      <YourTurnAnimation isMyTurn={!!isMyTurn} />
      {showTurnBanner && (
        <div className="turn-banner-overlay">
          <img src="/images/yourturn/your_turn_banner.webp" alt="Your Turn!" className="turn-banner-gif" />
        </div>
      )}

      <AnimationLayer animations={animations} onComplete={removeAnimation} />

      {gameState?.status === 'finished' && (
        <GameOverOverlay winner={gameState.winner!} onRestart={() => sendMoveRaw('RESET_GAME')} />
      )}
      
      {pendingMove && (
          <GoldConfirmationOverlay 
            goldCost={pendingMove.goldCost} 
            onConfirm={confirmPendingMove}
            onCancel={cancelPendingMove}
          />
      )}

      {isSelectingNoble && gameState.pending_nobles && (
          <NobleSelectionOverlay
              nobles={gameState.board.nobles}
              pendingIndices={gameState.pending_nobles}
              onSelect={(idx) => sendMove('SELECT_NOBLE', { nobleIndex: idx })} 
          />
      )}

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}       

      <div className="game-layout">
        <div className="left-panel">
          <Board
            gameState={gameState}
            canBuy={canBuy} 
            onBuy={(row, idx) => initiateBuy(row, idx, false)} 
            onReserve={(row, idx) => sendMove('RESERVE', { row, cardIndex: idx })}  
            onNobleClick={(idx) => isSelectingNoble && sendMove('SELECT_NOBLE', { nobleIndex: idx })}
            isSelectingNoble={isSelectingNoble || false}
            myReservedCount={me?.reserved?.length || 0}
            isMyTurn={!!isMyTurn && !pendingMove} 
            myId={playerName} /* <-- PASSED HERE */
          />
        </div>

        <div className="middle-panel">
          <TokenArea
            gameState={gameState}
            onTokenClick={handleBankTokenClick}  
            isMyTurn={!!isMyTurn}
            isDiscarding={!!isDiscarding}
          />
          <button className="how-to-play-btn game-htp-btn" onClick={() => setShowHowToPlay(true)}>
            <img src="/images/buttons/howtoplay.webp" alt="How to Play" />
          </button>
        </div>
        
        <div className="right-panel">
          <PlayerFooter 
            players={gameState?.players || []}
            currentTurn={gameState?.current_turn || ""}
            myId={playerName}
            sendMove={(action, payload) => {
              if (action === 'BUY_RESERVED') initiateBuy(0, payload.cardIndex, true);
              else sendMove(action, payload);
            }}
            canBuy={canBuy}
            selectedTokens={selectedTokens}
            onConfirmTokens={() => sendMove('TAKE_TOKENS', { tokens: selectedTokens })}
            onClearTokens={() => setSelectedTokens([])}
            isTokenMoveValid={isTokenMoveValid()}
            isMyTurn={!!isMyTurn} 
            roundNumber={gameState?.round_number || 1} 
            theme={theme}
            onThemeToggle={onThemeToggle}
            useGreyBg={useGreyBg}
            onGreyToggle={() => setUseGreyBg(!useGreyBg)}
            isDiscarding={!!isDiscarding}
            onTokenClick={handlePlayerTokenClick} 
            onConfirmDiscard={() => sendMove('DISCARD_TOKENS', { tokens: selectedTokens })}
            isDiscardValid={isDiscardValid}
            excessCount={excessCount}
            lastMove={gameState?.last_move}
            actionFocusPlayerId={actionFocusPlayerId} 
          />
        </div>
      </div>
    </div>
  );
}
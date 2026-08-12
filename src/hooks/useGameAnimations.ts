// src/hooks/useGameAnimations.ts
import { useState, useRef, useEffect } from 'react';
import type { AnimationRequest } from '../components/AnimationLayer';
import type { GameState } from '../types';
import { getAssetUrl } from '../constants';

const ANIM_DURATION = 800;

export const useGameAnimations = () => {
    const [animations, setAnimations] = useState<AnimationRequest[]>([]);
    const animationEndTime = useRef<number>(0);

    // FIX (Bug 2): Added `playerId` as the 8th parameter to match all call sites in App.tsx
    const triggerAnimation = (
        src: string,
        startEl: HTMLElement | null,
        endElId: string | string[],
        delayOffset = 0,
        backSrc?: string,
        flip: boolean | 'half' = false,
        type: 'token' | 'card' = 'card',
        playerId?: string
    ) => {
        if (!startEl) return;

        let endEl: HTMLElement | null = null;
        if (Array.isArray(endElId)) {
            for (const id of endElId) {
                endEl = document.getElementById(id);
                if (endEl) break;
            }
        } else {
            endEl = document.getElementById(endElId);
        }

        if (startEl && endEl) {
            const startRect = startEl.getBoundingClientRect();
            const endRect = endEl.getBoundingClientRect();

            const newAnim: AnimationRequest = {
                id: Date.now() + Math.random(),
                src,
                backSrc,
                start: startRect,
                end: endRect,
                flip,
                type,
                playerId  // FIX (Bug 2): Now actually stored on the animation object
            };

            setTimeout(() => {
                setAnimations(prev => [...prev, newAnim]);
            }, delayOffset);

            const finishTime = Date.now() + delayOffset + ANIM_DURATION + 50;
            if (finishTime > animationEndTime.current) {
                animationEndTime.current = finishTime;
            }
        }
    };

    const removeAnimation = (id: number) => {
        setAnimations(prev => prev.filter(a => a.id !== id));
    };

    return { animations, animationEndTime, triggerAnimation, removeAnimation };
};

export const useOpponentMoveAnimator = (
    gameState: GameState | null,
    playerName: string,
    triggerAnimation: (
        src: string,
        startEl: HTMLElement | null,
        endElId: string | string[],
        delayOffset?: number,
        backSrc?: string,
        flip?: boolean | 'half',
        type?: 'token' | 'card',
        playerId?: string  // FIX (Bug 3): Typed properly instead of `any`
    ) => void,
    executeWithFocus: (playerId: string, cb: () => void) => void
) => {
    const previousMoveRef = useRef<string | null>(null);

    useEffect(() => {
        if (!gameState || !gameState.last_move) return;

        const move = gameState.last_move;
        const moveStr = JSON.stringify(move);

        // Prevent re-triggering the same move
        if (moveStr === previousMoveRef.current) return;
        previousMoveRef.current = moveStr;

        // We handle our own moves optimistically, so skip local player
        if (move.player_id === playerName) return;

        // Force focus on opponent, wait 50ms for DOM render, then animate
        executeWithFocus(move.player_id, () => {
            const style = gameState.deck_style || 'original';
            const oppId = move.player_id;

            if (move.type === 'TAKE_TOKENS' && move.tokens) {
                move.tokens.forEach((color: string, i: number) => {
                    const startEl = document.getElementById(`token-bank-${color}`);
                    const endTargets = [
                        `player-token-${oppId}-${color}-peek`,
                        `player-token-${oppId}-${color}`,
                        `player-tokens-header-${oppId}-peek`,
                        `player-tokens-header-${oppId}`
                    ]; 
                    triggerAnimation(getAssetUrl(color, 'token', style), startEl, endTargets, i * 100, undefined, false, 'token', oppId);
                });
            } 
            else if (move.type === 'BUY' && move.card_filename) {
                const startEl = document.querySelector('.board-area') as HTMLElement; 
                const cardFile = move.card_filename;
                
                const opp = gameState.players.find(p => p.id === oppId);
                const boughtCard = opp?.purchased_cards.find(c => c.FileName === cardFile);
                const color = boughtCard?.gemColor?.toLowerCase() || 'white';

                const endTargets = [
                    `player-stack-${oppId}-${color}-peek`,
                    `player-stack-${oppId}-${color}`
                ];
 
                triggerAnimation(getAssetUrl(cardFile, 'card', style), startEl, endTargets, 0, undefined, false, 'card', oppId);
            }
            else if (move.type === 'RESERVE') {
                const startEl = document.querySelector('.board-area') as HTMLElement;
                const opp = gameState.players.find(p => p.id === oppId);
                const nextSlot = opp?.reserved ? Math.max(0, opp.reserved.length - 1) : 0;
                
                const endTargets = [
                    `reserved-card-${oppId}-${nextSlot}-peek`,
                    `reserved-card-${oppId}-${nextSlot}`
                ];

                // --- FIX: Read the exact row from the payload ---
                const row = (move as any).row || 2; 

                triggerAnimation(
                    getAssetUrl(`images/row${row}back.jpg`, 'card', style),
                    startEl,
                    endTargets,
                    0,
                    getAssetUrl(`images/row${row}back.jpg`, 'card', style),
                    true,
                    'card',
                    oppId
                );

                if (move.got_gold) {
                    const goldStart = document.getElementById('token-bank-gold');
                    const goldEnd = [`player-token-${oppId}-gold-peek`, `player-token-${oppId}-gold`];
                    triggerAnimation(getAssetUrl('gold', 'token', style), goldStart, goldEnd, 200, undefined, false, 'token', oppId);
                }
            }
            // --- NEW: Catch opponent discards and animate them! ---
            else if (move.type === 'DISCARD_TOKENS' && move.tokens) {
                move.tokens.forEach((color: string, i: number) => {
                    const startEl = document.getElementById(`player-token-${oppId}-${color}`);
                    const endTargets = [`token-bank-${color}`];
                    triggerAnimation(getAssetUrl(color, 'token', style), startEl, endTargets, i * 100, undefined, false, 'token', oppId);
                });
            }
        });

    }, [gameState?.last_move, playerName, triggerAnimation, executeWithFocus, gameState?.deck_style, gameState?.players]);
}; 
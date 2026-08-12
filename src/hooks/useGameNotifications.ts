// src/hooks/useGameNotifications.ts
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import type { GameState } from '../types';

export const useGameNotifications = (
    gameState: GameState | null,
    isMyTurn: boolean,
    isDiscarding: boolean,
    isSelectingNoble: boolean
) => {
    const prevLastRound = useRef<boolean>(false);

    useEffect(() => {
        if (!gameState) return;

        if (gameState.last_round && !prevLastRound.current) {
            // Updated to remove the inline style/theme so it uses App.css
            toast.info("🔔 Last Turn!", {
                position: "top-center",
                autoClose: 5000,
                toastId: "last-turn-notification",
                icon: false
            });
        }
        prevLastRound.current = !!gameState.last_round;

        gameState.players.forEach(p => {
            if (p.points >= 15 && !gameState.winner) {
                toast.warning(`⚠️ ${p.id} has reached 15 points! (Last Round)`, {
                    toastId: `15pts-${p.id}`,
                    position: "top-center",
                    autoClose: 5000,
                    icon: false
                });
            }
        });
    }, [gameState]);

    useEffect(() => {
        if (isMyTurn) {
            toast.success("📣   It's your turn!   📣", {
                position: "bottom-center",
                autoClose: 3000,
                toastId: "turn-notification",
                icon: false
            });
        }
    }, [isMyTurn]);

    useEffect(() => {
        if (isDiscarding) {
            toast.error("⚠️  Too many tokens! You must discard. ⚠️ ", {
                position: "top-center",
                autoClose: false,
                toastId: "discard-notification",
                icon: false
            });
        } else {
            toast.dismiss("discard-notification");
        }
    }, [isDiscarding]);

    useEffect(() => {
        if (isSelectingNoble) {
            toast.warning("👑  Select a Noble 👑", {
                position: "top-center",
                autoClose: false,
                toastId: "noble-notification",
                icon: false
            });
        } else {
            toast.dismiss("noble-notification");
        }
    }, [isSelectingNoble]);
};
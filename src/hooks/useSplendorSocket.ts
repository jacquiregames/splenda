// src/hooks/useSplendorSocket.ts
import { useEffect, useRef } from 'react';
import { SERVER_URL } from '../constants';
import type { GameState } from '../types';

export const useSplendorSocket = (
    playerName: string,
    playerColor: string, 
    isConnected: boolean,
    animationEndTime: React.MutableRefObject<number>,
    onStateUpdate: (state: GameState) => void
) => {
    const ws = useRef<WebSocket | null>(null);
    const pendingState = useRef<GameState | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isConnected || !playerName) return;

        let reconnectTimer: ReturnType<typeof setTimeout>;

        const connect = () => {
            ws.current = new WebSocket(`${SERVER_URL}/${playerName}?color=${playerColor}`);

            ws.current.onmessage = (event) => {
                const parsedState = JSON.parse(event.data);
                const now = Date.now();
                const delay = Math.max(0, animationEndTime.current - now);

                if (delay > 0) {
                    pendingState.current = parsedState;
                    if (!timeoutRef.current) {
                        timeoutRef.current = setTimeout(() => {
                            if (pendingState.current) {
                                onStateUpdate(pendingState.current);
                                pendingState.current = null;
                            }
                            timeoutRef.current = null;
                        }, delay);
                    }
                } else {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    onStateUpdate(parsedState);
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket closed. Reconnecting in 3s...');
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimer);
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnect loop on intentional unmount
                ws.current.close();
            }
        };
    }, [isConnected, playerName, animationEndTime, onStateUpdate]);

    const sendMoveRaw = (action: string, payload: any = {}) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'MOVE', payload: { action, ...payload } }));
        }
    };

    return { sendMoveRaw };
};
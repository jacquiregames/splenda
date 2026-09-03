// src/components/CardTooltip.tsx
import React from 'react';
import type { Player, CardData } from '../types';
import { COLORS, getAssetUrl } from '../constants';

interface CardTooltipProps {
    card: CardData;
    players: Player[];
    myId: string;
}

const calculateDeficit = (player: Player, card: CardData) => {
    const missing: Record<string, number> = {};
    let totalMissing = 0;

    COLORS.forEach(color => {
        const c = color.charAt(0).toUpperCase() + color.slice(1);
        const cost = (card[`cost${c}` as keyof CardData] as number) || 0;
        const bonus = player.cards[color] || 0;
        const actualCost = Math.max(0, cost - bonus);
        const tokens = player.tokens[color] || 0;

        if (tokens < actualCost) {
            missing[color] = actualCost - tokens;
            totalMissing += missing[color];
        }
    });

    const gold = player.tokens.gold || 0;
    const stillNeeded = Math.max(0, totalMissing - gold);
    const goldUsed = Math.min(totalMissing, gold);

    return { missing, totalMissing, gold, stillNeeded, goldUsed };
};

export const CardTooltip: React.FC<CardTooltipProps> = ({ card, players, myId }) => {
    const me = players.find(p => p.id === myId);
    const opponents = players.filter(p => p.id !== myId);

    if (!me) return null;

    const renderDeficit = (player: Player, isMe: boolean) => {
        const { missing, stillNeeded, goldUsed } = calculateDeficit(player, card);

        if (stillNeeded === 0) {
            return <div className="deficit-status affordable-status">✅ Affordable</div>;
        }

        return (
            <div className="deficit-status">
                <div className="missing-gems">
                    {Object.entries(missing).map(([color, amount]) => (
                        <div key={color} className="missing-gem-item">
                            <img src={getAssetUrl(color, 'token')} alt={color} className="tiny-token" />
                            <span>x{amount}</span>
                        </div>
                    ))}
                </div>
                {goldUsed > 0 && (
                    <div className="gold-usage">
                        (Uses <img src={getAssetUrl('gold', 'token')} alt="gold" className="tiny-token" /> x{goldUsed})
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="card-tooltip">
            <div className="tooltip-section user-section">
                <div className="tooltip-player-name">You:</div>
                {renderDeficit(me, true)}
            </div>
            
            {opponents.length > 0 && (
                <div className="tooltip-section opponents-section">
                    {opponents.map(opp => (
                        <div key={opp.id} className="opponent-deficit-row">
                            <div className="tooltip-player-name">{opp.id}:</div>
                            {renderDeficit(opp, false)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
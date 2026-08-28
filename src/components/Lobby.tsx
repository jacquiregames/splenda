// src/components/Lobby.tsx
import React from 'react';
import type { Player } from '../types';
import { FireworksLayer } from './FireworksLayer';   
import '../styles/Login.css';

interface LobbyProps {
    isConnected: boolean;
    playerName: string;
    setPlayerName: (name: string) => void;
    playerColor: string;
    setPlayerColor: (color: string) => void;
    joinGame: () => void;
    players?: Player[];
    sendMove?: (action: string, payload?: any) => void;
    onOpenHowToPlay: () => void;
}

const AVAILABLE_COLORS = ['blue', 'green', 'purple', 'red', 'teal', 'yellow'];

// Reusable Color Picker inline component
const ColorPicker = ({ selected, onSelect, used = [] }: { selected: string, onSelect: (c: string) => void, used: string[] }) => (
    <div className="color-chooser">
        <div className="color-swatch-container">
            {AVAILABLE_COLORS.map(color => {
                const isUsed = used.includes(color) && selected !== color;
                return (
                    <img
                        key={color}
                        src={`/images/playercolors/${color}.png`}
                        className={`color-swatch ${selected === color ? 'selected' : ''} ${isUsed ? 'dimmed' : ''}`}
                        onClick={() => !isUsed && onSelect(color)}
                        alt={color}
                        title={isUsed ? 'Color taken by another player' : color}
                    />
                );
            })}
        </div>
    </div>
);

export const Lobby: React.FC<LobbyProps> = ({ 
    isConnected, playerName, setPlayerName, playerColor, setPlayerColor,
    joinGame, players = [], sendMove, onOpenHowToPlay
}) => {
    const isHost = players.length > 0 && players[0].id === playerName;
    const canStart = players.length >= 2;

    const usedColors = players.map(p => p.color);
    const myBackendColor = players.find(p => p.id === playerName)?.color || playerColor;

    return (
        <div className="game-container login-container">
            <button className="how-to-play-btn lobby-htp-btn" onClick={onOpenHowToPlay}>
                <img src="/images/howtoplay.png" alt="How to Play" />
            </button>
            <FireworksLayer intensity="low" />
            <img src="/images/logo.png" alt="SPLENDA" className="login-logo" /> 
            
            <div className={`login-box ${isConnected ? 'mode-lobby' : 'mode-login'}`}>
                {!isConnected ? (
                    // --- STATE 1: LOGIN (Free Pick) ---
                    <>
                        <input 
                            type="text" 
                            placeholder="Enter your name" 
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && playerName && joinGame()}
                            maxLength={12}
                            autoFocus
                        />
                        <ColorPicker selected={playerColor} onSelect={setPlayerColor} used={[]} />
                        <button disabled={!playerName} onClick={joinGame} className="img-action-btn join-btn">
                            <img src="/images/joingame.png" alt="Join Game" />
                        </button>
                    </>
                ) : (
                    // --- STATE 2: LOBBY LIST (Live Sync) ---
                    <>
                        <h3 className="lobby-header">Players Joined ({players.length}/4)</h3>
                        
                        <ul className="lobby-list">
                            {players.map(p => (
                                <li key={p.id} className="lobby-player">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={`/images/playercolors/${p.color}.png`} className="mini-lobby-swatch" alt="" />
                                        <span className="p-name">{p.id}</span>
                                        {p.id === playerName && <span className="p-tag">(You)</span>}
                                        {p.is_bot && <span className="p-tag">(Bot)</span>}
                                    </div>
                                    {players[0].id === p.id && <span className="host-tag">HOST</span>}
                                </li>
                            ))}
                        </ul>

                        {/* Allow player to change color while in lobby, blocking taken ones */}
                        <ColorPicker 
                            selected={myBackendColor} 
                            onSelect={(c) => sendMove && sendMove('SET_COLOR', { color: c })} 
                            used={usedColors} 
                        />

                        {isHost ? (
                            <div className="host-controls"> 
                                <button 
                                    className="add-bot-btn img-action-btn" 
                                    onClick={() => sendMove && sendMove("ADD_BOT")}
                                    disabled={players.length >= 4}
                                >
                                    <img src="/images/addbot.png" alt="Add Computer Bot" />
                                </button>

                                <button 
                                    className={`start-btn img-action-btn ${!canStart ? 'disabled' : ''}`} 
                                    onClick={() => sendMove && sendMove("START_GAME")}
                                    disabled={!canStart}
                                >
                                    <img src="/images/startgame.png" alt="Start Game" />
                                </button>
                                {!canStart && <p className="hint-text">Waiting for players...</p>}
                            </div>
                        ) : (
                            <div className="waiting-container">
                                <div className="spinner"></div>
                                <p className="waiting-msg">Waiting for Host to start...</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
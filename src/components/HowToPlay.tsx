// src/components/HowToPlay.tsx

import React from 'react';
import '../styles/HowToPlay.css';

interface HowToPlayProps {
    onClose: () => void;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({ onClose }) => {
    return (
        <div className="how-to-play-overlay" onClick={onClose}>
            <div className="how-to-play-modal" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>Close</button>
                <h2>How to Play Splenda</h2>
                
                <div className="how-to-play-content">
                    {/* Left Column: Text Rules */}
                    <div className="how-to-play-text">
                        <h3>Objective</h3>
                        <p>The game ends at the end of the round when a player reaches <strong>15 points</strong>. The player with the most points (and fewest cards in case of a tie) wins.</p>
                        
                        <h3>On Your Turn</h3>
                        <p>You must perform exactly <strong>one</strong> of the following four actions:</p>
                        <ul>
                            <li><strong>Take 3 distinct tokens:</strong> Take one token of three different colors (excluding Gold).</li>
                            <li><strong>Take 2 identical tokens:</strong> Take two tokens of the same color, but only if there are <strong>at least 4</strong> of that color remaining in the bank.</li>
                            <li><strong>Reserve 1 card:</strong> Take a card from the board or draw from a deck blindly. You also receive <strong>1 Gold token</strong> (if available). You may hold a maximum of 3 reserved cards.</li>
                            <li><strong>Buy 1 card:</strong> Purchase a card from the board or your reserved hand by spending the required tokens. Your previously purchased cards act as permanent discounts!</li>
                        </ul>

                        <h3>Tokens & Gold</h3>
                        <ul>
                            <li><strong>Token Limit:</strong> You may never have more than <strong>10 tokens</strong> at the end of your turn. If you do, you must discard the excess.</li>
                            <li><strong>Gold Tokens:</strong> They can replace ANY color token when buying a card.</li>
                        </ul>

                        <h3>Nobles</h3>
                        <ul>
                            <li>At the end of your turn, if you have accumulated enough permanent card bonuses (discounts) to match a Noble's requirements, you <strong>automatically receive that Noble.</strong></li>
                            <li>Nobles are worth 3 points. You can only gain one Noble per visit.</li>
                        </ul>
                    </div>

                    {/* Right Column: Vertical Image */}
                    <div className="how-to-play-image-container">
                        <img 
                            src="/images/tokens.png" 
                            alt="Splendor Tokens" 
                            className="how-to-play-tokens-img" 
                        />
                        <div className="how-to-play-cards-column">
                            <img 
                                src="/images/ex1.webp" 
                                alt="Example Noble" 
                                className="how-to-play-card-img game-example" 
                            />
                            <img 
                                src="/images/ex2.webp" 
                                alt="Example Card" 
                                className="how-to-play-card-img game-example" 
                            />
                        </div> 
                    </div>
                </div>
            </div>
        </div>
    );
};
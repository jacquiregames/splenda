// src/components/ThemeToggle.tsx
import React from 'react';
import '../styles/ThemeToggle.css';

interface ThemeToggleProps {
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    useGreyBg: boolean;
    onGreyToggle: () => void;
    playerColor: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeToggle, useGreyBg, onGreyToggle, playerColor }) => {
    return (
        <div className="theme-toggle-container">
            {/* Dark / Light Mode */}
            <label className="theme-switch">
                <input type="checkbox" checked={theme === 'light'} onChange={onThemeToggle} />
                <span className="slider round">
                    <span className="toggle-icon moon">🌞</span>
                    <span className="toggle-icon sun">🌛</span>
                </span>
            </label>

            {/* Color / Grey Mode */}
            <label className="theme-switch" title="Toggle grey background override">
                <input type="checkbox" checked={useGreyBg} onChange={onGreyToggle} />
                <span className="slider round color-slider">
                    {/* Icons sit at opposite ends. Knob slides to cover one of them! */}
                    <img src="/images/playercolors/grey.webp" className="toggle-icon grey-swatch-icon" alt="Grey" />
                    <img src={`/images/playercolors/${playerColor}.webp`} className="toggle-icon color-swatch-icon" alt="Color" />
                </span>
            </label>
        </div>
    );
};

export default ThemeToggle;
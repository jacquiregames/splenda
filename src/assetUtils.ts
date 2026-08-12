// src/assetUtils.ts
import { IMAGE_BASE_URL } from './constants';

// Phase 1: Assets needed for Login/Lobby and basic layout
export const getCriticalUIAssets = (): string[] => {
    const urls: string[] = [];
    
    const images = [
        // Core UI
        'background.png', 'login.png', 'logo.png', 
        'winner.png', 'yourturn.png', 'gamelog.png',
        
        // Buttons
        'joingame.png', 'startgame.png', 'splendor.png', 'splenda.png',
        'confirm.png', 'clear.png', 'crown.png',

        // Color Swatches
        'playercolors/blue.png', 'playercolors/green.png', 'playercolors/purple.png',
        'playercolors/red.png', 'playercolors/teal.png', 'playercolors/yellow.png',

        'backgrounds/dark1blue.png', 'backgrounds/dark1green.png', 'backgrounds/dark1grey.png', 'backgrounds/dark1purple.png', 
        'backgrounds/dark1red.png', 'backgrounds/dark1teal.png', 'backgrounds/dark1yellow.png', 
        'backgrounds/dark2blue.png', 'backgrounds/dark2green.png', 'backgrounds/dark2grey.png', 'backgrounds/dark2purple.png', 
        'backgrounds/dark2red.png', 'backgrounds/dark2teal.png', 'backgrounds/dark2yellow.png', 
        'backgrounds/dark3blue.png', 'backgrounds/dark3green.png', 'backgrounds/dark3grey.png', 'backgrounds/dark3purple.png', 
        'backgrounds/dark3red.png', 'backgrounds/dark3teal.png', 'backgrounds/dark3yellow.png', 
        'backgrounds/light1blue.png', 'backgrounds/light1green.png', 'backgrounds/light1grey.png', 'backgrounds/light1purple.png', 
        'backgrounds/light1red.png', 'backgrounds/light1teal.png', 'backgrounds/light1yellow.png', 
        'backgrounds/light2blue.png', 'backgrounds/light2green.png', 'backgrounds/light2grey.png', 'backgrounds/light2purple.png', 
        'backgrounds/light2red.png', 'backgrounds/light2teal.png', 'backgrounds/light2yellow.png', 
        'backgrounds/light3blue.png', 'backgrounds/light3green.png', 'backgrounds/light3grey.png', 'backgrounds/light3purple.png', 
        'backgrounds/light3red.png', 'backgrounds/light3teal.png', 'backgrounds/light3yellow.png'
    ];

    images.forEach(img => urls.push(`${IMAGE_BASE_URL}/images/${img}`));
    return urls;
};

// Phase 2: Assets needed for the specific game session
export const getSpecificGameAssets = (style: 'original' | 'new'): string[] => {
    const urls: string[] = [];
    const ext = style === 'new' ? 'png' : 'jpg';

    // 1. Tokens (Essential for gameplay)
    const tokens = ['BlueToken', 'BrownToken', 'GoldToken', 'GreenToken', 'RedToken', 'WhiteToken'];
    tokens.forEach(t => urls.push(`${IMAGE_BASE_URL}/images/${style}/tokens/${t}.${ext}`));

    // 2. Card Backs (Essential for rows 2/3 if we aren't loading their faces yet)
    [1, 2, 3].forEach(r => urls.push(`${IMAGE_BASE_URL}/images/${style}/row${r}back.${ext}`));

    // 3. Row 1 Cards ONLY (Per request: 1-40)
    // We skip Row 2 (41-70), Row 3 (71-90), and Nobles (20001+) to save bandwidth.
    const range = { start: 1, end: 40, folder: 'row1', pad: 3 };
    
    for (let i = range.start; i <= range.end; i++) {
        const filename = i.toString().padStart(range.pad, '0');
        urls.push(`${IMAGE_BASE_URL}/images/${style}/${range.folder}/${filename}.${ext}`);
    }

    return urls;
};
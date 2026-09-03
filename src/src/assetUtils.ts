// src/assetUtils.ts
import { IMAGE_BASE_URL } from './constants';

export const getCriticalUIAssets = (): string[] => {
    const urls: string[] = [];
    
    const images = [
        'backgrounds/background.webp', 'backgrounds/gamelog.webp', 
        'lobby/login.webp', 'lobby/logo.webp', 
        'yourturn/yourturn.webp', 'yourturn/yourturn_left.webp', 'yourturn/yourturn_right.webp',
        'buttons/joingame.webp', 'buttons/startgame.webp', 'buttons/addbot.webp',
        'buttons/confirm.webp', 'buttons/clear.webp', 'buttons/howtoplay.webp', 
        'gameover/crown.webp','gameover/winner.webp', 

        'playercolors/blue.webp', 'playercolors/green.webp', 'playercolors/purple.webp',
        'playercolors/red.webp', 'playercolors/teal.webp', 'playercolors/yellow.webp', 
        'playercolors/grey.webp',

        'backgrounds/dark1blue.webp', 'backgrounds/dark1green.webp', 'backgrounds/dark1grey.webp', 'backgrounds/dark1purple.webp', 
        'backgrounds/dark1red.webp', 'backgrounds/dark1teal.webp', 'backgrounds/dark1yellow.webp', 
        'backgrounds/dark2blue.webp', 'backgrounds/dark2green.webp', 'backgrounds/dark2grey.webp', 'backgrounds/dark2purple.webp', 
        'backgrounds/dark2red.webp', 'backgrounds/dark2teal.webp', 'backgrounds/dark2yellow.webp', 
        'backgrounds/dark3blue.webp', 'backgrounds/dark3green.webp', 'backgrounds/dark3grey.webp', 'backgrounds/dark3purple.webp', 
        'backgrounds/dark3red.webp', 'backgrounds/dark3teal.webp', 'backgrounds/dark3yellow.webp', 
        'backgrounds/light1blue.webp', 'backgrounds/light1green.webp', 'backgrounds/light1grey.webp', 'backgrounds/light1purple.webp', 
        'backgrounds/light1red.webp', 'backgrounds/light1teal.webp', 'backgrounds/light1yellow.webp', 
        'backgrounds/light2blue.webp', 'backgrounds/light2green.webp', 'backgrounds/light2grey.webp', 'backgrounds/light2purple.webp', 
        'backgrounds/light2red.webp', 'backgrounds/light2teal.webp', 'backgrounds/light2yellow.webp', 
        'backgrounds/light3blue.webp', 'backgrounds/light3green.webp', 'backgrounds/light3grey.webp', 'backgrounds/light3purple.webp', 
        'backgrounds/light3red.webp', 'backgrounds/light3teal.webp', 'backgrounds/light3yellow.webp'
    ];

    images.forEach(img => urls.push(`${IMAGE_BASE_URL}/images/${img}`));
    return urls;
};

export const getSpecificGameAssets = (): string[] => {
    const urls: string[] = []; 

    const tokens = ['BlueToken', 'BrownToken', 'GoldToken', 'GreenToken', 'RedToken', 'WhiteToken'];
    tokens.forEach(t => urls.push(`${IMAGE_BASE_URL}/images/tokens/${t}.webp`));

    [1, 2, 3].forEach(r => urls.push(`${IMAGE_BASE_URL}/images/row${r}back.webp`));

    const ranges = [
        { start: 1, end: 40, folder: 'row1', pad: 3 },
        { start: 41, end: 70, folder: 'row2', pad: 3 },
        { start: 71, end: 90, folder: 'row3', pad: 3 },
        { start: 20001, end: 20011, folder: 'row4', pad: 5 } // Nobles
    ];
    
    ranges.forEach(range => {
        for (let i = range.start; i <= range.end; i++) {
            const filename = i.toString().padStart(range.pad, '0');
            urls.push(`${IMAGE_BASE_URL}/images/${range.folder}/${filename}.webp`);
        }
    });

    return urls;
};

// FIX: Lifted preload logic out of the component file to support Fast Refresh HMR
export const preloadImages = async (urls: string[]): Promise<void> => {
    const promises = urls.map((url) => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = () => {
                console.warn(`Failed to load: ${url}`);
                resolve(); // Resolve anyway to prevent hanging
            };
        });
    });
    await Promise.all(promises);
};
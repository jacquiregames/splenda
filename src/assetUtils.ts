// src/assetUtils.ts
import { IMAGE_BASE_URL } from './constants';

export const getCriticalUIAssets = (): string[] => {
    const urls: string[] = [];
    
    const images = [
        'images/backgrounds/background.webp', 'images/backgrounds/gamelog.webp', 
        'images/lobby/login.webp', 'images/lobby/logo.webp', 
        'images/yourturn/yourturn.webp', 'images/yourturn/yourturn_left.webp', 'images/yourturn/yourturn_right.webp',
        'images/buttons/joingame.webp', 'images/buttons/startgame.webp', 'images/buttons/addbot.webp',
        'images/buttons/confirm.webp', 'images/buttons/clear.webp', 'images/buttons/howtoplay.webp', 
        'images/gameover/crown.webp','images/gameover/winner.webp', 

        'images/playercolors/blue.webp', 'images/playercolors/green.webp', 'images/playercolors/purple.webp',
        'images/playercolors/red.webp', 'images/playercolors/teal.webp', 'images/playercolors/yellow.webp', 
        'images/playercolors/grey.webp',

        'images/backgrounds/dark1blue.webp', 'images/backgrounds/dark1green.webp', 'images/backgrounds/dark1grey.webp', 'images/backgrounds/dark1purple.webp', 
        'images/backgrounds/dark1red.webp', 'images/backgrounds/dark1teal.webp', 'images/backgrounds/dark1yellow.webp', 
        'images/backgrounds/dark2blue.webp', 'images/backgrounds/dark2green.webp', 'images/backgrounds/dark2grey.webp', 'images/backgrounds/dark2purple.webp', 
        'images/backgrounds/dark2red.webp', 'images/backgrounds/dark2teal.webp', 'images/backgrounds/dark2yellow.webp', 
        'images/backgrounds/dark3blue.webp', 'images/backgrounds/dark3green.webp', 'images/backgrounds/dark3grey.webp', 'images/backgrounds/dark3purple.webp', 
        'images/backgrounds/dark3red.webp', 'images/backgrounds/dark3teal.webp', 'images/backgrounds/dark3yellow.webp', 
        'images/backgrounds/light1blue.webp', 'images/backgrounds/light1green.webp', 'images/backgrounds/light1grey.webp', 'images/backgrounds/light1purple.webp', 
        'images/backgrounds/light1red.webp', 'images/backgrounds/light1teal.webp', 'images/backgrounds/light1yellow.webp', 
        'images/backgrounds/light2blue.webp', 'images/backgrounds/light2green.webp', 'images/backgrounds/light2grey.webp', 'images/backgrounds/light2purple.webp', 
        'images/backgrounds/light2red.webp', 'images/backgrounds/light2teal.webp', 'images/backgrounds/light2yellow.webp', 
        'images/backgrounds/light3blue.webp', 'images/backgrounds/light3green.webp', 'images/backgrounds/light3grey.webp', 'images/backgrounds/light3purple.webp', 
        'images/backgrounds/light3red.webp', 'images/backgrounds/light3teal.webp', 'images/backgrounds/light3yellow.webp'
    ];

    images.forEach(img => urls.push(`${IMAGE_BASE_URL}/${img}`));
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

    // Load score images (0 to 22)
    for (let i = 0; i <= 22; i++) {
        urls.push(`${IMAGE_BASE_URL}/images/score/${i}.webp`);
    }

    // Load token count images (1 to 10)
    for (let i = 0; i <= 10; i++) {
        urls.push(`${IMAGE_BASE_URL}/images/count/${i}.webp`);
    }

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
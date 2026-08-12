// src/types.ts

export interface CardData {
    gemColor: string | null;
    playerPoints: number;
    costWhite: number;
    costBlue: number;
    costGreen: number;
    costRed: number;
    costBrown: number;
    cardRow: number;
    FileName: string;
}

export interface Player {
    id: string;
    is_bot?: boolean;
    color: string; 
    points: number;
    tokens: Record<string, number>;
    cards: Record<string, number>; 
    purchased_cards: CardData[];   
    nobles: CardData[]; 
    pending_nobles?: number[];
    reserved?: CardData[];
}

export interface GameState {
    board: {
        level1: CardData[];
        level2: CardData[];
        level3: CardData[];
        nobles: CardData[];
        tokens: Record<string, number>;
    };
    players: Player[];
    current_turn: string;
    status: string;
    winner: string | null;
    pending_nobles?: number[];
    last_round?: boolean;
    deck_style: 'original' | 'new';  
    round_number: number;
    last_move?: {
        type: string;
        player_id: string;
        tokens?: string[];
        card_filename?: string;
        got_gold?: boolean;
    };
    deck_counts: Record<number, number>; // <--- NEW
}
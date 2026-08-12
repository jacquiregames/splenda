# backend/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union

class Card(BaseModel):
    gemColor: Optional[str] = None
    playerPoints: int
    costWhite: int
    costBlue: int
    costGreen: int
    costRed: int
    costBrown: int
    cardRow: int
    FileName: str

class Player(BaseModel):
    id: str
    is_bot: bool = False
    color: str = "blue"  # <--- NEW
    points: int = 0
    tokens: Dict[str, int] = Field(default_factory=lambda: {"white": 0, "blue": 0, "green": 0, "red": 0, "brown": 0, "gold": 0})
    cards: Dict[str, int] = Field(default_factory=lambda: {"white": 0, "blue": 0, "green": 0, "red": 0, "brown": 0})
    purchased_cards: List[Card] = Field(default_factory=list)
    nobles: List[Card] = Field(default_factory=list)
    reserved: List[Card] = Field(default_factory=list)

class BoardState(BaseModel):
    nobles: List[Card] = Field(default_factory=list)
    level1: List[Optional[Card]] = Field(default_factory=list)
    level2: List[Optional[Card]] = Field(default_factory=list)
    level3: List[Optional[Card]] = Field(default_factory=list)
    tokens: Dict[str, int] = Field(default_factory=lambda: {"white": 7, "blue": 7, "green": 7, "red": 7, "brown": 7, "gold": 5})

class GameStateModel(BaseModel):
    players: List[Player]
    board: BoardState
    current_turn: Optional[str]
    status: str
    winner: Optional[str]
    pending_nobles: List[int]
    last_round: bool
    deck_style: str
    round_number: int
    last_move: Optional[dict]
    deck_counts: Dict[int, int]

class MovePayload(BaseModel):
    action: str
    row: Optional[int] = Field(None, ge=1, le=3) 
    cardIndex: Optional[Union[int, str]] = None  
    tokens: Optional[List[str]] = None
    nobleIndex: Optional[int] = None
    deckStyle: Optional[str] = None
    color: Optional[str] = None  # <--- NEW
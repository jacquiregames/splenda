# backend/game.py
import random
from typing import Dict, List, Optional
from data import ALL_CARDS, ALL_NOBLES
from models import Player, BoardState, Card, GameStateModel, MovePayload

class SplendorGame:
    def __init__(self):
        self.players: List[Player] = []
        self.board = BoardState()
        self.decks: Dict[int, List[Card]] = {1: [], 2: [], 3: []}
        self.turn_index = 0
        self.round_number = 1   
        self.deck_style = "original"  
        self.game_started = False
        self.last_round_triggered = False
        self.winner: Optional[str] = None
        self.last_move: Optional[dict] = None
        self.sub_state: Optional[str] = None
        self.pending_nobles: List[int] = []
        
        self.colors = ["white", "blue", "green", "red", "brown"]
        self.cost_map = {
            "white": "costWhite", "blue": "costBlue", "green": "costGreen", 
            "red": "costRed", "brown": "costBrown"
        }

    def add_player(self, player_id: str, requested_color: str = "blue"):
        if self.game_started or len(self.players) >= 4: return False
        for p in self.players:
            if p.id == player_id: return True
            
        # Determine available colors to prevent collisions
        used_colors = {p.color for p in self.players}
        available = [c for c in ["blue", "green", "purple", "red", "teal", "yellow"] if c not in used_colors]
        
        # Give them their requested color if available, otherwise auto-assign
        final_color = requested_color if requested_color in available else (available[0] if available else "blue")
        
        self.players.append(Player(id=player_id, color=final_color))
        return True

    def start_game(self, deck_style="original"): 
        if len(self.players) < 2: return 
        
        self.deck_style = deck_style
        
        # 1. Randomize Player Order
        random.shuffle(self.players)
        
        # 2. Setup Decks
        for level in [1, 2, 3]:
            deck = [Card(**c) for c in ALL_CARDS[level].copy()]
            random.shuffle(deck)
            self.decks[level] = deck
            level_list = [self.decks[level].pop() for _ in range(4)]
            setattr(self.board, f"level{level}", level_list)
            
        nobles = [Card(**n) for n in ALL_NOBLES.copy()]
        random.shuffle(nobles)
        self.board.nobles = nobles[:len(self.players) + 1]
        
        count = 4 if len(self.players) == 2 else 5 if len(self.players) == 3 else 7
        for c in self.colors: self.board.tokens[c] = count
        self.board.tokens["gold"] = 5
        
        self.turn_index = 0 
        self.round_number = 1
        self.game_started = True

    def get_state(self, requestor_id=None):
        status = "lobby"
        if self.winner:
            status = "finished"
        elif self.game_started:
            status = self.sub_state if self.sub_state else "active"

        deck_counts = {
            1: len(self.decks[1]),
            2: len(self.decks[2]),
            3: len(self.decks[3])
        }

        # Build the entire state cleanly via Pydantic model
        state = GameStateModel(
            players=self.players,
            board=self.board,
            current_turn=self.players[self.turn_index].id if self.players else None,
            status=status,
            winner=self.winner,
            pending_nobles=self.pending_nobles,
            last_round=self.last_round_triggered,
            deck_style=self.deck_style,
            round_number=self.round_number,
            last_move=self.last_move,
            deck_counts=deck_counts
        )
        
        # Output as a dictionary to mask opponent cards
        dump = state.model_dump()
        
        # SECURE: Mask opponents' reserved cards
        for p in dump["players"]:
            if p["id"] != requestor_id:
                for i, c in enumerate(p["reserved"]):
                    p["reserved"][i] = {
                        "cardRow": c["cardRow"],
                        "FileName": f"images/row{c['cardRow']}back.jpg"
                    }
        
        return dump

    def process_move(self, player_id: str, payload: MovePayload):
        action = payload.action

        if action == "RESET_GAME":
            if self.winner or (self.players and self.players[0].id == player_id):
                self.reset_game(requestor_id=player_id)
                return True
            return False

        if action == "ADD_BOT":
            bot_count = sum(1 for p in self.players if p.is_bot)
            if len(self.players) < 4 and not self.game_started:
                # --- NEW: Auto-assign bots an unused color ---
                used_colors = {p.color for p in self.players}
                available = [c for c in ["blue", "green", "purple", "red", "teal", "yellow"] if c not in used_colors]
                color = available[0] if available else "blue"
                
                self.players.append(Player(id=f"Bot {bot_count + 1}", is_bot=True, color=color))
                return True
            return False
 
        if action == "SET_COLOR" and not self.game_started:
            new_color = payload.color
            if new_color and new_color not in {p.color for p in self.players if p.id != player_id}:
                current_player = next((p for p in self.players if p.id == player_id), None)
                if current_player:
                    current_player.color = new_color
                    return True
            return False

        if not self.players or self.winner: return False
        
        current_player = self.players[self.turn_index]
        if player_id != current_player.id: return False
        
        if self.sub_state == "discarding":
            if action == "DISCARD_TOKENS": return self._handle_discard(current_player, payload)
            return False
        
        if self.sub_state == "selecting_noble":
            if action == "SELECT_NOBLE": return self._handle_select_noble(current_player, payload)
            return False

        success = False
        if action == "START_GAME":
            if player_id == self.players[0].id:
                style = payload.deckStyle or "original"
                self.start_game(style)
                return True
        elif action == "SKIP": success = True
        elif action == "TAKE_TOKENS": success = self._handle_take_tokens(current_player, payload)
        elif action == "BUY": success = self._handle_buy_board(current_player, payload)
        elif action == "RESERVE": success = self._handle_reserve(current_player, payload)
        elif action == "BUY_RESERVED": success = self._handle_buy_reserved(current_player, payload)

        if success:
            if action in ["BUY", "BUY_RESERVED"]:
                self._check_nobles(current_player)
            
            if self.sub_state == "selecting_noble": return True

            if sum(current_player.tokens.values()) > 10:
                self.sub_state = "discarding"
                return True 

            self._rotate_turn(current_player)
            return True
            
        return False

    # --- HELPERS ---
    def _rotate_turn(self, current_player: Player):
        if current_player.points >= 15: self.last_round_triggered = True
        
        next_turn_index = (self.turn_index + 1) % len(self.players)
        
        if next_turn_index == 0:
            if self.last_round_triggered:
                self._resolve_game()
                return 
            else:
                self.round_number += 1

        self.turn_index = next_turn_index
        self.sub_state = None

    def _resolve_game(self):
        candidates = []
        for p in self.players:
            total_cards = sum(p.cards.values())
            candidates.append({"id": p.id, "points": p.points, "cards": total_cards})
        candidates.sort(key=lambda x: (-x["points"], x["cards"]))
        self.winner = candidates[0]["id"]
        self.game_started = False

    def _check_nobles(self, player: Player):
        eligible_indices = []
        for i, noble in enumerate(self.board.nobles):
            eligible = True
            for color in self.colors:
                required = getattr(noble, self.cost_map[color], 0)
                if player.cards[color] < required:
                    eligible = False
                    break
            if eligible: eligible_indices.append(i)
        
        if not eligible_indices: return False
        
        if len(eligible_indices) == 1:
            idx = eligible_indices[0]
            visited = self.board.nobles.pop(idx)
            player.nobles.append(visited)
            player.points += 3
            return True
        else:
            self.pending_nobles = eligible_indices
            self.sub_state = "selecting_noble"
            return True

    def _handle_select_noble(self, player: Player, payload: MovePayload):
        idx = payload.nobleIndex
        if idx is None or idx not in self.pending_nobles: return False
        
        visited = self.board.nobles.pop(idx)
        player.nobles.append(visited)
        player.points += 3
        
        self.pending_nobles = []
        self.sub_state = None
        
        if sum(player.tokens.values()) > 10: self.sub_state = "discarding"
        else: self._rotate_turn(player)
        return True

    def _handle_take_tokens(self, player: Player, payload: MovePayload):
        selected = payload.tokens or []
        if not selected or "gold" in selected: return False
        selected.sort()
        
        if len(selected) == 2 and selected[0] == selected[1]:
            if self.board.tokens[selected[0]] < 4: return False
        else:
            if len(selected) > 3: return False
            if len(set(selected)) != len(selected): return False

            for c in selected:
                if self.board.tokens[c] < 1: return False

            available_colors = sum(1 for c in self.colors if self.board.tokens[c] > 0)
            required_amount = min(3, available_colors)
            if len(selected) != required_amount:
                return False
        
        for c in selected:
            self.board.tokens[c] -= 1
            player.tokens[c] += 1
        self.last_move = {"type": "TAKE_TOKENS", "player_id": player.id, "tokens": selected}
        return True

    def _handle_discard(self, player: Player, payload: MovePayload):
        to_discard = payload.tokens or []
        temp_tokens = player.tokens.copy()
        for c in to_discard:
            if temp_tokens.get(c, 0) <= 0: return False
            temp_tokens[c] -= 1
        if sum(temp_tokens.values()) != 10: return False
        
        for c in to_discard:
            player.tokens[c] -= 1
            self.board.tokens[c] += 1
            
        self.last_move = {"type": "DISCARD_TOKENS", "player_id": player.id, "tokens": to_discard}
        
        self.sub_state = None
        self._rotate_turn(player)
        return True

    def _handle_reserve(self, player: Player, payload: MovePayload):
        if len(player.reserved) >= 3: return False
        row = payload.row
        idx = payload.cardIndex
        if row not in [1, 2, 3]: return False
        
        level_list = getattr(self.board, f"level{row}")
        
        if idx == "deck":
            if not self.decks[row]: return False
            card = self.decks[row].pop()
        else:
            if not isinstance(idx, int) or idx >= len(level_list): return False
            card = level_list[idx]
            if card is None: return False         
            
            new_card = self.decks[row].pop() if self.decks[row] else None
            level_list[idx] = new_card
            
        player.reserved.append(card)  
        
        got_gold = False 
        if self.board.tokens["gold"] > 0:
            self.board.tokens["gold"] -= 1
            player.tokens["gold"] += 1
            got_gold = True
 
        self.last_move = {"type": "RESERVE", "player_id": player.id, "got_gold": got_gold, "row": row}
                        
        if sum(player.tokens.values()) > 10:
            self.sub_state = "discarding"
            return True 
            
        return True

    def _handle_buy_board(self, player: Player, payload: MovePayload):
        row = payload.row
        idx = payload.cardIndex
        if row not in [1, 2, 3]: return False
        
        level_list = getattr(self.board, f"level{row}")
        if not isinstance(idx, int) or idx >= len(level_list): return False
        
        card = level_list[idx]
        if card is None: return False
        
        payment = self._calculate_payment(player, card)
        if payment is None: return False
        
        self._execute_payment(player, payment)
        self._add_card_to_player(player, card)
        
        new_card = self.decks[row].pop() if self.decks[row] else None
        level_list[idx] = new_card
        
        self.last_move = {"type": "BUY", "player_id": player.id, "card_filename": card.FileName}
        return True

    def _handle_buy_reserved(self, player: Player, payload: MovePayload):
        idx = payload.cardIndex
        if not isinstance(idx, int) or idx >= len(player.reserved): return False
        
        card = player.reserved[idx]
        payment = self._calculate_payment(player, card)
        if payment is None: return False
        
        self._execute_payment(player, payment)
        self._add_card_to_player(player, card)
        player.reserved.pop(idx)
        
        self.last_move = {"type": "BUY", "player_id": player.id, "card_filename": card.FileName}
        return True

    def _calculate_payment(self, player: Player, card: Card):
        to_pay = {}
        gold_needed = 0
        for color in self.colors:
            cost = getattr(card, self.cost_map[color])
            bonus = player.cards[color]
            actual_cost = max(0, cost - bonus)
            player_has = player.tokens[color]
            if player_has >= actual_cost:
                if actual_cost > 0: to_pay[color] = actual_cost
            else:
                if player_has > 0: to_pay[color] = player_has
                gold_needed += (actual_cost - player_has)
                
        if player.tokens["gold"] < gold_needed: return None
        if gold_needed > 0: to_pay["gold"] = gold_needed
        return to_pay

    def _execute_payment(self, player: Player, payment: dict):
        for color, amount in payment.items():
            player.tokens[color] -= amount
            self.board.tokens[color] += amount

    def _add_card_to_player(self, player: Player, card: Card):
        gem = card.gemColor.lower() if card.gemColor else None
        if gem and gem in player.cards: 
            player.cards[gem] += 1
        player.purchased_cards.append(card)
        player.points += card.playerPoints
        
    def reset_game(self, requestor_id: str = None):
        self.board = BoardState()
        self.decks = {1: [], 2: [], 3: []}
        self.turn_index = 0        
        self.round_number = 1
        self.deck_style = "original"
        self.game_started = False
        self.last_round_triggered = False
        self.winner = None
        self.last_move = None
        self.sub_state = None
        self.pending_nobles = []

        if requestor_id:
            # 1. Remove all bots so it's a clean lobby
            self.players = [p for p in self.players if not p.is_bot]
            
            # 2. Reassign host privileges by moving the requestor to the front of the list
            requestor = next((p for p in self.players if p.id == requestor_id), None)
            if requestor:
                self.players.remove(requestor)
                self.players.insert(0, requestor)

        for p in self.players:
            p.tokens = {"white": 0, "blue": 0, "green": 0, "red": 0, "brown": 0, "gold": 0}
            p.cards = {"white": 0, "blue": 0, "green": 0, "red": 0, "brown": 0}
            p.purchased_cards = []
            p.nobles = []
            p.points = 0
            p.reserved = []
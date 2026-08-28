# backend/bot.py
import random
from models import MovePayload, Player, Card
from game import SplendorGame


def calculate_missing_tokens(card, player: Player, game: SplendorGame):
    missing = {}
    for color in game.colors:
        cost = getattr(card, game.cost_map[color])
        bonus = player.cards[color]
        actual_cost = max(0, cost - bonus)
        has = player.tokens[color]
        if has < actual_cost:
            missing[color] = actual_cost - has
    return missing


def _get_game_phase(game: SplendorGame) -> str:
    """Determine the current phase of the game based on the highest score."""
    max_points = max([p.points for p in game.players] + [0])
    if max_points >= 11:
        return "late"
    elif max_points >= 6:
        return "mid"
    return "early"


def _card_value(card: Card, player: Player, game: SplendorGame) -> float:
    """Calculate the strategic value of a card based on the current game phase."""
    phase = _get_game_phase(game)
    
    # Weights shift as the game progresses
    if phase == "early":
        point_multiplier = 2.0
        engine_multiplier = 1.5
    elif phase == "mid":
        point_multiplier = 4.0
        engine_multiplier = 1.0
    else: # late
        point_multiplier = 10.0 # Points are everything at the end
        engine_multiplier = 0.1

    score = card.playerPoints * point_multiplier
    
    # Cost efficiency bonus
    total_cost = sum(getattr(card, game.cost_map[c]) for c in game.colors)
    if total_cost > 0:
        score += (card.playerPoints / total_cost) * 2.0

    gem = (card.gemColor or "").lower()
    if gem in game.colors:
        # Engine value: how much do the cards currently visible on the board demand this color?
        demand = sum(
            getattr(c, game.cost_map[gem])
            for row in [1, 2, 3]
            for c in getattr(game.board, f"level{row}")
            if c
        )
        score += demand * engine_multiplier * 0.2

        # Noble pursuit
        for noble in game.board.nobles:
            required = getattr(noble, game.cost_map[gem], 0)
            if required <= 0 or player.cards.get(gem, 0) >= required:
                continue
            remaining_total = sum(
                max(0, getattr(noble, game.cost_map[c]) - player.cards.get(c, 0))
                for c in game.colors
            )
            urgency = max(0, 8 - remaining_total)  # closer to finishing = bigger bonus
            score += (1.5 + urgency * 0.5) * engine_multiplier

    return score


def _find_denial_target(game: SplendorGame, bot: Player):
    """Find a board card an opponent is close to affording so we can deny it."""
    opponents = [p for p in game.players if p.id != bot.id]
    if not opponents:
        return None

    best = None
    best_danger = -1
    for row in [3, 2, 1]:
        for i, card in enumerate(getattr(game.board, f"level{row}")):
            if not card:
                continue
            for opp in opponents:
                missing = sum(calculate_missing_tokens(card, opp, game).values())
                gold_available = opp.tokens.get("gold", 0)
                
                # Check if they are 1 or 0 tokens away AFTER using their gold
                if (missing - gold_available) <= 1:
                    immediate_threat = 5 if (missing - gold_available) <= 0 else 0
                    
                    # Late game panic: if they can win by buying this, deny it at all costs
                    win_threat = 200 if (opp.points + card.playerPoints >= 15) else 0
                    
                    danger = _card_value(card, opp, game) + immediate_threat + win_threat
                    
                    if danger > best_danger and danger > 10: # Only deny things actually worth denying
                        best_danger = danger
                        best = (row, i, card)
    return best


def _calculate_color_needs(bot: Player, game: SplendorGame) -> dict:
    """Figure out exactly which tokens the bot needs for cards on the board and in its hand."""
    color_needs = {c: 0.0 for c in game.colors}

    def _accumulate_needs(card):
        missing = calculate_missing_tokens(card, bot, game)
        missing_amount = sum(missing.values())
        if 0 < missing_amount <= 5: # Look ahead to cards we are somewhat close to buying
            weight = _card_value(card, bot, game) / max(1, missing_amount)
            for color, amt in missing.items():
                if color != "gold":
                    color_needs[color] += amt * weight

    for row in [3, 2, 1]:
        for card in getattr(game.board, f"level{row}"):
            if card: _accumulate_needs(card)
    for card in bot.reserved:
        _accumulate_needs(card)
        
    return color_needs


def get_bot_move(game: SplendorGame, bot: Player) -> MovePayload:
    color_needs = _calculate_color_needs(bot, game)

    # 1. Handle Game Sub-States (Mandatory actions)
    if game.sub_state == "discarding":
        excess = sum(bot.tokens.values()) - 10
        discarded = []
        temp_tokens = bot.tokens.copy()
        
        for _ in range(excess):
            # Smart discard: throw away the colors we need the LEAST based on current board state
            colors_we_have = [c for c in temp_tokens.keys() if temp_tokens[c] > 0 and c != "gold"]
            if not colors_we_have: 
                colors_we_have = ["gold"]
            
            c = min(colors_we_have, key=lambda x: color_needs.get(x, 0))
            discarded.append(c)
            temp_tokens[c] -= 1
            
        return MovePayload(action="DISCARD_TOKENS", tokens=discarded)

    if game.sub_state == "selecting_noble":
        best_idx = max(
            game.pending_nobles,
            key=lambda idx: sum(getattr(game.board.nobles[idx], game.cost_map[c]) for c in game.colors)
        )
        return MovePayload(action="SELECT_NOBLE", nobleIndex=best_idx)

    def can_afford(card):
        return game._calculate_payment(bot, card) is not None

    # 2. Try to buy a reserved card
    buyable_reserved = [(i, c) for i, c in enumerate(bot.reserved) if can_afford(c)]
    if buyable_reserved:
        best_idx, _ = max(buyable_reserved, key=lambda x: _card_value(x[1], bot, game))
        return MovePayload(action="BUY_RESERVED", cardIndex=best_idx)

    # 3. Try to buy a card from the board
    buyable_board = []
    for row in [3, 2, 1]:
        for i, card in enumerate(getattr(game.board, f"level{row}")):
            if card and can_afford(card):
                buyable_board.append((row, i, card))

    denial_target = _find_denial_target(game, bot)

    if buyable_board:
        def score(item):
            row, i, card = item
            val = _card_value(card, bot, game)
            if denial_target and denial_target[0] == row and denial_target[1] == i:
                val += 500  # buy it before they can steal it
            return val

        best = max(buyable_board, key=score)
        return MovePayload(action="BUY", row=best[0], cardIndex=best[1])

    # 4. Take Tokens
    available_colors = [c for c in game.colors if game.board.tokens[c] > 0]
    available_colors.sort(key=lambda c: (color_needs.get(c, 0), random.random()), reverse=True)

    # Double up if we need it
    if sum(bot.tokens.values()) < 8:
        for c in available_colors:
            if color_needs.get(c, 0) > 0 and game.board.tokens[c] >= 4:
                return MovePayload(action="TAKE_TOKENS", tokens=[c, c])

    required_amount = min(3, len(available_colors))
    if required_amount > 0 and sum(bot.tokens.values()) + required_amount <= 10:
        needed_colors = [c for c in available_colors if color_needs.get(c, 0) > 0.1]
        
        # Only take 3 if we actually want them, or if we are just fetching the top available ones
        if len(needed_colors) >= 3:
            return MovePayload(action="TAKE_TOKENS", tokens=needed_colors[:3])
        elif len(available_colors) >= 3:
            return MovePayload(action="TAKE_TOKENS", tokens=available_colors[:3])
        else:
            return MovePayload(action="TAKE_TOKENS", tokens=available_colors[:required_amount])

    # 5. Fallback: Reserve strategically
    if len(bot.reserved) < 3:
        if denial_target:
            row, idx, _ = denial_target
            return MovePayload(action="RESERVE", row=row, cardIndex=idx)

        reservable = []
        for row in [3, 2, 1]:
            for i, card in enumerate(getattr(game.board, f"level{row}")):
                if card: reservable.append((row, i, card))

        if reservable:
            # Add a slight randomized noise so multiple bots don't exactly mimic each other
            best = max(reservable, key=lambda x: _card_value(x[2], bot, game) + random.uniform(0, 2))
            return MovePayload(action="RESERVE", row=best[0], cardIndex=best[1])

        row = random.choice([1, 2, 3])
        if game.decks[row]:
            return MovePayload(action="RESERVE", row=row, cardIndex="deck")

    # 6. Absolute Fallback: Take tokens anyway (will force a discard next loop)
    if required_amount > 0:
        return MovePayload(action="TAKE_TOKENS", tokens=available_colors[:required_amount])

    # 7. Complete stalemate safety
    return MovePayload(action="SKIP")
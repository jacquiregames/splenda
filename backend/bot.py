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


def _card_value(card: Card, player: Player, game: SplendorGame) -> float:
    """How valuable is owning this card to `player`? Points matter most, but
    a permanent color bonus compounds -- it discounts every future purchase
    in that color for the rest of the game. A cheap card that unlocks a
    heavily-demanded color is often worth more than its point total alone,
    which is the core engine-building insight the old greedy bot missed
    entirely. Nobles get a separate bonus for whichever one the player is
    closest to completing."""
    score = card.playerPoints * 4 + card.cardRow * 0.3

    gem = (card.gemColor or "").lower()
    if gem in game.colors:
        # Engine value: how much do the cards currently visible on the board
        # collectively demand this color? A high-demand color bonus pays for
        # itself over and over across the rest of the game.
        demand = sum(
            getattr(c, game.cost_map[gem])
            for row in [1, 2, 3]
            for c in getattr(game.board, f"level{row}")
            if c
        )
        score += demand * 0.2

        for noble in game.board.nobles:
            required = getattr(noble, game.cost_map[gem], 0)
            if required <= 0 or player.cards.get(gem, 0) >= required:
                continue
            remaining_total = sum(
                max(0, getattr(noble, game.cost_map[c]) - player.cards.get(c, 0))
                for c in game.colors
            )
            urgency = max(0, 8 - remaining_total)  # closer to finishing = bigger bonus
            score += 1.5 + urgency * 0.5

    return score


def _find_denial_target(game: SplendorGame, bot: Player):
    """Find a board card an opponent is one token away from (or already able
    to) afford, so the bot can snatch or reserve it out from under them.
    This is what makes the bot actually react to what you're doing instead
    of playing in a vacuum."""
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
                if missing <= 1:
                    danger = _card_value(card, opp, game) + (3 if missing == 0 else 0)
                    if danger > best_danger:
                        best_danger = danger
                        best = (row, i, card)
    return best


def get_bot_move(game: SplendorGame, bot: Player) -> MovePayload:
    # 1. Handle Game Sub-States (Mandatory actions)
    if game.sub_state == "discarding":
        excess = sum(bot.tokens.values()) - 10
        discarded = []
        temp_tokens = bot.tokens.copy()
        for _ in range(excess):
            # Prefer discarding tokens we have the most of, save gold for last
            colors = [c for c in temp_tokens.keys() if temp_tokens[c] > 0 and c != "gold"]
            if not colors: colors = ["gold"]
            c = max(colors, key=lambda x: temp_tokens[x])
            discarded.append(c)
            temp_tokens[c] -= 1
        return MovePayload(action="DISCARD_TOKENS", tokens=discarded)

    if game.sub_state == "selecting_noble":
        # All pending nobles are already earned -- just prefer the one with
        # the steepest requirements as a (mostly cosmetic) tiebreak.
        best_idx = max(
            game.pending_nobles,
            key=lambda idx: sum(getattr(game.board.nobles[idx], game.cost_map[c]) for c in game.colors)
        )
        return MovePayload(action="SELECT_NOBLE", nobleIndex=best_idx)

    def can_afford(card):
        return game._calculate_payment(bot, card) is not None

    # 2. Try to buy a reserved card -- ranked by real value, not just raw points
    buyable_reserved = [(i, c) for i, c in enumerate(bot.reserved) if can_afford(c)]
    if buyable_reserved:
        best_idx, _ = max(buyable_reserved, key=lambda x: _card_value(x[1], bot, game))
        return MovePayload(action="BUY_RESERVED", cardIndex=best_idx)

    # 3. Try to buy a card from the board -- same value ranking, with a big
    #    bonus for grabbing something an opponent is about to take
    buyable_board = []
    for row in [3, 2, 1]:
        for i, card in enumerate(getattr(game.board, f"level{row}")):
            if card and can_afford(card):
                buyable_board.append((row, i, card))

    if buyable_board:
        denial_target = _find_denial_target(game, bot)

        def score(item):
            row, i, card = item
            val = _card_value(card, bot, game)
            if denial_target and denial_target[0] == row and denial_target[1] == i:
                val += 100  # steal it before they can
            return val

        best = max(buyable_board, key=score)
        return MovePayload(action="BUY", row=best[0], cardIndex=best[1])

    # 4. Figure out what tokens we need most, weighted by how valuable the
    #    card is and how close we already are to affording it -- not just a
    #    flat "1 point per missing token" like before
    color_needs = {c: 0.0 for c in game.colors}

    def _accumulate_needs(card):
        missing = calculate_missing_tokens(card, bot, game)
        missing_amount = sum(missing.values())
        if 0 < missing_amount <= 4:
            weight = _card_value(card, bot, game) / max(1, missing_amount)
            for color, amt in missing.items():
                if color != "gold":
                    color_needs[color] += amt * weight

    for row in [3, 2, 1]:
        for card in getattr(game.board, f"level{row}"):
            if card: _accumulate_needs(card)
    for card in bot.reserved:
        _accumulate_needs(card)

    available_colors = [c for c in game.colors if game.board.tokens[c] > 0]
    available_colors.sort(key=lambda c: (color_needs.get(c, 0), random.random()), reverse=True)

    # 5. Take Tokens (if we have space) -- double up on our single most-needed
    #    color when it meaningfully advances our engine
    if sum(bot.tokens.values()) < 8:
        for c in available_colors:
            if color_needs.get(c, 0) > 0 and game.board.tokens[c] >= 4:
                return MovePayload(action="TAKE_TOKENS", tokens=[c, c])

    required_amount = min(3, len(available_colors))
    # Prefer taking tokens only if it won't force us to discard
    if required_amount > 0 and sum(bot.tokens.values()) + required_amount <= 10:
        return MovePayload(action="TAKE_TOKENS", tokens=available_colors[:required_amount])

    # 6. Fallback: Reserve strategically -- deny the opponent's biggest
    #    threat if one exists, otherwise grab the most valuable reservable
    #    card instead of picking at random
    if len(bot.reserved) < 3:
        denial_target = _find_denial_target(game, bot)
        if denial_target:
            row, idx, _ = denial_target
            return MovePayload(action="RESERVE", row=row, cardIndex=idx)

        reservable = []
        for row in [3, 2, 1]:
            for i, card in enumerate(getattr(game.board, f"level{row}")):
                if card: reservable.append((row, i, card))

        if reservable:
            best = max(reservable, key=lambda x: _card_value(x[2], bot, game))
            return MovePayload(action="RESERVE", row=best[0], cardIndex=best[1])

        row = random.choice([1, 2, 3])
        if game.decks[row]:
            return MovePayload(action="RESERVE", row=row, cardIndex="deck")

    # 7. Absolute Fallback: Take tokens anyway (will force a discard next loop)
    if required_amount > 0:
        return MovePayload(action="TAKE_TOKENS", tokens=available_colors[:required_amount])

    # 8. Complete stalemate safety
    return MovePayload(action="SKIP")

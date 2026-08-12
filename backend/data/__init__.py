# backend/data/__init__.py

from .row1 import row1
from .row2 import row2
from .row3 import row3
from .nobles import row4 as nobles

# Helper to normalize image paths for the frontend
def fix_path(cards):
    for card in cards:
        # Ensure path starts with /static/ for FastAPI serving
        if not card["FileName"].startswith("images"):
             card["FileName"] = f"images/row{card.get('cardRow', '4')}/{card['FileName']}"
    return cards

ALL_CARDS = {
    1: fix_path(row1),
    2: fix_path(row2),
    3: fix_path(row3)
}
ALL_NOBLES = fix_path(nobles)
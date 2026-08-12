# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import ValidationError
import json
import logging
import asyncio
import os

from bot import get_bot_move
from game import SplendorGame
from models import MovePayload

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dynamically locate the "public" folder regardless of where the script is run from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "public")
app.mount("/static", StaticFiles(directory=PUBLIC_DIR), name="static")

game = SplendorGame()

background_tasks = set()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[websocket] = client_id

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    async def broadcast_game_state(self, game: SplendorGame):
        outgoing_messages = []
        for connection, client_id in list(self.active_connections.items()):
            state = game.get_state(requestor_id=client_id)
            outgoing_messages.append((connection, json.dumps(state)))
            
        for connection, message in outgoing_messages:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def handle_bot_turns(game: SplendorGame, manager: ConnectionManager):
    """Recursively process bot turns in the background until a human's turn is reached."""
    try:
        while game.game_started and not game.winner:
            current_player = game.players[game.turn_index]
            
            if current_player.is_bot:
                await asyncio.sleep(1.5)
                
                if not game.game_started or game.players[game.turn_index].id != current_player.id:
                    break
                    
                bot_move = get_bot_move(game, current_player)
                success = game.process_move(current_player.id, bot_move)
                
                if not success:
                    logging.error(f"Bot {current_player.id} attempted invalid move: {bot_move.model_dump()}. Forcing SKIP.")
                    game.process_move(current_player.id, MovePayload(action="SKIP"))
                    
                await manager.broadcast_game_state(game)
            else:
                break
    except Exception as e:
        logging.error(f"Bot brain crashed: {e}", exc_info=True)
        try:
            game.process_move(game.players[game.turn_index].id, MovePayload(action="SKIP"))
            await manager.broadcast_game_state(game)
        except Exception as inner_e:
            logging.error(f"Failed to recover from bot crash: {inner_e}")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, color: str = "blue"): 
    await manager.connect(websocket, client_id)
    if client_id not in [p.id for p in game.players]:
        if not game.game_started:
            game.add_player(client_id, color)  
        
    await manager.broadcast_game_state(game)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get('type') == 'MOVE':
                    payload = MovePayload(**message.get('payload', {}))
                    success = game.process_move(client_id, payload)
                    
                    if success:
                        await manager.broadcast_game_state(game)
                        
                        # --- FIX: Only spawn bot task if it is successfully a bot's turn! ---
                        if game.players:
                            current_player = game.players[game.turn_index]
                            if current_player.is_bot:
                                task = asyncio.create_task(handle_bot_turns(game, manager))
                                background_tasks.add(task)
                                task.add_done_callback(background_tasks.discard)
                    
            except ValidationError as e:
                logging.error(f"Malicious or Invalid payload from {client_id}: {e}")
                safe_state = game.get_state(requestor_id=client_id)
                await websocket.send_text(json.dumps(safe_state))
            except json.JSONDecodeError:
                logging.error(f"Invalid JSON received from {client_id}")
                safe_state = game.get_state(requestor_id=client_id)
                await websocket.send_text(json.dumps(safe_state))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="info")
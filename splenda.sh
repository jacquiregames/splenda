#!/bin/bash
gnome-terminal -- bash -c "pnpm run dev; exec bash"
gnome-terminal -- bash -c "cd backend && python3 main.py; exec bash"
 

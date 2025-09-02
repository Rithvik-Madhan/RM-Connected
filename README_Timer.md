# Luau Player Timer System

A basic timer system for Roblox that starts when players join the game.

## Files

### 1. PlayerTimer.lua (ServerScript)
Place in `ServerScriptService`

**Features:**
- Tracks individual player timers
- Starts timer automatically on player join
- Handles cleanup when players leave
- Updates all timers using RunService.Heartbeat
- Prints debug information every 10 seconds
- Creates RemoteEvent for client communication

### 2. TimerGui.lua (LocalScript)  
Place in `StarterPlayerScripts`

**Features:**
- Creates a GUI to display the timer
- Receives timer updates from server via RemoteEvent
- Color-coded timer display (white → green → gold)
- Smooth fade-in animation
- Positioned in top-left corner

## Setup Instructions

1. **ServerScript Setup:**
   - Open Roblox Studio
   - In the Explorer, find `ServerScriptService`
   - Right-click and create a new `ServerScript`
   - Copy the contents of `PlayerTimer.lua` into the script

2. **LocalScript Setup:**
   - In the Explorer, find `StarterPlayer > StarterPlayerScripts`
   - Right-click and create a new `LocalScript`
   - Copy the contents of `TimerGui.lua` into the script

3. **Test:**
   - Press F5 to test in Studio
   - Timer should appear in top-left corner
   - Check Output window for debug messages

## Customization Options

### Timer Display Colors:
- 0-60 seconds: White
- 1-5 minutes: Spring Green  
- 5+ minutes: Gold

### GUI Position:
Currently positioned at `UDim2.new(0, 10, 0, 10)` (top-left with 10px margin)

### Debug Output:
Timer prints to console every 10 seconds and when players leave

## How It Works

1. When a player joins, `PlayerAdded` event fires
2. Server creates timer entry with `tick()` start time
3. `RunService.Heartbeat` updates all timers every frame
4. Server sends time updates to client via RemoteEvent
5. Client GUI receives updates and displays formatted time
6. When player leaves, timer data is cleaned up

The system is efficient and handles multiple players simultaneously.
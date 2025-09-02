-- PlayerTimer.lua - Basic timer that starts on game join
-- Place this script in ServerScriptService as a ServerScript

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Dictionary to store each player's timer data
local playerTimers = {}

-- RemoteEvent for updating client GUIs (optional)
local timerUpdateEvent = Instance.new("RemoteEvent")
timerUpdateEvent.Name = "TimerUpdate"
timerUpdateEvent.Parent = ReplicatedStorage

-- Function to format time in MM:SS format
local function formatTime(seconds)
    local minutes = math.floor(seconds / 60)
    local remainingSeconds = math.floor(seconds % 60)
    return string.format("%02d:%02d", minutes, remainingSeconds)
end

-- Function called when player joins
local function onPlayerAdded(player)
    print(player.Name .. " joined the game!")
    
    -- Initialize timer data for the player
    playerTimers[player] = {
        startTime = tick(),
        currentTime = 0
    }
    
    print("Timer started for " .. player.Name)
end

-- Function called when player leaves
local function onPlayerRemoving(player)
    if playerTimers[player] then
        local totalTime = playerTimers[player].currentTime
        print(player.Name .. " left after " .. formatTime(totalTime))
        
        -- Clean up the timer data
        playerTimers[player] = nil
    end
end

-- Update all player timers every frame
local function updateTimers()
    for player, timerData in pairs(playerTimers) do
        if player.Parent then -- Check if player is still in game
            timerData.currentTime = tick() - timerData.startTime
            
            -- Fire remote event to update client GUI (optional)
            timerUpdateEvent:FireClient(player, timerData.currentTime)
            
            -- Optional: Print timer every 10 seconds for debugging
            if math.floor(timerData.currentTime) % 10 == 0 and math.floor(timerData.currentTime) > 0 then
                local timeStr = formatTime(timerData.currentTime)
                if math.floor(timerData.currentTime) ~= math.floor(timerData.currentTime - 1) then
                    print(player.Name .. " time: " .. timeStr)
                end
            end
        end
    end
end

-- Connect events
Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
RunService.Heartbeat:Connect(updateTimers)

-- Handle players who joined before script loaded
for _, player in pairs(Players:GetPlayers()) do
    onPlayerAdded(player)
end

print("PlayerTimer script loaded successfully!")
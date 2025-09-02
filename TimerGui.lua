-- TimerGui.lua - Client-side GUI for displaying the timer
-- Place this script in StarterPlayerScripts as a LocalScript

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Wait for the RemoteEvent
local timerUpdateEvent = ReplicatedStorage:WaitForChild("TimerUpdate")

-- Create the GUI
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "TimerGui"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Main frame
local mainFrame = Instance.new("Frame")
mainFrame.Name = "TimerFrame"
mainFrame.Size = UDim2.new(0, 200, 0, 60)
mainFrame.Position = UDim2.new(0, 10, 0, 10)
mainFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
mainFrame.BackgroundTransparency = 0.3
mainFrame.BorderSizePixel = 0
mainFrame.Parent = screenGui

-- Corner rounding
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = mainFrame

-- Timer label
local timerLabel = Instance.new("TextLabel")
timerLabel.Name = "TimerLabel"
timerLabel.Size = UDim2.new(1, 0, 0.6, 0)
timerLabel.Position = UDim2.new(0, 0, 0, 0)
timerLabel.BackgroundTransparency = 1
timerLabel.Text = "00:00"
timerLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
timerLabel.TextScaled = true
timerLabel.Font = Enum.Font.GothamBold
timerLabel.Parent = mainFrame

-- Title label
local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "TitleLabel"
titleLabel.Size = UDim2.new(1, 0, 0.4, 0)
titleLabel.Position = UDim2.new(0, 0, 0.6, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "Game Time"
titleLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
titleLabel.TextScaled = true
titleLabel.Font = Enum.Font.Gotham
titleLabel.Parent = mainFrame

-- Function to format time in MM:SS format
local function formatTime(seconds)
    local minutes = math.floor(seconds / 60)
    local remainingSeconds = math.floor(seconds % 60)
    return string.format("%02d:%02d", minutes, remainingSeconds)
end

-- Function to update the timer display
local function updateTimerDisplay(currentTime)
    local formattedTime = formatTime(currentTime)
    timerLabel.Text = formattedTime
    
    -- Optional: Change color based on time milestones
    if currentTime >= 300 then -- 5 minutes
        timerLabel.TextColor3 = Color3.fromRGB(255, 215, 0) -- Gold
    elseif currentTime >= 60 then -- 1 minute
        timerLabel.TextColor3 = Color3.fromRGB(0, 255, 127) -- Spring green
    else
        timerLabel.TextColor3 = Color3.fromRGB(255, 255, 255) -- White
    end
end

-- Connect to the remote event
timerUpdateEvent.OnClientEvent:Connect(function(currentTime)
    updateTimerDisplay(currentTime)
end)

-- Optional: Add a fade-in animation when GUI loads
local fadeIn = TweenService:Create(
    mainFrame,
    TweenInfo.new(0.5, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
    {BackgroundTransparency = 0.3}
)

mainFrame.BackgroundTransparency = 1
fadeIn:Play()

print("Timer GUI loaded successfully!")
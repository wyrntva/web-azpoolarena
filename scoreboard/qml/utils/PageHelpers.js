.pragma library

// =============================================================================
// PageHelpers.js - Common functions shared across score pages
// =============================================================================

// -----------------------------------------------------------------------------
// Time Formatting
// -----------------------------------------------------------------------------
function formatTime(sec) {
    var h = Math.floor(sec / 3600)
    var m = Math.floor((sec % 3600) / 60)
    var s = sec % 60
    function pad(n) { return (n < 10 ? "0" : "") + n }
    return pad(h) + ":" + pad(m) + ":" + pad(s)
}

// -----------------------------------------------------------------------------
// Player Color Palette
// -----------------------------------------------------------------------------
var playerColors = [
    "#ffcd00", // 1: yellow
    "#da251d", // 2: red
    "#246ee4", // 3: blue
    "#1ee051", // 4: green
    "#6941c8", // 5: purple
    "#94A3B8"  // fallback: gray
]

function colorForOrdinal(n) {
    if (n >= 1 && n <= 5) return playerColors[n - 1]
    return playerColors[5]
}

// -----------------------------------------------------------------------------
// Default Player Name Patterns (for detecting if name is default)
// -----------------------------------------------------------------------------
var defaultNamePatterns = [
    "Player ",
    "Người chơi ",
    "选手 ",
    "플레이어 ",
    "プレイヤー"
]

function isDefaultName(name, index) {
    if (!name) return true
    for (var i = 0; i < defaultNamePatterns.length; ++i) {
        if (name === defaultNamePatterns[i] + index) return true
    }
    return false
}

// -----------------------------------------------------------------------------
// History Entry Formatting
// -----------------------------------------------------------------------------
function formatHistoryWithScore(baseText, score, currentScoreLabel) {
    return baseText + " — " + currentScoreLabel + ": " + score
}

// -----------------------------------------------------------------------------
// Dialog Sizing Helper (returns object with computed sizes based on uiScale)
// -----------------------------------------------------------------------------
function dialogSizes(uiScale) {
    return {
        fixedW:     Math.round(680 * uiScale),
        minW:       Math.round(550 * uiScale),
        sideMargin: Math.round(20 * uiScale),
        topOffset:  Math.round(180 * uiScale),
        kbMargin:   Math.round(16 * uiScale),
        titleFont:  Math.round(32 * uiScale),
        textFont:   Math.round(24 * uiScale),
        btnHeight:  Math.round(60 * uiScale),
        btnMinW:    Math.round(180 * uiScale)
    }
}

// -----------------------------------------------------------------------------
// Control Panel Action Sizes
// -----------------------------------------------------------------------------
function panelActionSizes(uiScale) {
    return {
        width:      Math.round(160 * uiScale),
        height:     Math.round(100 * uiScale),
        iconSize:   Math.round(40 * uiScale),
        fontSize:   Math.round(18 * uiScale),
        rowGap:     Math.round(40 * uiScale),
        padding:    Math.round(16 * uiScale),
        radius:     Math.round(16 * uiScale),
        gap:        Math.round(12 * uiScale)
    }
}

// -----------------------------------------------------------------------------
// Idle timeout (30 minutes in ms)
// -----------------------------------------------------------------------------
var idleTimeoutMs = 30 * 60 * 1000

// -----------------------------------------------------------------------------
// History limit
// -----------------------------------------------------------------------------
var historyLimit = 100

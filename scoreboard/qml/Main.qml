import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Controls.Material 2.15
import QtQuick.Window 6
import QtQuick.VirtualKeyboard 6
import QtQuick.VirtualKeyboard.Settings 6
import "components"
import "pages"
import "utils/Translations.js" as Translations

ApplicationWindow {
    id: win
    visible: true
    color: "#F0F2F4"
    title: "Scoreboard (Qt/QML)"
    minimumWidth: 1024
    minimumHeight: 600

    // ===== Kiosk Mode - Khóa ứng dụng fullscreen =====
    flags: Qt.Window | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint

    Timer {
        id: raiseTimer
        interval: 100
        repeat: false
        onTriggered: {
            win.raise()
            win.requestActivate()
        }
    }

    // Chặn các phím tắt hệ thống
    Shortcut { sequences: ["Alt+F4"];       onActivated: {} }  // Chặn đóng
    Shortcut { sequences: ["Alt+Tab"];      onActivated: {} }  // Chặn chuyển app
    Shortcut { sequences: ["Alt+Escape"];   onActivated: {} }
    Shortcut { sequences: ["Meta+D"];       onActivated: {} }  // Windows: Show desktop
    Shortcut { sequences: ["Meta+Tab"];     onActivated: {} }
    Shortcut { sequences: ["Ctrl+Alt+Del"]; onActivated: {} }
    Shortcut { sequences: ["Ctrl+Escape"];  onActivated: {} }  // Start menu

    property real uiScale: Math.min(width / 1920, height / 1080)
    function px(v)  { return Math.round(v * uiScale) }
    function dpr(h) { return Math.max(1, Math.round(h * Screen.devicePixelRatio)) }
    property real vkHeight: inputPanel.visible ? (inputPanel.height * (1 + inputPanel.scale) / 2) : 0

    readonly property var languageOptions: Translations.languageOptions
    property string currentLanguageCode: Translations.defaultLanguageCode
    readonly property string currentLanguageLabel: Translations.labelFor(currentLanguageCode)
    readonly property string currentLanguageIcon: Qt.resolvedUrl(Translations.flagFor(currentLanguageCode))
    property var translationData: Translations.bundles

    property var historyCache: ({})
    function _historyKey(name) {
        return (name && typeof name === "string" && name.length) ? name : "default"
    }
    function loadHistory(name) {
        var key = _historyKey(name)
        var data = historyCache[key]
        return data ? data.slice() : []
    }
    function saveHistory(name, model) {
        var key = _historyKey(name)
        if (!model || typeof model.count !== "number") {
            historyCache[key] = []
            return
        }
        var arr = []
        for (var i = 0; i < model.count; ++i) {
            var entry = model.get(i)
            arr.push({ text: entry.text, ts: entry.ts })
        }
        historyCache[key] = arr
    }
    function clearHistory(name) {
        historyCache[_historyKey(name)] = []
    }

    Material.theme: Material.Dark
    Material.primary: "#172339"
    Material.accent:  "#60DB80"

    FontLoader { id: montserratRegular;  source: "../assets/fonts/Montserrat-Regular.otf" }
    FontLoader { id: montserratBold;      source: "../assets/fonts/Montserrat-Bold.otf" }
    FontLoader { id: montserratItalic;    source: "../assets/fonts/Montserrat-Italic.otf" }
    FontLoader { id: pretendardRegular;  source: "../assets/fonts/Pretendard-Regular.otf" }

    readonly property string baseFontFamily: montserratRegular.status === FontLoader.Ready
                                              ? montserratRegular.name
                                              : "Montserrat"
    property string appFontFamily: baseFontFamily

    font.family: appFontFamily

    // ===== Scheduled Shutdown System =====
    // When ESP sends SHUTDOWN_SCOREBOARD while a match is active (score pages),
    // defer the shutdown until the user returns to HomePage.
    property bool _pendingShutdown: false

    readonly property var _scoreRoutes: ["score", "multiScore", "QuickScore", "tournamentPage"]

    function _isOnScorePage() {
        if (!stack.currentItem || !stack.currentItem.routeName) return false
        return _scoreRoutes.indexOf(stack.currentItem.routeName) !== -1
    }

    function _handleShutdownRequest() {
        if (_isOnScorePage()) {
            console.log("[Shutdown] Đang ở trang tỉ số → HOÃN tắt máy cho đến khi về Home")
            _pendingShutdown = true
        } else {
            console.log("[Shutdown] Không ở trang tỉ số → TẮT MÁY NGAY")
            _pendingShutdown = false
            ShutdownListener.execute_shutdown()
        }
    }

    function _checkPendingShutdown() {
        if (_pendingShutdown && stack.currentItem && stack.currentItem.routeName === "home") {
            console.log("[Shutdown] Đã về Home → THỰC THI TẮT MÁY (hoãn trước đó)")
            _pendingShutdown = false
            // Delay 1s to let HomePage fully render
            shutdownDelayTimer.start()
        }
    }

    Timer {
        id: shutdownDelayTimer
        interval: 1000
        repeat: false
        onTriggered: ShutdownListener.execute_shutdown()
    }

    Connections {
        target: typeof ShutdownListener !== "undefined" && ShutdownListener ? ShutdownListener : null
        function onShutdownRequested() {
            win._handleShutdownRequest()
        }
    }

    // ===== Camera Reload System =====
    property int cameraReloadVersion: 0
    property bool cameraIsReconnecting: false

    // Computed stream URL with cache-buster to force player reload
    readonly property string cameraStreamUrl: {
        if (typeof CameraController === "undefined" || !CameraController) return ""
        var base = CameraController.streamUrl
        if (base === "") return ""
        return base + "?v=" + cameraReloadVersion
    }

    Connections {
        target: typeof CameraController !== "undefined" && CameraController ? CameraController : null
        function onForceReload() {
            console.log("[Main] CameraController.forceReload received! Incrementing version to", win.cameraReloadVersion + 1)
            win.cameraReloadVersion++
            // Hide overlay after 5s - enough time for video to decode and render
            cameraOverlayHideTimer.restart()
        }
        function onStreamStatusChanged() {
            var status = CameraController.streamStatus
            console.log("[Main] CameraController.streamStatus changed to:", status)
            if (status === "connecting") {
                win.cameraIsReconnecting = true
                cameraOverlayHideTimer.stop()  // Cancel any pending hide
            }
        }
    }

    Timer {
        id: cameraOverlayHideTimer
        interval: 5000  // 5 seconds after forceReload
        repeat: false
        onTriggered: {
            console.log("[Main] Overlay hide timer - clearing cameraIsReconnecting")
            win.cameraIsReconnecting = false
        }
    }

    // ===== Device Status Check System =====
    property bool _isCheckingStatus: false
    property bool _deviceDisconnected: false

    // Handle device status check result
    Connections {
        target: DeviceActivationService

        function onStatusChecked(connected, message, tableName) {
            console.log("[DeviceStatus] Result - connected:", connected, "message:", message, "tableName:", tableName)
            win._isCheckingStatus = false

            // Always update tableName if provided and different from current
            if (connected && tableName && DeviceSettings) {
                var currentName = DeviceSettings.tableName || ""
                if (currentName !== tableName) {
                    console.log("[DeviceStatus] Updating tableName from '" + currentName + "' to '" + tableName + "'")
                    DeviceSettings.setTableName(tableName)
                }
            }

            if (!connected && !win._deviceDisconnected) {
                var msg = String(message || "")
                var m = msg.toLowerCase()

                // Only treat as a real unbind when server explicitly indicates it.
                // For any other/unknown message, keep activation (offline/transient/server issue)
                // to avoid kicking user back to activation page.
                var isRealUnbind = false
                if (m.indexOf("no longer exists") !== -1) isRealUnbind = true
                else if (m.indexOf("not connected") !== -1) isRealUnbind = true
                else if (m.indexOf("mismatch") !== -1) isRealUnbind = true

                if (!isRealUnbind) {
                    console.log("[DeviceStatus] Not connected but not a real unbind -> keep activation. message:", msg)
                    return
                }

                // Device unbound - clear activation and show activation page
                console.log("[DeviceStatus] Device unbound! Navigating to activation page... message:", msg)
                win._deviceDisconnected = true
                deviceStatusTimer.stop()

                try { DeviceSettings.clearActivation() } catch(e) {
                    console.log("[DeviceStatus] Error clearing activation:", e)
                }

                // Use Qt.callLater to ensure UI is ready
                Qt.callLater(function() {
                    if (stack.currentItem && stack.currentItem.routeName !== "activation") {
                        stack.clear()
                        stack.push(Qt.resolvedUrl("pages/ActivationPage.qml"), {})
                    }
                })
            }
        }
    }

    // Periodic device status check (every 10 seconds)
    Timer {
        id: deviceStatusTimer
        interval: 10 * 1000  // 10 seconds
        repeat: true
        running: false

        onTriggered: {
            console.log("[DeviceStatus] Timer triggered, running:", running)
            checkDeviceStatus()
        }
    }

    function checkDeviceStatus() {
        // Skip if already checking or already disconnected
        if (_isCheckingStatus) {
            console.log("[DeviceStatus] Already checking, skipping...")
            return
        }

        if (_deviceDisconnected) {
            console.log("[DeviceStatus] Already disconnected, skipping...")
            return
        }

        // Skip if on activation page
        if (stack.currentItem && stack.currentItem.routeName === "activation") {
            console.log("[DeviceStatus] On activation page, skipping...")
            return
        }

        if (DeviceSettings && DeviceSettings.activated) {
            var code = DeviceSettings.deviceCode
            var deviceId = DeviceSettings.deviceId

            // If deviceId not saved (old activation), use current device ID
            if (!deviceId || deviceId.length === 0) {
                deviceId = DeviceActivationService.getDeviceId()
                console.log("[DeviceStatus] Using current device ID:", deviceId)
            }

            console.log("[DeviceStatus] Checking status for code:", code, "deviceId:", deviceId)

            if (code && deviceId) {
                _isCheckingStatus = true
                DeviceActivationService.checkStatus(code, deviceId)
            } else {
                console.log("[DeviceStatus] Missing code or deviceId, skipping check")
            }
        } else {
            console.log("[DeviceStatus] Device not activated, skipping check")
        }
    }

    // Also check status when app gains focus (backup mechanism)
    onActiveChanged: {
        if (active && !_deviceDisconnected) {
            // Delay slightly to let UI settle
            Qt.callLater(function() {
                if (DeviceSettings && DeviceSettings.activated) {
                    console.log("[DeviceStatus] App became active, checking status...")
                    checkDeviceStatus()
                }
            })
        }

        // Existing kiosk mode logic
        if (!active) {
            raiseTimer.start()
        }
    }

    // ===== Tournament Match Auto-Navigation =====
    property int lastAutoNavigatedMatchId: -1
    property bool hasActiveTournamentMatch: false
    property bool _isNavigating: false
    // Grace period at startup: prevents auto-TournamentPage during first few seconds
    // Gives user time to see HomePage and window to finish fullscreen transition
    property bool _startupGracePeriod: true
    Timer {
        id: startupGraceTimer
        interval: 6000  // 6 seconds after boot before auto-tournament-nav is allowed
        repeat: false
        running: true
        onTriggered: {
            win._startupGracePeriod = false
            console.log("[Startup] Grace period ended, auto-tournament-navigation now enabled")
            // Re-trigger the check just in case a match was loaded during the grace period
            if (typeof TournamentService !== "undefined" && TournamentService.activeMatch) {
                var m = TournamentService.activeMatch
                if (m.match_id && win.lastAutoNavigatedMatchId !== m.match_id) {
                    var curRoute = stack.currentItem ? stack.currentItem.routeName : ""
                    var curIsScoring = (curRoute === "score" || curRoute === "multiScore" || curRoute === "QuickScore")
                    if (!curIsScoring && curRoute !== "activation" && curRoute !== "tournamentPage") {
                        console.log("[Tournament] Delayed auto-navigating to TournamentPage for match:", m.match_id)
                        win.lastAutoNavigatedMatchId = m.match_id
                        Qt.callLater(function() {
                            if (stack.depth > 1) stack.pop(null, StackView.Immediate)
                            stack.push(Qt.resolvedUrl("pages/TournamentPage.qml"), { routeName: "tournamentPage", backTo: "home" }, StackView.Immediate)
                        })
                    } else {
                        console.log("[Tournament] Delayed auto-nav skipped - user is on", curRoute, "for match:", m.match_id)
                    }
                }
            }
        }
    }
    Timer {
        id: navLockTimer
        interval: 800
        repeat: false
        onTriggered: win._isNavigating = false
    }

    Connections {
        target: typeof TournamentService !== "undefined" ? TournamentService : null
        ignoreUnknownSignals: true
        function onMatchChanged() {
            var m = TournamentService.activeMatch
            var hasMatch = !!(m && m.match_id)
            win.hasActiveTournamentMatch = hasMatch
            console.log("[TournamentService] onMatchChanged - hasMatch:", hasMatch, "matchId:", (m ? m.match_id : "none"))
            
            if (hasMatch) {
                
                // If this is a new active match that we haven't navigated to yet
                if (win.lastAutoNavigatedMatchId !== m.match_id) {

                    var currentRoute = stack.currentItem ? stack.currentItem.routeName : ""
                    // Do NOT interrupt user while they are actively scoring
                    var isOnScorePage = (currentRoute === "score" 
                                        || currentRoute === "multiScore" 
                                        || currentRoute === "QuickScore")
                    
                    // Navigate only if not on Activation, already on TournamentPage, or actively scoring
                    if (stack.currentItem 
                        && currentRoute !== "activation" 
                        && currentRoute !== "tournamentPage"
                        && !isOnScorePage) {
                        
                        // Don't auto-navigate during startup grace period (first 6 seconds)
                        if (win._startupGracePeriod) {
                            console.log("[Tournament] Startup grace period active, skipping auto-nav for match:", m.match_id)
                            return
                        }
                        
                        win.lastAutoNavigatedMatchId = m.match_id
                        console.log("[Tournament] Auto-navigating to TournamentPage for match:", m.match_id)
                        // Use Qt.callLater to let any pending bindings settle
                        Qt.callLater(function() {
                            // Pop all pages back to home without animation
                            if (stack.depth > 1)
                                stack.pop(null, StackView.Immediate)
                            // Push tournament page without animation to avoid layout glitch
                            stack.push(Qt.resolvedUrl("pages/TournamentPage.qml"), {
                                routeName: "tournamentPage",
                                backTo: "home"
                            }, StackView.Immediate)
                        })
                    } else if (isOnScorePage) {
                        console.log("[Tournament] User is actively scoring on", currentRoute, "- skipping auto-nav for match:", m.match_id)
                    }
                }
            } else {
                win.hasActiveTournamentMatch = false
                // Match finished or cleared, reset tracker so next match triggers navigation
                win.lastAutoNavigatedMatchId = -1
                
                // If we are currently on TournamentPage and the match ended, auto return to Home
                if (stack.currentItem && stack.currentItem.routeName === "tournamentPage") {
                    console.log("[Tournament] Match ended or cleared, returning to Home")
                    Qt.callLater(function() {
                        win.backTo("home")
                    })
                }
            }
        }
    }


    Component.onCompleted: {
        try { showFullScreen() } catch(_) {}
        try { setLanguage(currentLanguageCode) } catch(_) {}

        // Reset disconnected flag on startup
        _deviceDisconnected = false

        // First run or not activated: show activation page
        try {
            if (DeviceSettings && !DeviceSettings.activated) {
                console.log("[DeviceStatus] Not activated, showing activation page")
                stack.clear()
                stack.push(Qt.resolvedUrl("pages/ActivationPage.qml"), {})
            } else if (DeviceSettings && DeviceSettings.activated) {
                // Already activated - verify with server and start periodic check
                console.log("[DeviceStatus] Already activated, starting status check timer")
                checkDeviceStatus()
                deviceStatusTimer.start()
                console.log("[DeviceStatus] Timer started, running:", deviceStatusTimer.running)
                
                // Start background fetching of tournament matches
                if (typeof TournamentService !== "undefined") {
                    // Delay auto-refresh by 3 seconds to ensure showFullScreen() finishes 
                    // and window dimensions are final, preventing layout race conditions on startup
                    var autoRefreshDelay = Qt.createQmlObject('import QtQuick 6; Timer { interval: 3000; onTriggered: TournamentService.startAutoRefresh() }', win, "autoRefreshDelay");
                    autoRefreshDelay.start()
                }
            }
        } catch(e) {
            console.log("[DeviceStatus] Error in Component.onCompleted:", e)
        }

        scheduleSplashTimerReset()
    }

    function backTo(routeName) {
        console.log("[Navigation] backTo requested to route:", routeName, "current stack depth:", stack.depth)
        for (var i = stack.depth - 1; i >= 0; --i) {
            var it = stack.get(i)
            if (it && it.routeName === routeName) {
                console.log("[Navigation] Found route", routeName, "at index", i, "- popping to it")
                stack.pop(it)
                return
            }
        }
        console.log("[Navigation] Route", routeName, "not found, popping top page")
        stack.pop()
    }
    function pushPage(url, props) { 
        // 1. Double Click / Spam Protection: Strict Lock
        if (win._isNavigating) {
            console.log("[Navigation] Lock active, ignoring request to:", url)
            return null
        }
        
        var targetRoute = (props && props.routeName) ? props.routeName : ""
        
        // 2. Prevent pushing the SAME page if already active
        if (stack.currentItem && targetRoute !== "" && targetRoute === stack.currentItem.routeName) {
            console.log("[Navigation] Already on route:", targetRoute)
            return null
        }

        // 3. Tournament Protection: Strictly check match status before navigation
        if (targetRoute === "tournamentPage" && !win.hasActiveTournamentMatch) {
            console.log("[Navigation] Blocked: No active match for TournamentPage")
            // Try to notify the user if we can find the HomePage toast
            return null
        }
        
        console.log("[Navigation] Pushing page:", url, "Route:", targetRoute)
        win._isNavigating = true
        navLockTimer.restart()
        
        return stack.push(Qt.resolvedUrl(url), props || {}) 
    }

    readonly property int splashIdleMs: 15 * 60 * 1000  // 10s (TEST) — đổi lại 15 * 60 * 1000 sau khi test
    Timer {
        id: splashTimer
        interval: splashIdleMs
        repeat: false
        onTriggered: {
            if (stack.currentItem && stack.currentItem.routeName === "home") {
                var cur = stack.currentItem
                if (cur && typeof cur.closeAllDialogs === "function") {
                    try { cur.closeAllDialogs() } catch(_) {}
                }
                try { if (languageMenu && languageMenu.visible) languageMenu.close() } catch(_) {}
                try { Qt.inputMethod.hide() } catch(_) {}
                Qt.callLater(function() { pushPage("pages/SplashPage.qml", {}) })
            }
        }
    }

    function scheduleSplashTimerReset() {
        var onHome = (stack.currentItem && stack.currentItem.routeName === "home")
        if (onHome) splashTimer.restart()
        else splashTimer.stop()
    }
    onActiveFocusItemChanged: scheduleSplashTimerReset()

    function setLanguage(code) {
        var selected = Translations.optionFor(code)
        if (!selected)
            return

        currentLanguageCode = selected.code
        applyLanguageFonts(currentLanguageCode)

        var locale = Translations.localeFor(currentLanguageCode)
        try {
            if (locale && locale.length > 0)
                VirtualKeyboardSettings.activeLocales = [locale]
            if (locale && locale.length > 0)
                VirtualKeyboardSettings.locale = locale
        } catch(_) {}
    }

    // Cache for font stacks to avoid recreating arrays on each call
    property var _fontStackCache: ({})

    function fontStackForLanguage(code) {
        // Check cache first
        var cacheKey = code + "_" + baseFontFamily + "_" + fontName(pretendardRegular)
        if (_fontStackCache.hasOwnProperty(cacheKey))
            return _fontStackCache[cacheKey]

        var latin = baseFontFamily
        var pretendard = fontName(pretendardRegular)
        var stack
        if (code === "zh") {
            stack = ["Noto Sans CJK SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei", latin, "Montserrat", "Arial", "Helvetica", "Sans Serif"]
        } else if (code === "ja") {
            stack = ["Noto Sans CJK JP", "Yu Gothic UI", "Hiragino Sans", "Meiryo", latin, "Montserrat", "Arial", "Helvetica", "Sans Serif"]
        } else if (code === "ko") {
            stack = [pretendard, "Noto Sans CJK KR", "Noto Sans KR", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", latin, "Montserrat", "Arial", "Helvetica", "Sans Serif"]
        } else {
            stack = [latin, "Montserrat", "Arial", "Helvetica", "Sans Serif"]
        }

        var seen = {}
        var deduped = []
        for (var i = 0; i < stack.length; ++i) {
            var name = stack[i]
            if (name && !seen[name]) {
                deduped.push(name)
                seen[name] = true
            }
        }

        // Store in cache
        _fontStackCache[cacheKey] = deduped
        return deduped
    }

    function fontName(loader) {
        if (!loader)
            return ""
        if (loader.status === FontLoader.Ready && loader.name && loader.name.length > 0)
            return loader.name
        return ""
    }

    function applyLanguageFonts(code) {
        var stack = fontStackForLanguage(code)
        if (!stack || stack.length === 0)
            stack = [baseFontFamily]
        appFontFamily = stack[0]
    }

    Connections {
        target: pretendardRegular
        function onStatusChanged() {
            if (pretendardRegular.status === FontLoader.Ready && currentLanguageCode === "ko") {
                applyLanguageFonts("ko")
            }
        }
    }

    function trKey(key, fallback) {
        var bundle = translationData[currentLanguageCode]
        if (bundle && bundle.hasOwnProperty(key))
            return bundle[key]
        var viBundle = translationData["vi"]
        if (viBundle && viBundle.hasOwnProperty(key))
            return viBundle[key]
        return (fallback !== undefined) ? fallback : key
    }

    function tr(key) {
        return trKey(key, key)
    }

    function trArgs(key, args, fallback) {
        var text = trKey(key, fallback !== undefined ? fallback : key)
        if (!args || !args.length) return text
        var result = text
        for (var i = 0; i < args.length; ++i) {
            var token = "%" + (i + 1)
            result = result.split(token).join(String(args[i]))
        }
        return result
    }

    InputPanel {
        id: inputPanel
        parent: win.contentItem
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        visible: Qt.inputMethod.visible
        enabled: visible
        z: 10000
        scale: Math.max(0.65, Math.min(0.9, 0.75 * win.uiScale))
    }

    ToolBar {
        id: topBar
        anchors { left: parent.left; right: parent.right; top: parent.top }
        visible: !(stack.currentItem && (stack.currentItem.routeName === "splash" || stack.currentItem.routeName === "activation"))
        height: visible ? px(66) : 0
        z: 10
        background: Rectangle { color: "#FFFFFF" }

        readonly property int  marginSize: px(279)
        readonly property bool onHome: (stack && stack.currentItem && stack.currentItem.routeName === "home")

        contentItem: RowLayout {
            anchors.fill: parent
            anchors.leftMargin:  topBar.onHome ? topBar.marginSize : 0
            anchors.rightMargin: 0
            spacing: px(8)

            Item {
                Layout.alignment: Qt.AlignVCenter | Qt.AlignLeft
                Layout.leftMargin: (!topBar.onHome && visible) ? px(26) : 0
                width:  visible ? px(68) : 0
                height: topBar.height
                visible: stack.currentItem
                         && stack.currentItem.routeName !== "home"
                         && stack.currentItem.routeName !== "splash"
                         && !(stack.currentItem.routeName === "tournamentPage" && win.hasActiveTournamentMatch)

                CircleIconButton {
                    anchors.centerIn: parent
                    diameter: Math.round(56 * win.uiScale)
                    iconSource: "../../assets/icon/back.svg"
                    iconSize: Math.round(32 * win.uiScale)
                    onClicked: {
                        const cur = stack.currentItem
                        if (cur && typeof cur.handleBackRequested === "function") {
                            cur.handleBackRequested()
                        } else if (cur && cur.backTo) {
                            backTo(cur.backTo)
                        } else {
                            stack.pop()
                        }
                    }
                }
            }

            Item {
                Layout.preferredWidth: topBar.onHome ? languageButton.implicitWidth : 0
                Layout.minimumWidth: 0
                Layout.maximumWidth: Layout.preferredWidth
                Layout.fillWidth: true
                Layout.alignment: Qt.AlignHCenter | Qt.AlignVCenter
                visible: topBar.onHome
                implicitHeight: topBar.height

                Button {
                    id: languageButton
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: win.currentLanguageLabel
                    implicitHeight: Math.round(topBar.height * 1.05)
                    implicitWidth: Math.max(Math.round(300 * win.uiScale), contentItem ? contentItem.implicitWidth : 0)
                    padding: 0
                    font.pixelSize: Math.round(26 * win.uiScale)
                    font.bold: true
                    background: Rectangle {
                        radius: Math.round(12 * win.uiScale)
                        color: languageButton.down ? "#E0E7FF"
                               : (languageButton.hovered ? "#F5F7FF" : "#FFFFFF")
                        border.width: 0
                    }
                    contentItem: RowLayout {
                        anchors.fill: parent
                        anchors.margins: px(14)
                        anchors.leftMargin: Math.round(3 * win.uiScale)
                        spacing: px(16)

                        Image {
                            source: win.currentLanguageIcon
                            sourceSize.width: Math.round(56 * win.uiScale)
                            sourceSize.height: Math.round(36 * win.uiScale)
                            width: visible ? Math.round(54 * win.uiScale) : 0
                            height: visible ? Math.round(34 * win.uiScale) : 0
                            fillMode: Image.PreserveAspectFit
                            smooth: true
                            antialiasing: true
                            mipmap: true
                            layer.enabled: true
                            layer.samples: 4
                            layer.smooth: true
                            Layout.alignment: Qt.AlignVCenter
                            visible: source !== ""
                            Layout.preferredWidth: visible ? Math.round(54 * win.uiScale) : 0
                            Layout.preferredHeight: visible ? Math.round(34 * win.uiScale) : 0
                        }

                        Text {
                            text: languageButton.text
                            color: "#37393E"
                            font.pixelSize: Math.round(26 * win.uiScale)
                            font.bold: true
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                            elide: Text.ElideNone
                            Layout.fillWidth: false
                            Layout.alignment: Qt.AlignVCenter
                        }

                        Canvas {
                            id: arrowCanvas
                            Layout.alignment: Qt.AlignVCenter
                            Layout.preferredWidth: Math.max(14, Math.round(22 * win.uiScale))
                            Layout.preferredHeight: Math.max(8, Math.round(14 * win.uiScale))
                            implicitWidth: Layout.preferredWidth
                            implicitHeight: Layout.preferredHeight
                            onWidthChanged: requestPaint()
                            onHeightChanged: requestPaint()
                            onPaint: {
                                var ctx = getContext("2d")
                                ctx.resetTransform()
                                ctx.clearRect(0, 0, width, height)
                                ctx.beginPath()
                                ctx.moveTo(0, 0)
                                ctx.lineTo(width, 0)
                                ctx.lineTo(width / 2, height)
                                ctx.closePath()
                                ctx.fillStyle = "#37393E"
                                ctx.fill()
                            }
                        }
                    }
                    onClicked: languageMenu.open()
                }

                Menu {
                    id: languageMenu
                    parent: languageButton
                    y: languageButton.height
                    x: 0
                    implicitWidth: languageButton.width
                    background: Rectangle {
                        color: "#FFFFFF"
                        radius: Math.round(12 * win.uiScale)
                        border.color: "#D0D5DD"
                        border.width: Math.max(1, Math.round(1 * win.uiScale))
                    }
                    Repeater {
                        model: win.languageOptions
                        delegate: MenuItem {
                            id: langOption
                            required property var modelData
                            text: modelData.label
                            checkable: false
                            highlighted: win.currentLanguageCode === modelData.code
                            implicitHeight: Math.round(64 * win.uiScale)
                            contentItem: RowLayout {
                                anchors.fill: parent
                                anchors.margins: Math.round(16 * win.uiScale)
                                spacing: Math.round(22 * win.uiScale)

                                Image {
                                    source: Qt.resolvedUrl(modelData.flagSource || "")
                                    sourceSize.width: Math.round(56 * win.uiScale)
                                    sourceSize.height: Math.round(36 * win.uiScale)
                                    width: Math.round(54 * win.uiScale)
                                    height: Math.round(34 * win.uiScale)
                                    fillMode: Image.PreserveAspectFit
                                    smooth: true
                                    antialiasing: true
                                    mipmap: true
                                    layer.enabled: true
                                    layer.samples: 4
                                    layer.smooth: true
                                    Layout.alignment: Qt.AlignVCenter
                                }

                                AppText {
                                    text: modelData.label
                                    color: "#37393E"
                                    font.pixelSize: Math.round(26 * win.uiScale)
                                    Layout.fillWidth: true
                                    Layout.alignment: Qt.AlignVCenter
                                }
                            }
                            background: Rectangle {
                                radius: Math.round(8 * win.uiScale)
                                color: (langOption.highlighted || langOption.hovered) ? "#E6ECFF" : "#FFFFFF"
                            }
                            onTriggered: {
                                win.setLanguage(modelData.code)
                                languageMenu.close()
                            }
                        }
                    }
                }
            }

            Item { Layout.fillWidth: true; Layout.alignment: Qt.AlignVCenter }

            Item {
                Layout.alignment: Qt.AlignVCenter | Qt.AlignRight
                Layout.rightMargin: topBar.onHome ? topBar.marginSize : 0
                Layout.preferredHeight: topBar.height

                Behavior on Layout.rightMargin { NumberAnimation { duration: 160; easing.type: Easing.OutCubic } }

                Image {
                    id: logo
                    source: "../assets/logo.png"
                    fillMode: Image.PreserveAspectFit
                    cache: true
                    smooth: true
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.right: parent.right
                    anchors.rightMargin: px(30)
                    height: Math.round(Math.max(1, topBar.height) * 0.56)
                    sourceSize.height: dpr(height)
                    sourceSize.width: -1
                }
            }
        }
    }

    Item {
        id: shadow
        anchors { left: parent.left; right: parent.right; top: topBar.bottom }
        visible: topBar.visible
        height: 0
        z: 9
    }

    StackView {
        id: stack
        anchors { left: parent.left; right: parent.right; bottom: parent.bottom; top: shadow.bottom }
        initialItem: HomePage { }

        onCurrentItemChanged: {
            scheduleSplashTimerReset()

            // Check if a deferred shutdown should fire now
            win._checkPendingShutdown()

            // Auto-start device status timer when navigating to HomePage
            if (currentItem && currentItem.routeName === "home") {
                if (DeviceSettings && DeviceSettings.activated && !_deviceDisconnected) {
                    if (!deviceStatusTimer.running) {
                        console.log("[DeviceStatus] HomePage loaded, starting timer...")
                        deviceStatusTimer.start()
                        // Also do an immediate check
                        Qt.callLater(checkDeviceStatus)
                    }
                    if (typeof TournamentService !== "undefined") {
                        // Delay auto-refresh slightly so that at boot, SplashPage has time to be pushed
                        // and window has time to finish fullscreen transition, preventing layout races.
                        var tmr = Qt.createQmlObject('import QtQuick 6; Timer { interval: 2500; onTriggered: { if (stack.currentItem && stack.currentItem.routeName === "home") TournamentService.startAutoRefresh(); this.destroy() } }', win, "tmrAutoLaunch");
                        tmr.start()
                    }
                }
            }
        }
        onDepthChanged: scheduleSplashTimerReset()

        pushEnter: Transition {
            NumberAnimation { properties: "x";       from: stack.width * 0.08; to: 0; duration: 200; easing.type: Easing.OutCubic }
            NumberAnimation { properties: "opacity"; from: 0;                  to: 1; duration: 200 }
        }
        pushExit: Transition {
            NumberAnimation { properties: "x";       from: 0; to: -stack.width * 0.04; duration: 160; easing.type: Easing.InCubic }
            NumberAnimation { properties: "opacity"; from: 1; to: 0.6;                  duration: 160 }
        }
        popEnter: Transition {
            NumberAnimation { properties: "x";       from: -stack.width * 0.04; to: 0; duration: 160; easing.type: Easing.OutCubic }
            NumberAnimation { properties: "opacity"; from: 0.6;                 to: 1; duration: 160 }
        }
        popExit: Transition {
            NumberAnimation { properties: "x";       from: 0; to: stack.width * 0.08; duration: 200; easing.type: Easing.InCubic }
            NumberAnimation { properties: "opacity"; from: 1; to: 0;                 duration: 200 }
        }
    }
}

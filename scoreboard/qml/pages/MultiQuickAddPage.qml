// qml/pages/MultiQuickAddPage.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6

import "../components"
import "../pages/ActionLogger.js" as Logger
import "../utils/PageHelpers.js" as Helpers

Item {
    id: page
    property bool replayOpened: false
    readonly property bool pageActive: StackView.status === StackView.Active || StackView.status === StackView.Activating

    Loader {
        id: replayLoader
        active: false
        source: "../components/ReplayDialog.qml"
        visible: false
    }

    Connections {
        target: replayLoader.item
        ignoreUnknownSignals: true
        function onOpened() { page.replayOpened = true }
        function onClosed() {
            page.replayOpened = false
            replayLoader.active = false
        }
    }

    function openReplay() {
        replayLoader.active = true
        if (replayLoader.item && typeof replayLoader.item.openNow === "function") {
            replayLoader.item.openNow()
            page.replayOpened = true
        }
    }
    property string routeName: "QuickScore"
    property string backTo: "home"
    property int    renameTarget: -1
    property string pendingAction: ""
    property string mode: "multiQuick"

    property int    pendingDeleteIndex: -1
    readonly property int minPlayers: 3
    readonly property int maxPlayers: 5

    // ==== dialog sizing ====
    readonly property int dlgW:      Math.round(680 * win.uiScale)
    readonly property int dlgMin:    Math.round(550 * win.uiScale)
    readonly property int dlgSide:   Math.round(20  * win.uiScale)
    readonly property int dlgKb:     Math.round(16  * win.uiScale)
    readonly property int dlgTitle:  Math.round(32  * win.uiScale)
    readonly property int dlgText:   Math.round(24  * win.uiScale)

    readonly property int btnH:      Math.round(72 * win.uiScale)
    readonly property int btnMinW:   Math.round(180 * win.uiScale)
    readonly property int btnFont:   dlgText

    // ==== history (model + helper) ====
    ListModel { id: actionHistory }
    readonly property int historyLimit: 100
    function historyKey() {
        if (page.routeName && page.routeName.length) return page.routeName
        return "multiQuick"
    }
    function persistHistory() {
        if (typeof win !== "undefined" && win && typeof win.saveHistory === "function")
            win.saveHistory(historyKey(), actionHistory)
    }
    function restoreHistory() {
        if (typeof win === "undefined" || !win || typeof win.loadHistory !== "function")
            return
        var cached = win.loadHistory(historyKey()) || []
        if (cached.length) {
            actionHistory.clear()
            for (var i = 0; i < cached.length; ++i)
                actionHistory.append(cached[i])
            if (actionHistory.count > historyLimit)
                actionHistory.remove(historyLimit, actionHistory.count - historyLimit)
        }
    }
    function logAction(t) {
        Logger.push(actionHistory, t, historyLimit)
        persistHistory()
    }

    function prepareForLeave() {
        page._flushAgg(true)
        resetMatchAndState()
        resetMatchTimer()
        startMatchTimer()
        persistHistory()
        if (typeof LiveScoreService !== "undefined" && LiveScoreService) LiveScoreService.clearScore()
    }

    function syncScoreToBackend() {
        if (typeof LiveScoreService === "undefined" || !LiveScoreService) return
        var arr = []
        for (var i = 0; i < players.count; ++i) {
            var p = players.get(i)
            arr.push({ name: p.name || defaultPlayerName(i + 1), score: p.score, color: p.color })
        }
        LiveScoreService.reportScore(page.mode, JSON.stringify(arr))
    }

    function historyCurrentScoreLine(score) {
        return trArgsLocal("add_points_current_score", [score], "Điểm hiện tại: " + score)
    }

    function historyWithScore(text, score) {
        return text + " — " + historyCurrentScoreLine(score)
    }

    function trLocal(key) {
        return (typeof win !== "undefined" && win && typeof win.tr === "function") ? win.tr(key) : key
    }
    function trArgsLocal(key, args, fallback) {
        if (typeof win !== "undefined" && win && typeof win.trArgs === "function")
            return win.trArgs(key, args, fallback)
        return (fallback !== undefined) ? fallback : key
    }
    function defaultPlayerName(index) { return trArgsLocal("player_numbered", [index], "Player " + index) }

    function isDefaultName(name, index) {
        if (Helpers.isDefaultName(name, index)) return true
        return name === defaultPlayerName(index)
    }
    function refreshDefaultNames() {
        for (let i = 0; i < players.count; ++i) {
            const existing = players.get(i).name
            if (!existing || isDefaultName(existing, i + 1)) {
                players.setProperty(i, "name", defaultPlayerName(i + 1))
            }
        }
    }

    // ==== toast ====
    function showToast(color, text, ms) { toast.accentColor = color; toast.show(text, ms || 5000) }

    function colorForOrdinal(n) { return Helpers.colorForOrdinal(n) }
    function normalizeColors() { for (let i = 0; i < players.count; ++i) players.setProperty(i, "color", colorForOrdinal(i + 1)) }

    // ==== reset & back ====
    function resetScores() { for (let i = 0; i < players.count; i++) players.setProperty(i, "score", 0); _recalcTotal(); page.syncScoreToBackend() }
    function resetMatchAndState() {
        // Reset về 3 người chơi mặc định
        players.clear()
        for (let i = 0; i < 3; ++i) {
            players.append({ name: defaultPlayerName(i + 1), score: 0, color: colorForOrdinal(i + 1) })
        }
        renameTarget = -1; pendingAction = ""; pendingDeleteIndex = -1
        page._agg = ({})
        _recalcTotal()
        persistHistory()
        page.syncScoreToBackend()
    }
    function handleBackRequested() {
        page.pendingAction = "leavePage"
        confirmDlg.destructive = true
        confirmDlg.openWith(trLocal("confirm_leave_match_message"),
                            trLocal("confirm_leave_match_title"),
                            trLocal("confirm_leave_match_confirm"),
                            trLocal("common_cancel"))
    }

    // ==== idle timer ====
    readonly property int idleMs: 40 * 60 * 1000  // 40 phút
    Timer {
        id: inactivityTimer
        interval: page.idleMs
        repeat: false
        running: page.pageActive
        onTriggered: {
            console.log("[MultiQuickAddPage] inactivityTimer triggered! Returning to home. idleMs:", page.idleMs)
            page._flushAgg(true)
            resetMatchAndState(); persistHistory()
            win.backTo(page.backTo || "home")
        }
    }
    function bumpActivity() {
        console.log("[MultiQuickAddPage] bumpActivity called, restarting inactivityTimer")
        inactivityTimer.restart()
    }

    focus: true
    Keys.onPressed:  bumpActivity()
    Keys.onReleased: bumpActivity()
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        propagateComposedEvents: true
        preventStealing: false
        onPressed:  (m)=>{ page.bumpActivity(); m.accepted=false }
        onReleased: (m)=>{ page.bumpActivity(); m.accepted=false }
        onWheel:    (w)=>{ page.bumpActivity(); w.accepted=false }
    }

    // ==== match timer ====
    property int  matchElapsedSec: 0
    property bool matchTimerRunning: true
    function startMatchTimer() { matchTimerRunning = true }
    function pauseMatchTimer() { matchTimerRunning = false }
    function resetMatchTimer() { matchElapsedSec = 0 }
    function fmtTime(sec) { return Helpers.formatTime(sec) }
    Timer { id: matchTicker; interval: 1000; repeat: true; running: page.matchTimerRunning; onTriggered: page.matchElapsedSec += 1 }
    Component.onCompleted: {
        console.log("[MultiQuickAddPage] Component.onCompleted. idleMs:", page.idleMs, "timer interval:", inactivityTimer.interval, "timer running:", inactivityTimer.running)
        startMatchTimer()
        restoreHistory()
        Qt.callLater(syncScoreToBackend)
    }

    // ==== players ====
    ListModel {
        id: players
        ListElement { name: ""; score: 0; color: "#ffcd00" }
        ListElement { name: ""; score: 0; color: "#da251d" }
        ListElement { name: ""; score: 0; color: "#3B82F6" }
        Component.onCompleted: page.refreshDefaultNames()
    }
    Connections { target: (typeof win !== "undefined" && win) ? win : null
        function onCurrentLanguageCodeChanged() { page.refreshDefaultNames() }
    }

    Connections {
        target: typeof MqttService !== "undefined" && MqttService ? MqttService : null
        ignoreUnknownSignals: true
        function onPlayersUpdated(playersJson) {
            console.log("[RemoteControl] MultiQuickAddPage received player updates")
            var arr = JSON.parse(playersJson)
            for (var i = 0; i < arr.length; ++i) {
                if (i < players.count) {
                    var p = arr[i]
                    if (p.name !== undefined) players.setProperty(i, "name", p.name)
                    if (p.score !== undefined) players.setProperty(i, "score", p.score)
                }
            }
            page.syncScoreToBackend()
        }
        function onResetScoresRequested() {
            console.log("[RemoteControl] MultiQuickAddPage received resetScoresRequested")
            page.resetScores()
        }
        function onResetMatchRequested() {
            console.log("[RemoteControl] MultiQuickAddPage received resetMatchRequested")
            page.resetMatchAndState()
        }
    }

    // ==== GOM LỊCH SỬ (dồn sau 7–10s) ====
    property var _agg: ({})   // map: index -> { delta: number, lastTs: ms }

    Timer {
        id: aggFlusher
        interval: 1000
        repeat: true
        running: true
        onTriggered: page._flushAgg(false)
    }
    function _flushAgg(force) {
        const now = Date.now()
        for (const k in page._agg) {
            const i = Number(k)
            const e = page._agg[k]
            if (!e || !Number.isInteger(i)) continue
            const shouldFlush = force ? e.delta !== 0 : (e.delta !== 0 && (now - e.lastTs) >= 7000)
            if (shouldFlush) {
                const modelEntry = players.get(i)
                const name = (modelEntry && modelEntry.name && modelEntry.name.length)
                        ? modelEntry.name
                        : defaultPlayerName(i + 1)
                const deltaStr = (e.delta >= 0 ? "+" : "") + e.delta
                const scoreNow = modelEntry ? Number(modelEntry.score) || 0 : 0
                page.logAction(historyWithScore(trArgsLocal("log_point_delta", [deltaStr, name],
                                           deltaStr + " điểm cho “" + name + "”"), scoreNow))
                e.delta = 0
                e.lastTs = now
            }
        }
        persistHistory()
    }
    Component.onDestruction: prepareForLeave()

    // ==== CONTROL PANEL ====
    ControlPanel {
        id: panel
        anchors.right: parent.right
        anchors.rightMargin: Math.round(20 * win.uiScale)
        anchors.top: parent.top
        anchors.topMargin: Math.round(96 * win.uiScale)

        useFixedSize: true

        readonly property int actionW:    Math.round(160 * win.uiScale)
        readonly property int actionH:    Math.round(100 * win.uiScale)
        readonly property int actionIcon: Math.round(40  * win.uiScale)
        readonly property int actionFont: Math.round(18  * win.uiScale)
        readonly property int rowGap:     Math.round(40  * win.uiScale)

        panelPadding: Math.round(16 * win.uiScale)
        panelRadius:  Math.round(16 * win.uiScale)
        gap:          Math.round(12 * win.uiScale)

        panelWidth:  Math.round(actionW*3 + rowGap*2 + 2*panelPadding)
        panelHeight: Math.round(800 * win.uiScale)

        bgColor: "#172339"; borderColor: "#172339"
        headerText: DeviceSettings.tableName ? DeviceSettings.tableName.toUpperCase() : trLocal("score_header_table3")
        headerHeight: 48 * win.uiScale
        headerFontPx: 32 * win.uiScale
        headerStripColor: "#60DB80"
        headerStripWidth: 420 * win.uiScale
        headerBottomRadius: 14 * win.uiScale
        contentTopMargin: 10 * win.uiScale
        sectionGap: 10 * win.uiScale

        // Hàng 1
        ListModel { id: row1
            ListElement { labelKey: "menu_reset_score"; icon: "../../assets/icon/clock-reset-25.svg"; key: "resetScore" }
            ListElement { labelKey: "menu_reset_match"; icon: "../../assets/icon/reset2.svg";        key: "resetMatch" }
            ListElement { labelKey: "menu_change_mode"; icon: "../../assets/icon/circle_reload_outline.svg"; key: "toggleRace" }
        }
        Row {
            id: r1; anchors.horizontalCenter: parent.horizontalCenter; spacing: panel.rowGap
            Repeater {
                model: row1
                ControlButton {
                    btnWidth: panel.actionW; btnHeight: panel.actionH
                    radius: panel.panelRadius; padding: panel.panelPadding; gap: panel.gap
                    iconSize: panel.actionIcon; fontPx: panel.actionFont
                    bg: panel.actionBg; fg: panel.actionFg
                    shadowColor: panel.actionShadowColor; shadowBlur: panel.actionShadowBlur; shadowOffsetY: panel.actionShadowOffsetY
                    onClicked: { panel.bumpButtons(); page.bumpActivity(); page.handleAction(model.key) }
                    iconSource: model.icon; label: trLocal(model.labelKey || "")
                }
            }
        }

        // Hàng 2
        ListModel { id: row2
            ListElement { labelKey: "menu_guide"; icon: "../../assets/icon/info_outline.svg"; key: "guide" }
            ListElement { labelKey: "menu_history"; icon: "../../assets/icon/History.svg";       key: "history" }
            ListElement { labelKey: "menu_replay";  icon: "../../assets/icon/video_outline.svg"; key: "replay" }
        }
        Row {
            id: r2; anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: r1.bottom; anchors.topMargin: 20 * win.uiScale
            spacing: panel.rowGap
            Repeater {
                model: row2
                ControlButton {
                    btnWidth: panel.actionW; btnHeight: panel.actionH
                    radius: panel.panelRadius; padding: panel.panelPadding; gap: panel.gap
                    iconSize: panel.actionIcon; fontPx: panel.actionFont
                    bg: panel.actionBg; fg: panel.actionFg
                    shadowColor: panel.actionShadowColor; shadowBlur: panel.actionShadowBlur; shadowOffsetY: panel.actionShadowOffsetY
                    onClicked: { panel.bumpButtons(); page.bumpActivity(); page.handleAction(model.key) }
                    iconSource: model.icon; label: trLocal(model.labelKey || "")
                }
            }
        }

        // Hàng 3
        ListModel { id: row3
            ListElement { labelKey: "menu_show_menu";          icon: "../../assets/icon/order_outline.svg";          key: "menu" }
            ListElement { labelKey: "menu_view_bill";          icon: "../../assets/icon/bill_outline.svg";           key: "bill" }
            ListElement { labelKey: "menu_promo";              icon: "../../assets/icon/promo_outline.svg";          key: "promo" }
        }
        Row {
            id: r3; anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: r2.bottom; anchors.topMargin: 20 * win.uiScale
            spacing: panel.rowGap
            Repeater {
                model: row3
                ControlButton {
                    btnWidth: panel.actionW; btnHeight: panel.actionH
                    radius: panel.panelRadius; padding: panel.panelPadding; gap: panel.gap
                    iconSize: panel.actionIcon; fontPx: panel.actionFont
                    bg: panel.actionBg; fg: panel.actionFg
                    shadowColor: panel.actionShadowColor; shadowBlur: panel.actionShadowBlur; shadowOffsetY: panel.actionShadowOffsetY
                    onClicked: { panel.bumpButtons(); page.bumpActivity(); page.handleAction(model.key) }
                    iconSource: model.icon; label: trLocal(model.labelKey || "")
                }
            }
        }

        // ====== KHUNG 16:9 VỚI VIDEO ======
        frameVisible: true
        frameTopGap: Math.round(50 * win.uiScale)
        frameStroke: "white"
        frameStrokeW: Math.max(2, Math.round(3 * win.uiScale))
        frameRadius: Math.round(14 * win.uiScale)
        framePadding: Math.round(4 * win.uiScale)
        frameWidth: Math.round(actionW*3 + rowGap*2)
        frameBottomMargin: Math.round(10 * win.uiScale)

        // Camera video stream
        videoStreamUrl: win.cameraStreamUrl
        videoAutoPlay: page.pageActive && !page.replayOpened
        videoMuted: true

        // Idle banner
        bannerImages: page.promoImages
        fallbackBanner: "../../assets/banner.png"

        onVideoClicked: {
            page.bumpActivity()
            videoZoomDlg.open()
        }
    }

    VideoZoomDialog {
        id: videoZoomDlg
        cameraSource: panel.cameraVideo
        onReplayRequested: page.openReplay()
    }

    // ==== CỤM CARD ====
    Item {
        id: cardsWrap
        anchors.left: parent.left
        anchors.leftMargin: Math.round(20 * win.uiScale)
        anchors.right: panel.left
        anchors.rightMargin: Math.round(20 * win.uiScale)
        anchors.top: panel.top
        anchors.bottom: panel.bottom

        property int edgePad: Math.max(3, Math.round(4 * win.uiScale))
        clip: true
        layer.enabled: true
        layer.samples: 4

        readonly property int   count: players.count
        readonly property int   minGap: Math.round(12 * win.uiScale)
        readonly property int   available: Math.max(0, height - edgePad * 2 - minGap * Math.max(0, count - 1))
        readonly property int   baseH: (count > 0) ? Math.floor(available / count) : 0
        readonly property int   lastH: (count > 0) ? (available - baseH * (count - 1)) : 0

        Column {
            id: col
            anchors.fill: parent
            anchors.topMargin: cardsWrap.edgePad
            anchors.bottomMargin: cardsWrap.edgePad
            spacing: cardsWrap.minGap
            clip: true

            Repeater {
                id: tilesRep
                model: players
                MultiScoreTile {
                    id: tile
                    width:  cardsWrap.width
                    height: (index === cardsWrap.count - 1)
                              ? Math.max(120 * win.uiScale, cardsWrap.lastH)
                              : Math.max(120 * win.uiScale, cardsWrap.baseH)

                    nameText:  (model.name && model.name.length) ? model.name : defaultPlayerName(index + 1)
                    score:     model.score
                    cardColor: model.color
                    showActions: false
                    contentScale: players.count <= 3 ? 1.15 : (players.count >= 5 ? 0.85 : 1.0)
                    nameMaxWidth: Math.max(0, width - Math.round(660 * win.uiScale))

                    // Hide default score - we display it centered between buttons below
                    Component.onCompleted: scoreItem.visible = false

                    // ===== NÚT TĂNG + (không bị tint) =====
                    Button {
                        id: btnPlus
                        display: AbstractButton.IconOnly
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.right: parent.right
                        anchors.rightMargin: Math.round(20 * win.uiScale)
                        width:  Math.round(83 * win.uiScale)
                        height: Math.round(83 * win.uiScale)
                        text: ""
                        background: Rectangle {
                            color: "white"
                            radius: Math.round(16 * win.uiScale)
                            border.color: "#CBD5E1"
                            border.width: Math.max(1, Math.round(1 * win.uiScale))
                        }
                        contentItem: Image {
                            anchors.centerIn: parent
                            source: "../../assets/icon/plus-svgrepo-com.svg"
                            sourceSize.width:  Math.round(btnPlus.width  * 0.55)
                            sourceSize.height: Math.round(btnPlus.height * 0.55)
                            fillMode: Image.PreserveAspectFit
                            smooth: true
                            mipmap: true
                        }

                        // giữ 1s mới auto-repeat
                        onPressed:  { page.applyDelta(index, +1); pressDelayPlus.restart() }
                        onReleased: { pressDelayPlus.stop(); plusHold.stop() }
                        onCanceled: { pressDelayPlus.stop(); plusHold.stop() }

                        Timer { id: pressDelayPlus; interval: 500; repeat: false; running: false; onTriggered: plusHold.start() }
                        Timer { id: plusHold;       interval: 120;  repeat: true;  running: false; onTriggered: page.applyDelta(index, +1) }
                    }

                    // ===== NÚT GIẢM - (không bị tint) =====
                    Button {
                        id: btnMinus
                        display: AbstractButton.IconOnly
                        anchors.verticalCenter: btnPlus.verticalCenter
                        anchors.right: btnPlus.left
                        // chừa khoảng rộng cố định cho 3 chữ số ở giữa
                        anchors.rightMargin: Math.round(320 * win.uiScale)
                        width:  Math.round(83 * win.uiScale)
                        height: Math.round(83 * win.uiScale)
                        text: ""
                        background: Rectangle {
                            color: "white"
                            radius: Math.round(16 * win.uiScale)
                            border.color: "#003f8cff"
                            border.width: Math.max(1, Math.round(1 * win.uiScale))
                        }
                        contentItem: Image {
                            anchors.centerIn: parent
                            source: "../../assets/icon/minus-svgrepo-com.svg"
                            sourceSize.width:  Math.round(btnMinus.width  * 0.55)
                            sourceSize.height: Math.round(btnMinus.height * 0.55)
                            fillMode: Image.PreserveAspectFit
                            smooth: true
                            mipmap: true
                        }

                        // giữ 1s mới auto-repeat
                        onPressed:  { page.applyDelta(index, -1); pressDelayMinus.restart() }
                        onReleased: { pressDelayMinus.stop(); minusHold.stop() }
                        onCanceled: { pressDelayMinus.stop(); minusHold.stop() }

                        Timer { id: pressDelayMinus; interval: 500; repeat: false; running: false; onTriggered: minusHold.start() }
                        Timer { id: minusHold;       interval: 120;  repeat: true;  running: false; onTriggered: page.applyDelta(index, -1) }
                    }

                    // ===== ĐIỂM CĂN GIỮA 2 NÚT =====
                    Item {
                        id: scoreCenterZone
                        anchors.left: btnMinus.right
                        anchors.right: btnPlus.left
                        anchors.verticalCenter: parent.verticalCenter
                        height: parent.height

                        AppText {
                            anchors.centerIn: parent
                            text: String(model.score)
                            color: "white"
                            font.bold: true
                            font.pixelSize: Math.round(140 * win.uiScale)
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                            renderType: Text.NativeRendering
                            font.hintingPreference: Font.PreferFullHinting
                        }
                    }

                    // ===== Hành động rename / delete =====
                    onEditTitleRequested: {
                        page.bumpActivity()
                        const i = index
                        page.renameTarget = i
                        const currentFromModel = (i >= 0 && i < players.count)
                              ? (players.get(i).name || defaultPlayerName(i + 1)) : defaultPlayerName(i + 1)
                        renameDlg.openFor(i, currentFromModel)
                    }
                    onDeleteRequested: {
                        page.bumpActivity()
                        const i = index
                        if (players.count <= page.minPlayers) {
                            return
                        }
                        const pname = (i >= 0 && i < players.count)
                              ? (players.get(i).name || defaultPlayerName(i + 1))
                              : defaultPlayerName(i + 1)
                        page.pendingDeleteIndex = i
                        page.pendingAction = "deletePlayer"
                        confirmDlg.destructive = true
                        confirmDlg.openWith(
                            trArgsLocal("confirm_delete_player_message", [pname], "Xóa?"),
                            trLocal("confirm_delete_player_title"),
                            trLocal("confirm_delete_player_confirm"),
                            trLocal("common_cancel"))
                    }
                }
            }

            Item { width: 1; height: 0 }
        }
    }

    // ==== TIME ====
    AppText {
        id: matchClock
        text: page.fmtTime(page.matchElapsedSec)
        color: "#E53935"
        font.pixelSize: Math.round(42 * win.uiScale)
        font.bold: true
        anchors.horizontalCenter: panel.horizontalCenter
        anchors.bottom: panel.top
        anchors.bottomMargin: Math.round(5 * win.uiScale)
    }

    // ==== TOP ACTIONS ====
    TopActionBar {
        id: topActions
        anchors.verticalCenter: matchClock.verticalCenter
        anchors.left: cardsWrap.left
        anchors.leftMargin: Math.round(50 * win.uiScale)
        uiScale: win.uiScale
        addPlayerEnabled: players.count < maxPlayers
        matchClockPx: Math.round(48 * win.uiScale)
        showChangePoints: false
        showSettings: false

        onAddPlayerRequested: {
            const n = players.count + 1
            if (n <= maxPlayers) {
                players.append({ name: defaultPlayerName(n), score: 0, color: colorForOrdinal(n) })
                const addedName = defaultPlayerName(n)
                page.syncScoreToBackend()
            }
        }
    }

    // ==== TỔNG ĐIỂM ====
    property int _totalScore: 0
    function _recalcTotal() {
        var total = 0
        for (var i = 0; i < players.count; i++)
            total += players.get(i).score
        _totalScore = total
    }

    AppText {
        id: totalScoreLabel
        anchors.left: topActions.right
        anchors.leftMargin: Math.round(30 * win.uiScale)
        anchors.verticalCenter: topActions.verticalCenter
        text: "Tổng điểm: " + page._totalScore
        color: page._totalScore !== 0 ? "#E53935" : "#172339"
        font.pixelSize: Math.round(32 * win.uiScale)
        font.bold: true
    }

    // ==== xử lý nút panel ====
    function handleAction(key) {
        page.bumpActivity()
        switch (key) {
        case "resetScore":
            pendingAction = "resetScore"
            confirmDlg.destructive = true
            confirmDlg.openWith(trLocal("confirm_reset_score_message"),
                                trLocal("confirm_reset_score_title"),
                                trLocal("common_confirm"),
                                trLocal("common_cancel"))
            break
        case "resetMatch":
            pendingAction = "resetMatch"
            confirmDlg.destructive = true
            confirmDlg.openWith(trLocal("confirm_reset_match_message"),
                                trLocal("confirm_reset_match_title"),
                                trLocal("common_confirm"),
                                trLocal("common_cancel"))
            break
        case "toggleRace": modeDlg.openWith(page.mode); break
        case "history": historyDlg.open(); break
        case "guide": guideDlg.open(); break
        case "replay":  openReplay(); break
        case "menu":    menuDlg.openWith(); break
        case "bill":
            if (typeof OrdersService !== "undefined" && OrdersService && typeof OrdersService.fetchOrders === "function")
                OrdersService.fetchOrders()
            billDlg.open()
            break
        case "pay":     break
        case "promo":   promoDlg.open(); break
        }
    }

    // ==== PROMO ====
    property var promoImages: {
        if (typeof BannerService !== "undefined" && BannerService && typeof BannerService.get_cached_banners === "function") {
            var cached = BannerService.get_cached_banners("scoreboard")
            if (cached && cached.length > 0) return cached
        }
        return []
    }
    PromoDialog {
        id: promoDlg
        fixedW: Math.round(900 * win.uiScale); minW: Math.round(750 * win.uiScale)
        sideMargin: dlgSide
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        promoImages: page.promoImages
    }
    Connections {
        target: BannerService
        function onBannersLoaded(bannerType, urls) {
            if (bannerType === "scoreboard") page.promoImages = urls
        }
    }

    // ==== ÁP ĐIỂM NHANH + GOM LỊCH SỬ ====
    function applyDelta(i, inc) {
        page.bumpActivity()
        const idx = Number(i)
        const delta = Number(inc)
        if (!Number.isInteger(idx) || idx < 0 || idx >= players.count) return
        if (!Number.isFinite(delta) || delta === 0) return

        const cur  = Number(players.get(idx).score) || 0
        const next = cur + delta
        players.setProperty(idx, "score", next)
        page._recalcTotal()
        page.syncScoreToBackend()

        // dồn lịch sử: cộng dồn và cập nhật mốc thời gian cuối
        if (!page._agg[idx]) page._agg[idx] = { delta: 0, lastTs: 0 }
        page._agg[idx].delta  += delta
        page._agg[idx].lastTs  = Date.now()

        // đảm bảo timer đang chạy
        if (!aggFlusher.running) aggFlusher.start()
    }

    // ==== RENAME DIALOG ====
    RenameDialog {
        id: renameDlg
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle
        labelFontSize: dlgText; inputFontSize: dlgText; placeholderFontSize: dlgText; inputHeight: Math.round(56 * win.uiScale)
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        onAccepted: (newName) => {
            const idx  = page.renameTarget
            const name = (newName || "").trim()
            if (!Number.isInteger(idx) || idx < 0 || idx >= players.count) { page.pendingAction = ""; return }
            const old = players.get(idx).name
            players.setProperty(idx, "name", name)
            page.syncScoreToBackend()
            const label = trArgsLocal("player_numbered", [idx + 1], "Player " + (idx + 1))
            page.logAction(trArgsLocal("log_rename_player_from_to", [label, old || "", name], label + " đổi tên thành \"" + name + "\""))
            page.pendingAction = ""
        }
        onCancelled: page.pendingAction = ""
    }

    // ==== CONFIRM + HISTORY ====
    ConfirmDialog {
        id: confirmDlg
        titleText: trLocal("dialog_default_title")
        message: trLocal("confirm_generic_message")
        confirmText: trLocal("common_confirm"); cancelText: trLocal("common_cancel")
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        onConfirmed: {
            page.bumpActivity()
            if (page.pendingAction === "resetScore") {
                resetScores(); page.logAction(trLocal("log_reset_score"))
            } else if (page.pendingAction === "resetMatch") {
                resetMatchAndState(); resetMatchTimer(); startMatchTimer()
                page.logAction(trLocal("log_reset_match"))
            } else if (page.pendingAction === "leavePage") {
                prepareForLeave()
                win.backTo(page.backTo || "home"); return
            } else if (page.pendingAction === "deletePlayer") {
                const i = page.pendingDeleteIndex
                if (Number.isInteger(i) && i >= 0 && i < players.count) {
                    const removedName = players.get(i).name
                    players.remove(i); normalizeColors(); refreshDefaultNames(); delete page._agg[i]; page._recalcTotal()
                    if (page.renameTarget === i) page.renameTarget = -1
                    if (page.renameTarget > i)  page.renameTarget -= 1
                    const displayName = removedName || defaultPlayerName(i + 1)
                    page.logAction(trArgsLocal("log_delete_player", [displayName], "Xóa người chơi \"" + displayName + "\""))
                    page.syncScoreToBackend()
                }
                page.pendingDeleteIndex = -1
            }
            page.pendingAction = ""
        }
        onCancelled: { page.pendingAction = ""; page.pendingDeleteIndex = -1 }
    }

    GuideDialog {
        id: guideDlg
        pageType: "multiQuick"
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide
        titleFontSize: dlgTitle; contentFontSize: dlgText
    }

    HistoryDialog {
        id: historyDlg
        model: actionHistory
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        onResetRequested: {
            actionHistory.clear()
            page._agg = ({})
            if (typeof win !== "undefined" && win && typeof win.clearHistory === "function")
                win.clearHistory(historyKey())
            persistHistory()
        }
    }

    BillDialog {
        id: billDlg
        orders: (typeof OrdersService !== "undefined" && OrdersService) ? OrdersService.orders : []
        loading: (typeof OrdersService !== "undefined" && OrdersService) ? OrdersService.loading : false
        errorText: (typeof OrdersService !== "undefined" && OrdersService) ? OrdersService.error : ""
        tableId: (typeof DeviceSettings !== "undefined" && DeviceSettings) ? DeviceSettings.tableId : 0
        areaId: (typeof DeviceSettings !== "undefined" && DeviceSettings) ? DeviceSettings.areaId : 0
        tableName: (typeof DeviceSettings !== "undefined" && DeviceSettings) ? DeviceSettings.tableName : ""
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont

        onPaymentRequested: page.handleAction("pay")
    }


    MenuDialog { id: menuDlg }

    ModeSelectDialog {
        id: modeDlg
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont

        onSelectTwo: {
            if (page.mode === "two") return
            prepareForLeave()
            win.pushPage("pages/ScorePage.qml", { routeName: "score2p", backTo: page.backTo || "home", mode: "two" })
        }
        onSelectMulti: {
            if (page.mode === "multi") return
            prepareForLeave()
            win.pushPage("pages/MultiScorePage.qml", { routeName: "multiScore", backTo: page.backTo || "home", mode: "multi" })
        }
        onSelectCards: {
            if (page.mode === "cards") return
            prepareForLeave()
            win.pushPage("pages/MultiCardScorePage.qml", { routeName: "multiCardScore", backTo: page.backTo || "home", mode: "cards" })
        }
        onSelectMultiQuick: {
            if (page.mode === "multiQuick") return
            prepareForLeave()
            win.pushPage("pages/MultiQuickAddPage.qml", { routeName: "QuickScore", backTo: page.backTo || "home", mode: "multiQuick" })
        }
        onModeSelected: function(selectedMode) {
            page.mode = selectedMode
            page.logAction(trArgsLocal("log_switch_mode", [selectedMode], "Đổi chế độ"))
        }
    }

    // ==== ĐỒNG HỒ ====
    ClockLabel {
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.rightMargin: Math.round(30 * win.uiScale)
        anchors.bottomMargin: Math.round(22 * win.uiScale)
    }
}

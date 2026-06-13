// qml/pages/TournamentPage.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6

import "../components"
import "../pages/ActionLogger.js" as Logger

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
    property string routeName: "tournamentPage"
    property string backTo: "home"
    property string renameTarget: ""
    property string pendingAction: ""
    property string mode: "two"   

    // Player name properties — synced from Controller via Connections
    // (PySide6 property bindings via `property x: Controller.y` can miss signals during creation)
    property string pLeftName: ""
    property string pRightName: ""

    Connections {
        target: Controller
        function onLeftNameChanged(name) {
            page.pLeftName = name || ""
        }
        function onRightNameChanged(name) {
            page.pRightName = name || ""
        }
    }

    property int leftMinScore: 0
    property int rightMinScore: 0

    function updateMatchRules(m) {
        if (!m) return;
        const RANK_ORDER = ['I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];
        const r1 = m.player1_rank ? RANK_ORDER.indexOf(m.player1_rank.toUpperCase()) : -1;
        const r2 = m.player2_rank ? RANK_ORDER.indexOf(m.player2_rank.toUpperCase()) : -1;

        let hc = 0;
        let hcP1 = false;
        let hcP2 = false;
        let diff = 0;

        if (r1 >= 0 && r2 >= 0) {
            diff = Math.abs(r1 - r2);
            hc = diff === 0 ? 0 : (diff === 1 ? 1 : 2);
            if (r1 < r2) hcP1 = true;
            else if (r2 < r1) hcP2 = true;
        }

        // Round-specific override (semi-final / final / quarter-final) — no handicap applied.
        if (m.effective_race_to && parseInt(m.effective_race_to)) {
            const rt = parseInt(m.effective_race_to);
            page.leftMinScore = 0;
            page.rightMinScore = 0;
            Controller.raceTo = rt;
            page.matchHandicapText = "Chạm " + rt;
            return;
        }

        page.leftMinScore = hcP1 ? hc : 0;
        page.rightMinScore = hcP2 ? hc : 0;

        // Base race_to: draw_touch (equal-rank target) is the primary source of truth.
        // handicap_N_touch overrides it when a specific value is configured for that bracket.
        // Falls back to race_to (legacy), then 9.
        const baseTouchVal = parseInt(m.draw_touch) || parseInt(m.race_to) || 9;
        let raceToVal = baseTouchVal;
        if (diff === 1 && m.handicap_1_touch && parseInt(m.handicap_1_touch)) raceToVal = parseInt(m.handicap_1_touch);
        else if (diff >= 2 && m.handicap_2_touch && parseInt(m.handicap_2_touch)) raceToVal = parseInt(m.handicap_2_touch);

        Controller.raceTo = raceToVal;

        if (hc === 0) {
            page.matchHandicapText = "Chạm " + raceToVal;
        } else {
            page.matchHandicapText = "Chạm " + raceToVal + " chấp " + hc;
        }
    }

    // ==== cấu hình dialog gom gọn ====
    readonly property int dlgW:      Math.round(680 * win.uiScale)
    readonly property int dlgMin:    Math.round(550 * win.uiScale)
    readonly property int dlgSide:   Math.round(20  * win.uiScale)
    readonly property int dlgKb:     Math.round(16  * win.uiScale)
    readonly property int dlgTitle:  Math.round(32  * win.uiScale)
    readonly property int dlgText:   Math.round(24  * win.uiScale)

    // ==== nút dialog (đồng bộ giữa mọi dialog) ====
    readonly property int btnH:      Math.round(72 * win.uiScale)
    readonly property int btnMinW:   Math.round(180 * win.uiScale)
    readonly property int btnFont:   dlgText
    readonly property real contentTopOffset: Math.round(60 * win.uiScale)

    // ==== log lịch sử (ngắn gọn) ====
    ListModel { id: actionHistory }
    readonly property int historyLimit: 100
    function historyKey() { return page.routeName || "tournamentPage" }
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

    // ==== toast ====

    function showToast(color, text, ms) {
        toast.accentColor = color
        toast.show(text, ms || 5000)
    }

    function historyCurrentScoreLine(score) {
        return trArgsLocal("add_points_current_score", [score], "Điểm hiện tại: " + score)
    }

    function historyWithScore(baseText, score) {
        return baseText + " — " + historyCurrentScoreLine(score)
    }

    function prepareForLeave() {
        resetMatchAndState()
        try { Controller.setNames("", "") } catch (e) {}
        resetMatchTimer()
        startMatchTimer()
        persistHistory()
    }

    function resetScores() {
        try { 
            Controller.leftScore = page.leftMinScore; 
            Controller.rightScore = page.rightMinScore;
        }
        catch(e) { Controller.leftScore = page.leftMinScore; Controller.rightScore = page.rightMinScore }
    }

    // ==== RESET TOÀN TRẬN & TRẠNG THÁI TRANG ====
    function resetMatchAndState() {
        try {
            // NOTE: Do NOT reset Controller.leftName/rightName here!
            // In tournament mode, names are managed by the API (TournamentService).
            // Setting them to "" causes Python to default to "Player A"/"Player B"
            // which briefly flashes before the API re-populates the real names.
            Controller.leftScore = page.leftMinScore; 
            Controller.rightScore = page.rightMinScore;
        } catch(e) {
            Controller.leftScore = page.leftMinScore; Controller.rightScore = page.rightMinScore
        }
        renameTarget = ""
        pendingAction = ""
        persistHistory()
    }

    // ==== HÀM BẮT SỰ KIỆN BACK TỪ TOPBAR ====
    function handleBackRequested() {
        page.pendingAction = "leavePage"
        confirmDlg.destructive = true
        confirmDlg.openWith(
            trLocal("confirm_leave_match_message"),
            trLocal("confirm_leave_match_title"),
            trLocal("confirm_leave_match_confirm"),
            trLocal("common_cancel")
        )
    }

    // ==== TOURNAMENT MODE: KHÔNG tự thoát khi không thao tác ====
    // Trong giải đấu, trang phải luôn hiển thị dù không tương tác.
    // Không cần auto-exit hay banner.
    function bumpActivity() { panel.bumpButtons() }

    focus: true
    Keys.onPressed:  bumpActivity()
    Keys.onReleased: bumpActivity()

    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        propagateComposedEvents: true
        preventStealing: false
        onPressed:  function(mouse) { page.bumpActivity(); mouse.accepted = false }
        onReleased: function(mouse) { page.bumpActivity(); mouse.accepted = false }
        onWheel:    function(wheel) { page.bumpActivity(); wheel.accepted = false }
    }

    // ==== MATCH TIMER (đồng hồ trận) ====
    property int  matchElapsedSec: 0
    property bool matchTimerRunning: false

    function startMatchTimer()   { matchTimerRunning = true }
    function pauseMatchTimer()   { matchTimerRunning = false }
    function resetMatchTimer()   { matchElapsedSec = 0 }
    function fmtTime(sec) {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        function pad(n){ return (n < 10 ? "0" : "") + n }
        return pad(h) + ":" + pad(m) + ":" + pad(s)
    }

    function trLocal(key) {
        return (typeof win !== "undefined" && win && typeof win.tr === "function") ? win.tr(key) : key
    }

    function trArgsLocal(key, args, fallback) {
        if (typeof win !== "undefined" && win && typeof win.trArgs === "function")
            return win.trArgs(key, args, fallback)
        return (fallback !== undefined) ? fallback : key
    }

    function defaultLeftName() {
        return page.pLeftName || trLocal("player_left_default")
    }

    function defaultRightName() {
        return page.pRightName || trLocal("player_right_default")
    }

    function formatPlayerName(name, rank) {
        if (!name) return ""
        if (rank) return name + " (" + rank + ")"
        return name
    }

    Timer {
        id: matchTicker
        interval: 1000
        repeat: true
        running: page.matchTimerRunning
        onTriggered: page.matchElapsedSec += 1
    }

    Component.onCompleted: {
        restoreHistory()
        if (typeof TournamentService !== "undefined") {
            TournamentService.startAutoRefresh()
            
            var m = TournamentService.activeMatch
            if (m && m.match_id) {
                var p1Name = page.formatPlayerName(m.player1_name, m.player1_rank)
                var p2Name = page.formatPlayerName(m.player2_name, m.player2_rank)
                console.log("[TournamentPage] onCompleted p1Name:", p1Name, "p2Name:", p2Name, "m:", JSON.stringify(m))
                
                console.log("[TournamentPage] Set names via Controller.setNames")
                Controller.setNames(p1Name || defaultLeftName(), p2Name || defaultRightName())

                // Explicit sync — ensure QML properties reflect Controller state
                page.pLeftName = Controller.leftName
                page.pRightName = Controller.rightName
                console.log("[TournamentPage] After explicit controller sync, pLeftName=", page.pLeftName, "pRightName=", page.pRightName)
                
                page.updateMatchRules(m)

                Controller.leftScore = Math.max(m.player1_score != null ? m.player1_score : 0, page.leftMinScore)
                Controller.rightScore = Math.max(m.player2_score != null ? m.player2_score : 0, page.rightMinScore)
                page._lastP1Id = m.player1_id || 0
                page._lastP2Id = m.player2_id || 0
                page.matchLoaded = true

                console.log("[TournamentPage] Initial scores set: left=" + Controller.leftScore +
                    " (min=" + page.leftMinScore + ") right=" + Controller.rightScore +
                    " (min=" + page.rightMinScore + ")")

                // Check if both players already confirmed via backend
                var p1CheckIn = m.player1_check_in || "unconfirmed"
                var p2CheckIn = m.player2_check_in || "unconfirmed"
                console.log("[TournamentPage] Check-in status: p1=" + p1CheckIn + " p2=" + p2CheckIn)

                if (p1CheckIn === "confirmed" && p2CheckIn === "confirmed") {
                    // Both already confirmed — skip dialog
                    page.matchJoined = true
                    page.startMatchTimer()
                    console.log("[TournamentPage] Both players already confirmed, skipping join dialog")
                } else if (!page.matchJoined) {
                    Qt.callLater(function() {
                        // Pre-populate confirmed status from backend
                        joinDlg.leftConfirmed = (p1CheckIn === "confirmed")
                        joinDlg.rightConfirmed = (p2CheckIn === "confirmed")
                        joinDlg.open()
                    })
                }
            } else {
                console.log("[TournamentPage] No active match ID on entry, kicking back to home")
                // Use callLater to avoid popping during completion
                Qt.callLater(function() {
                    if (win && typeof win.backTo === "function") win.backTo(page.backTo || "home")
                })
                return
            }
        } else {
            // No service
            Qt.callLater(function() {
                if (win && typeof win.backTo === "function") win.backTo(page.backTo || "home")
            })
        }
    }

    // ==== GET TOURNAMENT DATA ====
    property bool matchLoaded: false
    property bool matchJoined: false
    property string matchHandicapText: ""
    property bool isMatchFinished: Controller.leftScore >= Controller.raceTo || Controller.rightScore >= Controller.raceTo

    function syncScore(forceFinish) {
        if (!page.matchLoaded || typeof TournamentService === "undefined" || !TournamentService.activeMatch) return
        var m = TournamentService.activeMatch
        if (m && m.match_id) {
            var winner_id = 0
            if (forceFinish) {
                if (Controller.leftScore >= Controller.raceTo) winner_id = m.player1_id
                else if (Controller.rightScore >= Controller.raceTo) winner_id = m.player2_id
            }
            
            console.log("[TournamentPage] syncScore called: " + Controller.leftScore + " - " + Controller.rightScore + " forceFinish=" + !!forceFinish)
            TournamentService.updateScore(m.match_id, Controller.leftScore, Controller.rightScore, winner_id || 0)
        }
    }

    // Track current player IDs to detect player swaps/changes
    property int _lastP1Id: 0
    property int _lastP2Id: 0

    Connections {
        target: typeof TournamentService !== "undefined" ? TournamentService : null
        ignoreUnknownSignals: true
        function onMatchChanged() {
            var m = TournamentService.activeMatch
            if (!m || !m.match_id) return
            
            var p1Name = page.formatPlayerName(m.player1_name, m.player1_rank)
            var p2Name = page.formatPlayerName(m.player2_name, m.player2_rank)

            Controller.setNames(p1Name || defaultLeftName(), p2Name || defaultRightName())

            // Explicit sync
            page.pLeftName = Controller.leftName
            page.pRightName = Controller.rightName

            // Save old min scores before update
            var oldLeftMin = page.leftMinScore
            var oldRightMin = page.rightMinScore
            
            page.updateMatchRules(m)

            // Detect if players changed (backend swapped or replaced players).
            // Only trigger when we previously had a real assigned player (> 0).
            // This prevents a false positive when a player goes from TBD (null/0) to
            // an assigned ID, which would otherwise reset accumulated scores.
            var p1Id = m.player1_id || 0
            var p2Id = m.player2_id || 0
            // Only trigger when BOTH old AND new IDs are real (> 0) and different.
            // If server returns player1_id: null → p1Id = 0, that is NOT a player change.
            var playersChanged = page.matchLoaded &&
                (
                    (page._lastP1Id > 0 && p1Id > 0 && p1Id !== page._lastP1Id) ||
                    (page._lastP2Id > 0 && p2Id > 0 && p2Id !== page._lastP2Id)
                )

            if (playersChanged) {
                console.log("[TournamentPage] Players changed! Resetting scores with new handicap.",
                    "leftMin:", page.leftMinScore, "rightMin:", page.rightMinScore)
                Controller.leftScore = page.leftMinScore
                Controller.rightScore = page.rightMinScore
                page.syncScore()
            }

            page._lastP1Id = p1Id
            page._lastP2Id = p2Id

            if (!page.matchLoaded) {
                // First load: use backend scores, fallback to handicap min scores
                Controller.leftScore = Math.max(m.player1_score != null ? m.player1_score : 0, page.leftMinScore)
                Controller.rightScore = Math.max(m.player2_score != null ? m.player2_score : 0, page.rightMinScore)
                page._lastP1Id = p1Id
                page._lastP2Id = p2Id
                page.matchLoaded = true

                var p1ci = m.player1_check_in || "unconfirmed"
                var p2ci = m.player2_check_in || "unconfirmed"
                if (p1ci === "confirmed" && p2ci === "confirmed") {
                    page.matchJoined = true
                    page.startMatchTimer()
                } else if (!page.matchJoined) {
                    joinDlg.leftConfirmed = (p1ci === "confirmed")
                    joinDlg.rightConfirmed = (p2ci === "confirmed")
                    joinDlg.open()
                }
            }
        }
    }


    // ==== LEFT CARD ====
    ScoreTile {
        id: left
        width: 650 * win.uiScale; height: 850 * win.uiScale
        x: 30 * win.uiScale; y: contentTopOffset
        title: page.pLeftName || defaultLeftName()
        score: Controller.leftScore
        raceTo: Controller.raceTo
        bgColor: "#da251d"
        buttonPosition: "left"

        titleStripColor: "#172339"
        titleStripTextColor: "white"
        titleStripWidth: 420 * win.uiScale
        titleFontSize: 28 * win.uiScale
        editButtonSize: 24 * win.uiScale
        showEditButton: false
        scoreFontSizeMultiplier: 0.65

        onClicked: {
            page.bumpActivity()
            if (page.isMatchFinished) return
            const before = Controller.leftScore
            Controller.incLeft()
            const after = Controller.leftScore
            if (after !== before) {
                const n = defaultLeftName()
                const base = trArgsLocal("log_point_added_single", [n], "Cộng 1 điểm cho \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
                page.syncScore()
            }
        }
        onRightClicked: {
            page.bumpActivity()
            const before = Controller.leftScore
            if (before <= page.leftMinScore) return
            Controller.decLeft()
            const after = Controller.leftScore
            if (after !== before) {
                const n = defaultLeftName()
                const base = trArgsLocal("log_point_removed_single", [n], "Trừ 1 điểm của \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
                page.syncScore()
            }
        }
        onEditTitleRequested: { page.bumpActivity(); page.renameTarget = "left"; renameDlg.openFor("left", Controller.leftName) }
    }

    // ==== RIGHT CARD ====
    ScoreTile {
        id: right
        width: 650 * win.uiScale; height: 850 * win.uiScale
        x: 1240 * win.uiScale; y: contentTopOffset
        title: page.pRightName || defaultRightName()
        score: Controller.rightScore
        raceTo: Controller.raceTo
        bgColor: "#ffcd00"
        buttonPosition: "right"

        titleStripColor: "#172339"
        titleStripTextColor: "white"
        titleStripWidth: 420 * win.uiScale
        titleFontSize: 28 * win.uiScale
        editButtonSize: 24 * win.uiScale
        showEditButton: false
        scoreFontSizeMultiplier: 0.65

        onClicked: {
            page.bumpActivity()
            if (page.isMatchFinished) return
            const before = Controller.rightScore
            Controller.incRight()
            const after = Controller.rightScore
            if (after !== before) {
                const n = defaultRightName()
                const base = trArgsLocal("log_point_added_single", [n], "Cộng 1 điểm cho \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
                page.syncScore()
            }
        }
        onRightClicked: {
            page.bumpActivity()
            const before = Controller.rightScore
            if (before <= page.rightMinScore) return
            Controller.decRight()
            const after = Controller.rightScore
            if (after !== before) {
                const n = defaultRightName()
                const base = trArgsLocal("log_point_removed_single", [n], "Trừ 1 điểm của \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
                page.syncScore()
            }
        }
        onEditTitleRequested: { page.bumpActivity(); page.renameTarget = "right"; renameDlg.openFor("right", Controller.rightName) }
    }

    // ==== CENTER PANEL ====
    ControlPanel {
        id: panel
        anchors.left: left.right; anchors.right: right.left; anchors.verticalCenter: left.verticalCenter
        anchors.leftMargin: 20 * win.uiScale; anchors.rightMargin: 20 * win.uiScale
        useFixedSize: true; panelWidth: 400 * win.uiScale; panelHeight: 590 * win.uiScale
        panelPadding: 14 * win.uiScale; gap: 12 * win.uiScale; panelRadius: 16 * win.uiScale
        bgColor: "#172339"; borderColor: "#172339"
        headerText: DeviceSettings.tableName ? DeviceSettings.tableName.toUpperCase() : trLocal("score_header_table3")
        headerHeight: 48 * win.uiScale; headerFontPx: 32 * win.uiScale
        headerStripColor: "#60DB80"; headerStripWidth: 420 * win.uiScale; headerBottomRadius: 14 * win.uiScale
        contentTopMargin: 10 * win.uiScale; sectionGap: 10 * win.uiScale

        readonly property int actionW: 140 * win.uiScale
        readonly property int actionH:  90 * win.uiScale
        readonly property int actionR:  16 * win.uiScale
        readonly property int actionPad: 12 * win.uiScale
        readonly property int actionGap:  8 * win.uiScale
        readonly property int actionIcon: 36 * win.uiScale
        readonly property int actionFont: 16 * win.uiScale
        readonly property int rowGap: 36 * win.uiScale

        // ====== Hàng 1 ======
        ListModel {
            id: row1
            ListElement { labelKey: "menu_guide"; icon: "../../assets/icon/info_outline.svg"; key: "guide" }
            ListElement { labelKey: "menu_history"; icon: "../../assets/icon/History.svg";       key: "history" }
            ListElement { labelKey: "menu_replay";  icon: "../../assets/icon/video_outline.svg";  key: "replay" }
        }
        Row {
            id: r1
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: panel.rowGap
            Repeater {
                model: row1
                ControlButton {
                    btnWidth: panel.actionW
                    btnHeight: panel.actionH
                    radius: panel.actionR
                    padding: panel.actionPad
                    gap: panel.actionGap
                    iconSize: panel.actionIcon
                    fontPx: panel.actionFont
                    bg: panel.actionBg
                    fg: panel.actionFg
                    shadowColor: panel.actionShadowColor
                    shadowBlur: panel.actionShadowBlur
                    shadowOffsetY: panel.actionShadowOffsetY
                    onClicked: { panel.bumpButtons(); page.bumpActivity(); page.handleAction(model.key) }

                    iconSource: model.icon
                    label: trLocal(model.labelKey || "")
                }
            }
        }

        // ====== Hàng 2 ======
        ListModel {
            id: row2
            ListElement { labelKey: "menu_show_menu";          icon: "../../assets/icon/order_outline.svg";          key: "menu" }
            ListElement { labelKey: "menu_view_bill";          icon: "../../assets/icon/bill_outline.svg";           key: "bill" }
            ListElement { labelKey: "menu_promo";              icon: "../../assets/icon/promo_outline.svg";          key: "promo" }
        }
        Row {
            id: r2
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: r1.bottom; anchors.topMargin: 20 * win.uiScale
            spacing: panel.rowGap
            Repeater {
                model: row2
                ControlButton {
                    btnWidth: panel.actionW
                    btnHeight: panel.actionH
                    radius: panel.actionR
                    padding: panel.actionPad
                    gap: panel.actionGap
                    iconSize: panel.actionIcon
                    fontPx: panel.actionFont
                    bg: panel.actionBg
                    fg: panel.actionFg
                    shadowColor: panel.actionShadowColor
                    shadowBlur: panel.actionShadowBlur
                    shadowOffsetY: panel.actionShadowOffsetY
                    onClicked: { panel.bumpButtons(); page.bumpActivity(); page.handleAction(model.key) }

                    iconSource: model.icon
                    label: trLocal(model.labelKey || "")
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

        // KHÔNG hiển thị banner ở ControlPanel trong trang giải đấu
        enableBanner: false

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

    // ==== MATCH CLOCK ====
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

    // ==== HANDICAP CARD ====
    Rectangle {
        id: handicapCard
        width: Math.round(panel.width * 0.7)
        height: Math.round(55 * win.uiScale)
        color: "#C6010B"
        radius: Math.round(24 * win.uiScale)
        anchors.top: panel.bottom
        anchors.topMargin: Math.round(15 * win.uiScale)
        anchors.horizontalCenter: panel.horizontalCenter
        visible: page.matchHandicapText !== "" || page.isMatchFinished

        AppText {
            id: hcText
            anchors.centerIn: parent
            text: page.isMatchFinished ? "XÁC NHẬN KẾT THÚC" : page.matchHandicapText
            color: "white"
            font.pixelSize: Math.round(26 * win.uiScale)
            font.bold: true
        }

        MouseArea {
            anchors.fill: parent
            enabled: page.isMatchFinished
            hoverEnabled: page.isMatchFinished
            cursorShape: Qt.PointingHandCursor
            onClicked: {
                page.pendingAction = "finishMatch"
                confirmDlg.destructive = true
                confirmDlg.openWith(
                    "Bạn có chắc chắn muốn kết thúc trận đấu này tại đây? Sau khi xác nhận vui lòng thông báo cho ban tổ chức",
                    "KẾT THÚC",
                    trLocal("common_confirm"),
                    trLocal("common_cancel")
                )
            }
        }
    }

    // ==== 1 hàm xử lý mọi nút ====
    function handleAction(key) {
        page.bumpActivity()
        switch (key) {
        case "resetScore":
            pendingAction = "resetScore"
            confirmDlg.destructive = true
            confirmDlg.openWith(
                        trLocal("confirm_reset_score_message"),
                        trLocal("confirm_reset_score_title"),
                        trLocal("common_confirm"),
                        trLocal("common_cancel"))
            break
        case "resetMatch":
            pendingAction = "resetMatch"
            confirmDlg.destructive = true
            confirmDlg.openWith(
                        trLocal("confirm_reset_match_message"),
                        trLocal("confirm_reset_match_title"),
                        trLocal("common_confirm"),
                        trLocal("common_cancel"))
            break
        case "toggleRace":
            modeDlg.openWith(page.mode)
            break
        case "history": page.bumpActivity(); historyDlg.open(); break
        case "guide": guideDlg.open(); break
        case "replay":  openReplay(); break
        case "menu":    menuDlg.openWith(); break
        case "bill":
            if (typeof OrdersService !== "undefined" && OrdersService && typeof OrdersService.fetchOrders === "function")
                OrdersService.fetchOrders()
            billDlg.open()
            break
        case "pay":   break
        case "promo":   promoDlg.open(); break
        }
    }

    // ==== RENAME DIALOG ====
    RenameDialog {
        id: renameDlg
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle
        labelFontSize: dlgText; inputFontSize: dlgText; placeholderFontSize: dlgText; inputHeight: Math.round(56 * win.uiScale)
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont

        onAccepted: (newName) => {
            const label = (page.renameTarget === "left") ? trLocal("player_label_left") : trLocal("player_label_right")
            const name = (newName || "").trim()

            if (page.renameTarget === "left")  Controller.leftName  = name
            if (page.renameTarget === "right") Controller.rightName = name
            page.logAction(trArgsLocal("log_rename_player", [label, name], label + " đổi tên thành \"" + name + "\""))

            page.pendingAction = ""
        }
        onCancelled: page.pendingAction = ""
    }

    // ==== CONFIRM DIALOG ====
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
                resetScores()
                page.logAction(trLocal("log_reset_score"))
                page.syncScore()
            } else if (page.pendingAction === "resetMatch") {
                resetMatchAndState()
                page.logAction(trLocal("log_reset_match"))
                page.syncScore()
            } else if (page.pendingAction === "finishMatch") {
                page.logAction("Xác nhận kết thúc trận đấu")
                if (typeof TournamentService !== "undefined" && TournamentService.activeMatch && TournamentService.activeMatch.match_id) {
                    var fMatch = TournamentService.activeMatch
                    TournamentService.requestTableFeePayment(fMatch.match_id, page.matchElapsedSec)
                    // Nếu skip=true → syncScore(true) được gọi trong onTableFeePaymentReady
                    // Nếu không → QR dialog mở
                } else {
                    page.syncScore(true)
                }
            } else if (page.pendingAction === "leavePage") {
                prepareForLeave()
                win.backTo(page.backTo || "home")
                return
            }
            page.pendingAction = ""
        }
        onCancelled: page.pendingAction = ""
    }

    // ==== GUIDE DIALOG ====
    GuideDialog {
        id: guideDlg
        pageType: "tournament"
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide
        titleFontSize: dlgTitle; contentFontSize: dlgText
    }

    // ==== HISTORY DIALOG ====
    HistoryDialog {
        id: historyDlg
        model: actionHistory
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        onResetRequested: {
            actionHistory.clear()
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
    }


    MenuDialog { id: menuDlg }

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
        id: promoConnection
        target: BannerService
        function onBannersLoaded(bannerType, urls) {
            if (bannerType === "scoreboard") page.promoImages = urls
        }
    }

    ModeSelectDialog {
        id: modeDlg

        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont

        onSelectTwo: {
            if (page.mode === "two") return
            prepareForLeave()
            win.pushPage("pages/ScorePage.qml", {
                routeName: "score2p",
                backTo: page.backTo || "home",
                mode: "two"
            })
        }
        onSelectMulti: {
            if (page.mode === "multi") return
            prepareForLeave()
            win.pushPage("pages/MultiScorePage.qml", {
                routeName: "multiScore",
                backTo: page.backTo || "home",
                mode: "multi"
            })
        }
        onSelectCards: {
            if (page.mode === "cards") return
            prepareForLeave()
            win.pushPage("pages/MultiCardScorePage.qml", {
                routeName: "multiCardScore",
                backTo: page.backTo || "home",
                mode: "cards"
            })
        }
        onSelectMultiQuick: {
            if (page.mode === "multiQuick") return
            prepareForLeave()
            win.pushPage("pages/MultiQuickAddPage.qml", {
                routeName: "QuickScore",
                backTo: page.backTo || "home",
                mode: "multiQuick"
            })
        }

        onModeSelected: function(selectedMode) {
            page.mode = selectedMode
            page.logAction(trArgsLocal("log_switch_mode", [selectedMode], "Đổi chế độ"))
        }
    }

    TournamentJoinDialog {
        id: joinDlg
        leftName: page.pLeftName || defaultLeftName()
        rightName: page.pRightName || defaultRightName()
        leftMinScore: page.leftMinScore
        rightMinScore: page.rightMinScore
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        onBothConfirmed: {
            page.matchJoined = true
            page.startMatchTimer()
        }
        onAbsentDetected: {
            page.matchJoined = true
            // Timer không chạy — không tính tiền bàn khi có người vắng mặt
        }
    }

    TableFeePaymentDialog {
        id: tableFeeDlg
        fixedW: Math.round(500 * win.uiScale)
        minW: Math.round(400 * win.uiScale)
        sideMargin: dlgSide
        onPaymentConfirmed: {
            page.logAction("Thanh toán tiền bàn thành công")
            // Backend đã set match completed, poll tiếp theo sẽ navigate về home
        }
    }

    Connections {
        id: tableFeeConnections
        target: typeof TournamentService !== "undefined" ? TournamentService : null
        ignoreUnknownSignals: true
        function onTableFeePaymentReady(skip, qrUrl, amount, code) {
            if (skip) {
                page.syncScore(true)
            } else {
                var m = TournamentService.activeMatch
                tableFeeDlg.matchId = m ? m.match_id : 0
                tableFeeDlg.qrUrl = qrUrl
                tableFeeDlg.amount = amount
                tableFeeDlg.paymentCode = code
                tableFeeDlg.open()
            }
        }
    }

    Component.onDestruction: {
        if (typeof TournamentService !== "undefined") {
            TournamentService.stopAutoRefresh()
        }
        prepareForLeave()
    }
}

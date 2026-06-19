// qml/pages/ScorePage.qml
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
    property string routeName: "score"
    property string backTo: "home"
    property string renameTarget: ""
    property string pendingAction: ""
    property string mode: "two"   // <-- thêm để nhận { mode: "two" } từ HomePage

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
    function historyKey() { return page.routeName || "score" }
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
        resetMatchTimer()
        startMatchTimer()
        persistHistory()
        if (typeof LiveScoreService !== "undefined" && LiveScoreService) LiveScoreService.clearScore()
    }

    function resetScores() {
        try { if (Controller.reset) Controller.reset(); else { Controller.leftScore = 0; Controller.rightScore = 0 } }
        catch(e) { Controller.leftScore = 0; Controller.rightScore = 0 }
    }

    // ==== RESET TOÀN TRẬN & TRẠNG THÁI TRANG ====
    function resetMatchAndState() {
        try {
            if (Controller.resetMatch) Controller.resetMatch()
            else { Controller.leftScore = 0; Controller.rightScore = 0 }
        } catch(e) {
            Controller.leftScore = 0; Controller.rightScore = 0
        }
        renameTarget = ""
        pendingAction = ""
        // LƯU Ý: không reset đồng hồ ở đây (chỉ reset khi kết thúc trận)
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

    // ==== AUTO-EXIT SAU 30 PHÚT KHÔNG TƯƠNG TÁC ====
    readonly property int idleMs: 40 * 60 * 1000  // 40 phút
    Timer {
        id: inactivityTimer
        interval: page.idleMs
        repeat: false
        running: true
        onTriggered: {
            resetMatchAndState()
            persistHistory()
            win.backTo(page.backTo || "home")
        }
    }
    function bumpActivity() { inactivityTimer.restart() }

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
    property bool matchTimerRunning: true

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

    function syncScoreToBackend() {
        if (typeof LiveScoreService === "undefined" || !LiveScoreService) return
        var players = JSON.stringify([
            { name: Controller.leftName  || defaultLeftName(),  score: Controller.leftScore,  color: "#da251d" },
            { name: Controller.rightName || defaultRightName(), score: Controller.rightScore, color: "#ffcd00" }
        ])
        LiveScoreService.reportScore("two", players)
    }

    Connections {
        target: Controller
        function onLeftScoreChanged()  { page.syncScoreToBackend() }
        function onRightScoreChanged() { page.syncScoreToBackend() }
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
        return Controller.leftName || trLocal("player_left_default")
    }

    function defaultRightName() {
        return Controller.rightName || trLocal("player_right_default")
    }

    Timer {
        id: matchTicker
        interval: 1000
        repeat: true
        running: page.matchTimerRunning
        onTriggered: page.matchElapsedSec += 1
    }

    Component.onCompleted: {
        startMatchTimer()
        restoreHistory()
        Qt.callLater(syncScoreToBackend)
    }

    // ==== LEFT CARD ====
    ScoreTile {
        id: left
        width: 650 * win.uiScale; height: 850 * win.uiScale
        x: 30 * win.uiScale; y: contentTopOffset
        title: Controller.leftName || defaultLeftName()
        score: Controller.leftScore
        raceTo: Controller.raceTo
        bgColor: "#da251d"
        buttonPosition: "left"

        titleStripColor: "#172339"
        titleStripTextColor: "white"
        titleStripWidth: 420 * win.uiScale
        titleFontSize: 28 * win.uiScale
        editButtonSize: 24 * win.uiScale

        onClicked: {
            page.bumpActivity()
            const before = Controller.leftScore
            Controller.incLeft()
            const after = Controller.leftScore
            if (after !== before) {
                const n = defaultLeftName()
                const base = trArgsLocal("log_point_added_single", [n], "Cộng 1 điểm cho \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
            }
        }
        onRightClicked: {
            page.bumpActivity()
            const before = Controller.leftScore
            if (before <= 0) return
            Controller.decLeft()
            const after = Controller.leftScore
            if (after !== before) {
                const n = defaultLeftName()
                const base = trArgsLocal("log_point_removed_single", [n], "Trừ 1 điểm của \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
            }
        }
        onEditTitleRequested: { page.bumpActivity(); page.renameTarget = "left"; renameDlg.openFor("left", Controller.leftName) }
    }

    // ==== RIGHT CARD ====
    ScoreTile {
        id: right
        width: 650 * win.uiScale; height: 850 * win.uiScale
        x: 1240 * win.uiScale; y: contentTopOffset
        title: Controller.rightName || defaultRightName()
        score: Controller.rightScore
        raceTo: Controller.raceTo
        bgColor: "#ffcd00"
        buttonPosition: "right"

        titleStripColor: "#172339"
        titleStripTextColor: "white"
        titleStripWidth: 420 * win.uiScale
        titleFontSize: 28 * win.uiScale
        editButtonSize: 24 * win.uiScale

        onClicked: {
            page.bumpActivity()
            const before = Controller.rightScore
            Controller.incRight()
            const after = Controller.rightScore
            if (after !== before) {
                const n = defaultRightName()
                const base = trArgsLocal("log_point_added_single", [n], "Cộng 1 điểm cho \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
            }
        }
        onRightClicked: {
            page.bumpActivity()
            const before = Controller.rightScore
            if (before <= 0) return
            Controller.decRight()
            const after = Controller.rightScore
            if (after !== before) {
                const n = defaultRightName()
                const base = trArgsLocal("log_point_removed_single", [n], "Trừ 1 điểm của \"" + n + "\"")
                page.logAction(historyWithScore(base, after))
            }
        }
        onEditTitleRequested: { page.bumpActivity(); page.renameTarget = "right"; renameDlg.openFor("right", Controller.rightName) }
    }

    // ==== CENTER PANEL ====
    ControlPanel {
        id: panel
        anchors.left: left.right; anchors.right: right.left; anchors.verticalCenter: left.verticalCenter
        anchors.leftMargin: 20 * win.uiScale; anchors.rightMargin: 20 * win.uiScale
        useFixedSize: true; panelWidth: 400 * win.uiScale; panelHeight: 705 * win.uiScale
        panelPadding: 14 * win.uiScale; gap: 12 * win.uiScale; panelRadius: 16 * win.uiScale
        bgColor: "#172339"; borderColor: "#172339"
        headerText: DeviceSettings.tableName ? DeviceSettings.tableName.toUpperCase() : trLocal("score_header_table3"); headerHeight: 48 * win.uiScale; headerFontPx: 32 * win.uiScale
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
            ListElement { labelKey: "menu_reset_score"; icon: "../../assets/icon/clock-reset-25.svg"; key: "resetScore" }
            ListElement { labelKey: "menu_reset_match"; icon: "../../assets/icon/reset2.svg";        key: "resetMatch" }
            ListElement { labelKey: "menu_change_mode"; icon: "../../assets/icon/circle_reload_outline.svg"; key: "toggleRace" }
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
            ListElement { labelKey: "menu_guide"; icon: "../../assets/icon/info_outline.svg"; key: "guide" }
            ListElement { labelKey: "menu_history"; icon: "../../assets/icon/History.svg";       key: "history" }
            ListElement { labelKey: "menu_replay";  icon: "../../assets/icon/video_outline.svg";  key: "replay" }
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

        // ====== Hàng 3 ======
        ListModel {
            id: row3
            ListElement { labelKey: "menu_show_menu";          icon: "../../assets/icon/order_outline.svg";          key: "menu" }
            ListElement { labelKey: "menu_view_bill";          icon: "../../assets/icon/bill_outline.svg";           key: "bill" }
            ListElement { labelKey: "menu_promo";              icon: "../../assets/icon/promo_outline.svg";          key: "promo" }
        }
        Row {
            id: r3
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: r2.bottom; anchors.topMargin: 20 * win.uiScale
            spacing: panel.rowGap
            Repeater {
                model: row3
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
        case "pay":
            break
        case "promo":   promoDlg.open(); break
        }
    }

    // ==== PROMO ====
    property var promoImages: {
        // Khởi tạo từ cache ngay khi trang được tạo
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
            } else if (page.pendingAction === "resetMatch") {
                resetMatchAndState()
                resetMatchTimer()
                startMatchTimer()
                page.logAction(trLocal("log_reset_match"))
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
        pageType: "score"
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


    // ==== ĐỒNG HỒ ====
    ClockLabel {
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.rightMargin: Math.round(30 * win.uiScale)
        anchors.bottomMargin: Math.round(22 * win.uiScale)
    }

    Component.onDestruction: prepareForLeave()
}

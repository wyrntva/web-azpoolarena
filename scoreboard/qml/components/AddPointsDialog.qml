// components/AddPointsDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6
import QtQml 6
import "../components"

DialogShell {
    id: dlg

    // ===== API =====
    property var  playerModel
    property real uiScale: (typeof win !== "undefined" && win && win.uiScale) ? win.uiScale : 1.0
    function openGlobal() { open() }

    // ===== Cố định width khi mở =====
    property int _frozenW: 0
    function _computeBaseW() {
        const W = (typeof win !== "undefined" && win) ? Number(win.width) : Math.round(900 * uiScale)
        const minW = Math.round(360 * uiScale)
        const maxW = Math.round(1440 * uiScale)
        return Math.round(Math.min(maxW, Math.max(minW, W * 0.9)))
    }

    // ===== Title / Buttons =====
    titleText:   (typeof win !== "undefined" && win) ? win.tr("add_points_title") : "CỘNG ĐIỂM"
    confirmText: (typeof win !== "undefined" && win) ? win.tr("common_apply") : "Áp dụng"
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_cancel") : "Huỷ"
    property int _expectedSum: showCommonScoreTick ? commonScoreVal : 0
    confirmEnabled: (dlg.deltaSum + dlg._expectedSum === 0) && (!showWinnerTick || skipWinner || selectedPlayer >= 0)

    function _centerAndOffset() {
        const ow = (Overlay.overlay && Overlay.overlay.width)  ? Overlay.overlay.width  :
                   ((typeof win !== "undefined" && win) ? win.width  : dlg.width)
        dlg.x = Math.round((ow - dlg.width) / 2)
        dlg.y = 180   // cách trên 180px
    }

    // ===== Font & spacing =====
    property int  contentFontSize:   Math.round(26 * uiScale)
    property real contentSpacing:    Math.round(22 * uiScale)

    // ===== Control sizes =====
    readonly property int iconSize:         Math.round(48 * uiScale)
    readonly property int ctrlH:            Math.max(Math.round(68 * uiScale), iconSize + Math.round(12 * uiScale))
    readonly property int sideBtnW:         Math.max(Math.round(76 * uiScale), iconSize + Math.round(20 * uiScale))
    readonly property int cardGap:          Math.round(16  * uiScale)
    readonly property int cornerR:          Math.round(12  * uiScale)
    readonly property int cardContentMargin: Math.round(12 * uiScale)

    // ===== Card size =====
    readonly property int cardW:     Math.round(330 * uiScale)
    readonly property int cardHBase: Math.round(210 * uiScale)

    // ===== Icons =====
    property url iconMinus: Qt.resolvedUrl("../../assets/icon/minus-svgrepo-com.svg")
    property url iconPlus:  Qt.resolvedUrl("../../assets/icon/plus-svgrepo-com.svg")

    // ===== State =====
    property var  deltas: []
    property int  selectedPlayer: -1   // index người được tick (-1 = chưa chọn)
    property bool showWinnerTick: false // hiển thị tickbox chọn người thắng
    property bool skipWinner: false     // bỏ qua chọn người thắng
    property bool skipHandicapToggle: false  // không thay đổi ván chấp
    property bool showHandicapTick: false    // hiện checkbox chấp
    property int  winPoints: 1               // số điểm win (mặc định 1, chỉ dương)
    property bool showCommonScoreTick: false // hiển thị khung nhập điểm chung
    property int  commonScoreVal: 1          // giá trị điểm chung
    property int  currentCommonScore: 0      // tổng điểm chung hiện tại
    signal applyCommon(int cScore)
    property Item __firstInput: null
    signal apply(int playerIndex, int points)
    signal winnerApplied(int winnerIndex, int winPoints)   // phát khi có người thắng được chọn
    signal appliedChanges()
    signal resetInputs()   // <== để reset SpinBox khi mở

    // Tổng điểm
    property int deltaSum: 0
    function _recalcSum() {
        let s = 0
        const n = playerCount
        for (let i = 0; i < n; ++i) s += Number(deltas[i] || 0)
        deltaSum = s
    }

    readonly property int playerCount: (playerModel && playerModel.count) ? playerModel.count : 0

    function trLocal(key) {
        return (typeof win !== "undefined" && win && typeof win.tr === "function") ? win.tr(key) : key
    }

    function trArgsLocal(key, args, fallback) {
        if (typeof win !== "undefined" && win && typeof win.trArgs === "function")
            return win.trArgs(key, args, fallback)
        return (fallback !== undefined) ? fallback : key
    }

    function defaultPlayerName(index) {
        return trArgsLocal("player_numbered", [index], "Player " + index)
    }

    function colorForOrdinal(n) {
        switch (n) {
        case 1: return "#ffcd00";
        case 2: return "#da251d";
        case 3: return "#246ee4";
        case 4: return "#1ee051";
        case 5: return "#6941c8";
        default: return "#94A3B8";
        }
    }

    // Map nút
    onConfirmed: {
        if (dlg.deltaSum + dlg._expectedSum !== 0) return
        if (dlg.showWinnerTick && !dlg.skipWinner && dlg.selectedPlayer < 0) return
        const n = playerCount
        let anyApplied = false
        for (let i = 0; i < n; ++i) {
            const d = Number(deltas[i] || 0)
            if (d !== 0) {
                apply(i, d)
                anyApplied = true
            }
        }
        if (dlg.showWinnerTick && !dlg.skipWinner && dlg.selectedPlayer >= 0) {
            dlg.winnerApplied(dlg.selectedPlayer, dlg.winPoints)
        }
        if (anyApplied) {
            if (dlg.showCommonScoreTick && dlg.commonScoreVal > 0) {
                dlg.applyCommon(dlg.commonScoreVal)
            }
            dlg.appliedChanges()
        }
        close()
    }
    onCancelled: close()

    Shortcut { sequences: ["Escape"]; context: Qt.WindowShortcut; onActivated: dlg.close() }

    // ===== Khi mở =====
    onOpened: {
        _frozenW = _computeBaseW()
        dlg.fixedW = _frozenW
        dlg.minW   = _frozenW

        const n = playerCount
        deltas = new Array(n).fill(0)
        selectedPlayer = -1
        skipWinner = false
        skipHandicapToggle = false
        winPoints = 1
        _recalcSum()

        _centerAndOffset()
        Qt.callLater(() => {
            _centerAndOffset()
            dlg.resetInputs()   // <== reset SpinBox về trống
            dlg.commonScoreVal = 1
        })
    }

    onHeightChanged: _centerAndOffset()

    Connections {
        target: (typeof win !== "undefined" && win) ? win : null
        function onWidthChanged() {
            const w = dlg._computeBaseW()
            dlg.fixedW = w
            dlg.minW   = w
            dlg._centerAndOffset()
        }
        function onHeightChanged() { dlg._centerAndOffset() }
    }

    // ===== IconButton =====
    Component {
        id: iconButton
        Item {
            id: root
            width: dlg.sideBtnW
            height: dlg.ctrlH
            property url source
            property string fallbackText: "?"
            property bool autoRepeat: false
            property int initialRepeatDelay: 320
            property int repeatInterval: 90
            signal pressed()

            Rectangle { anchors.fill: parent; color: "white"; radius: dlg.cornerR }
            Image {
                anchors.centerIn: parent
                source: root.source
                width: dlg.iconSize; height: dlg.iconSize
                fillMode: Image.PreserveAspectFit
                antialiasing: true; smooth: true
                visible: status === Image.Ready
            }
                AppText {
                    anchors.centerIn: parent
                    visible: status !== Image.Ready
                    text: root.fallbackText
                    color: "#172339"
                    font.pixelSize: Math.round(34 * dlg.uiScale)
                    font.bold: true
                }
            MouseArea {
                id: area
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                acceptedButtons: Qt.LeftButton
                onPressed: {
                    root.pressed()
                    if (root.autoRepeat) {
                        repeatTimer.stop()
                        repeatTimer.interval = repeatTimer.initialInterval
                        repeatTimer.start()
                    }
                }
                onReleased: {
                    repeatTimer.stop()
                    repeatTimer.interval = repeatTimer.initialInterval
                }
                onCanceled: {
                    repeatTimer.stop()
                    repeatTimer.interval = repeatTimer.initialInterval
                }
            }

            Timer {
                id: repeatTimer
                property int initialInterval: Math.max(120, root.initialRepeatDelay)
                property int repeatIntervalClamped: Math.max(30, root.repeatInterval)
                interval: initialInterval
                repeat: true
                running: false
                onTriggered: {
                    if (!root.autoRepeat || !area.pressed) {
                        stop()
                        interval = initialInterval
                        return
                    }
                    root.pressed()
                    interval = repeatIntervalClamped
                }
            }
        }
    }

    // ===== BODY =====
    Column {
        width: parent ? parent.width : Math.round(dlg.dialogW - 2 * dlg.contentMargins)
        spacing: dlg.contentSpacing

        AppText {
            text: trLocal("add_points_intro")
            color: "#172339"
            font.pixelSize: Math.round(20 * dlg.uiScale)
            wrapMode: Text.WordWrap
            width: parent.width
        }

        AppText {
            visible: playerCount === 0
            text: trLocal("add_points_no_players")
            color: "#65708a"
            font.pixelSize: Math.round(18 * dlg.uiScale)
            width: parent.width
        }

        Column {
            id: cardsArea
            visible: playerCount > 0
            width: parent.width
            spacing: Math.round(8 * dlg.uiScale)

            Flickable {
                id: flick
                width: parent.width
                height: Math.max(dlg.cardHBase, rowWrap.implicitHeight)
                clip: true
                boundsBehavior: Flickable.StopAtBounds
                flickableDirection: Flickable.HorizontalFlick

                contentWidth:  Math.max(width, rowWrap.implicitWidth)
                contentHeight: Math.max(height, rowWrap.implicitHeight)

                Row {
                    id: rowWrap
                    spacing: dlg.cardGap
                    width: implicitWidth
                    height: implicitHeight
                    anchors.centerIn: parent

                    Repeater {
                        model: (dlg.playerModel && dlg.playerModel.count) ? dlg.playerModel : 0

                        delegate: Rectangle {
                            id: card
                            width: dlg.cardW
                            readonly property int baseH: dlg.cardHBase
                            height: Math.max(baseH, contentCol.implicitHeight + Math.round(28 * dlg.uiScale))
                            radius: dlg.cornerR
                            color: dlg.colorForOrdinal(index + 1)
                            border.color: dlg.selectedPlayer === index ? "white" : Qt.darker(color, 1.2)
                            border.width: dlg.selectedPlayer === index ? 3 : 1

                            readonly property string _name:
                                (typeof name !== "undefined" && name !== null) ? String(name) :
                                ((typeof model !== "undefined" && model && typeof model.name !== "undefined" && model.name) ? String(model.name) :
                                defaultPlayerName(index + 1))
                            readonly property int _score:
                                (!isNaN(Number(score))) ? Number(score) :
                                ((typeof model !== "undefined" && model && !isNaN(Number(model.score))) ? Number(model.score) : 0)

                            // ===== Tickbox góc trên phải =====
                            Rectangle {
                                id: tickBox
                                visible: dlg.showWinnerTick && !dlg.skipWinner
                                anchors.top: parent.top
                                anchors.right: parent.right
                                anchors.topMargin: Math.round(8 * dlg.uiScale)
                                anchors.rightMargin: Math.round(8 * dlg.uiScale)
                                width: Math.round(46 * dlg.uiScale)
                                height: width
                                radius: Math.round(6 * dlg.uiScale)
                                color: dlg.selectedPlayer === index ? "white" : "#00000030"
                                border.color: "white"
                                border.width: Math.max(1, Math.round(2 * dlg.uiScale))
                                z: 5

                                Behavior on color { ColorAnimation { duration: 150 } }

                                // Checkmark
                                Canvas {
                                    anchors.centerIn: parent
                                    width: Math.round(28 * dlg.uiScale)
                                    height: Math.round(28 * dlg.uiScale)
                                    visible: dlg.selectedPlayer === index
                                    onPaint: {
                                        var ctx = getContext("2d")
                                        ctx.clearRect(0, 0, width, height)
                                        ctx.strokeStyle = dlg.colorForOrdinal(index + 1)
                                        ctx.lineWidth = Math.max(2, 3 * dlg.uiScale)
                                        ctx.lineCap = "round"
                                        ctx.lineJoin = "round"
                                        ctx.beginPath()
                                        ctx.moveTo(width * 0.15, height * 0.5)
                                        ctx.lineTo(width * 0.4, height * 0.75)
                                        ctx.lineTo(width * 0.85, height * 0.25)
                                        ctx.stroke()
                                    }
                                }

                                MouseArea {
                                    anchors.fill: parent
                                    anchors.margins: Math.round(-4 * dlg.uiScale)  // tăng vùng tap
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        if (dlg.selectedPlayer === index)
                                            dlg.selectedPlayer = -1   // bỏ tick
                                        else
                                            dlg.selectedPlayer = index  // chọn người này
                                    }
                                }
                            }

                            Column {
                                id: contentCol
                                anchors.horizontalCenter: parent.horizontalCenter
                                anchors.verticalCenter: parent.verticalCenter
                                width: Math.max(0, parent.width - 2 * dlg.cardContentMargin)
                                spacing: Math.round(12 * dlg.uiScale)

                                AppText {
                                    text: card._name
                                    color: "white"
                                    font.pixelSize: Math.round(dlg.contentFontSize)
                                    font.bold: true
                                    horizontalAlignment: Text.AlignHCenter
                                    width: parent.width
                                    elide: Text.ElideRight
                                }

                                AppText {
                                    text: trArgsLocal("add_points_current_score", [card._score], "Điểm hiện tại: " + card._score)
                                    color: "white"
                                    opacity: 0.98
                                    font.pixelSize: Math.round(20 * dlg.uiScale)
                                    horizontalAlignment: Text.AlignHCenter
                                    width: parent.width
                                }

                                Row {
                                    id: btnRow
                                    spacing: Math.round(12 * dlg.uiScale)
                                    anchors.horizontalCenter: parent.horizontalCenter

                                    Loader {
                                        sourceComponent: iconButton
                                        onLoaded: {
                                            item.source = dlg.iconMinus
                                            item.fallbackText = "–"
                                            item.autoRepeat = true
                                            item.initialRepeatDelay = 280
                                            item.repeatInterval = 70
                                            item.pressed.connect(() => {
                                                const prev = Number(dlg.deltas[index] || 0)
                                                const next = Math.max(delta.from, prev - 1)
                                                if (next === prev) return
                                                dlg.deltas[index] = next
                                                dlg._recalcSum()
                                                delta.showBlank = false
                                                delta.value = next
                                            })
                                        }
                                    }

                                    SpinBox {
                                        id: delta
                                        editable: false
                                        property bool showBlank: true
                                        width:  Math.round(dlg.sideBtnW)
                                        height: Math.round(dlg.ctrlH)
                                        from: -999; to: 999; stepSize: 1
                                        value: (dlg.deltas[index] !== undefined) ? dlg.deltas[index] : 0
                                        onValueChanged: {
                                            dlg.deltas[index] = Number(value) || 0
                                            dlg._recalcSum()
                                        }
                                        font.pixelSize: Math.round(24 * dlg.uiScale)

                                        background: Rectangle {
                                            radius: dlg.cornerR
                                            color: dlg.colorForOrdinal(index + 1)
                                            border.width: 2
                                            border.color: "white"
                                        }
                                        up.indicator: null
                                        down.indicator: null
                                        padding: 0

                                        AppText {
                                            anchors.centerIn: parent
                                            visible: delta.showBlank
                                            text: ""
                                            color: "#FFFFFF80"
                                            font.pixelSize: Math.round(24 * dlg.uiScale)
                                        }

                                        contentItem: TextInput {
                                            id: ti
                                            text: delta.showBlank ? "" : delta.textFromValue(delta.value, delta.locale)
                                            font: delta.font
                                            color: "white"
                                            horizontalAlignment: Qt.AlignHCenter
                                            verticalAlignment: Qt.AlignVCenter
                                            readOnly: true
                                        }

                                        Connections {
                                            target: dlg
                                            function onResetInputs() {
                                                delta.showBlank = true
                                                delta.value = 0
                                            }
                                        }
                                    }

                                    Loader {
                                        sourceComponent: iconButton
                                        onLoaded: {
                                            item.source = dlg.iconPlus
                                            item.fallbackText = "+"
                                            item.autoRepeat = true
                                            item.initialRepeatDelay = 280
                                            item.repeatInterval = 70
                                            item.pressed.connect(() => {
                                                const prev = Number(dlg.deltas[index] || 0)
                                                const next = Math.min(delta.to, prev + 1)
                                                if (next === prev) return
                                                dlg.deltas[index] = next
                                                dlg._recalcSum()
                                                delta.showBlank = false
                                                delta.value = next
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            ScrollBar {
                orientation: Qt.Horizontal
                policy: ScrollBar.AlwaysOn
                anchors.left: parent.left
                anchors.right: parent.right
                size: flick.contentWidth > 0 ? Math.min(1, flick.width / flick.contentWidth) : 1
                position: (flick.contentWidth > flick.width && flick.contentWidth > 0)
                          ? flick.contentX / (flick.contentWidth - flick.width) : 0
                onPositionChanged: {
                    if (flick.contentWidth > flick.width) {
                        flick.contentX = position * (flick.contentWidth - flick.width)
                    }
                }
            }
        }

        // === Checkbox "Không cần chọn người thắng" ===
        Row {
            visible: dlg.showWinnerTick
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: Math.round(10 * dlg.uiScale)

            Rectangle {
                anchors.verticalCenter: parent.verticalCenter
                width: Math.round(40 * dlg.uiScale)
                height: width
                radius: Math.round(6 * dlg.uiScale)
                color: dlg.skipWinner ? "#4CAF50" : "white"
                border.color: dlg.skipWinner ? "#388E3C" : "#BDBDBD"
                border.width: Math.max(1, Math.round(2 * dlg.uiScale))

                Behavior on color { ColorAnimation { duration: 150 } }

                Canvas {
                    anchors.centerIn: parent
                    width: Math.round(26 * dlg.uiScale)
                    height: Math.round(26 * dlg.uiScale)
                    visible: dlg.skipWinner
                    onPaint: {
                        var ctx = getContext("2d")
                        ctx.clearRect(0, 0, width, height)
                        ctx.strokeStyle = "white"
                        ctx.lineWidth = Math.max(2, 3 * dlg.uiScale)
                        ctx.lineCap = "round"
                        ctx.lineJoin = "round"
                        ctx.beginPath()
                        ctx.moveTo(width * 0.15, height * 0.5)
                        ctx.lineTo(width * 0.4, height * 0.75)
                        ctx.lineTo(width * 0.85, height * 0.25)
                        ctx.stroke()
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    anchors.margins: Math.round(-6 * dlg.uiScale)
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.skipWinner = !dlg.skipWinner
                }
            }

            AppText {
                anchors.verticalCenter: parent.verticalCenter
                text: trLocal("add_points_skip_winner")
                color: "#65708a"
                font.pixelSize: Math.round(22 * dlg.uiScale)

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.skipWinner = !dlg.skipWinner
                }
            }
        }

        // === Checkbox "Không thay đổi ván chấp" ===
        Row {
            visible: dlg.showHandicapTick
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: Math.round(10 * dlg.uiScale)

            Rectangle {
                anchors.verticalCenter: parent.verticalCenter
                width: Math.round(40 * dlg.uiScale)
                height: width
                radius: Math.round(6 * dlg.uiScale)
                color: dlg.skipHandicapToggle ? "#1976D2" : "white"
                border.color: dlg.skipHandicapToggle ? "#1565C0" : "#BDBDBD"
                border.width: Math.max(1, Math.round(2 * dlg.uiScale))

                Behavior on color { ColorAnimation { duration: 150 } }

                Canvas {
                    anchors.centerIn: parent
                    width: Math.round(26 * dlg.uiScale)
                    height: Math.round(26 * dlg.uiScale)
                    visible: dlg.skipHandicapToggle
                    onPaint: {
                        var ctx = getContext("2d")
                        ctx.clearRect(0, 0, width, height)
                        ctx.strokeStyle = "white"
                        ctx.lineWidth = Math.max(2, 3 * dlg.uiScale)
                        ctx.lineCap = "round"
                        ctx.lineJoin = "round"
                        ctx.beginPath()
                        ctx.moveTo(width * 0.15, height * 0.5)
                        ctx.lineTo(width * 0.4, height * 0.75)
                        ctx.lineTo(width * 0.85, height * 0.25)
                        ctx.stroke()
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    anchors.margins: Math.round(-6 * dlg.uiScale)
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.skipHandicapToggle = !dlg.skipHandicapToggle
                }
            }

            AppText {
                anchors.verticalCenter: parent.verticalCenter
                text: trLocal("add_points_skip_handicap")
                color: "#65708a"
                font.pixelSize: Math.round(22 * dlg.uiScale)

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.skipHandicapToggle = !dlg.skipHandicapToggle
                }
            }
        }

        // === Tổng điểm + Điểm win ===
        Column {
            visible: playerCount > 0
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: Math.round(10 * dlg.uiScale)

            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: Math.round(20 * dlg.uiScale)

                Column {
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: Math.round(8 * dlg.uiScale)

                    AppText {
                        text: trArgsLocal("add_points_total_label", [dlg.deltaSum + dlg._expectedSum], "Tổng điểm ván: " + (dlg.deltaSum + dlg._expectedSum)) +
                              ((dlg.deltaSum + dlg._expectedSum === 0) ? trLocal("add_points_total_ok") : trLocal("add_points_total_invalid"))
                        color: (dlg.deltaSum + dlg._expectedSum === 0) ? "#16a34a" : "#dc2626"
                        font.pixelSize: Math.round(16 * dlg.uiScale)
                        font.bold: true
                    }

                    AppText {
                        visible: dlg.showCommonScoreTick
                        text: "Điểm chung mặc định là 1 và có thể\nthay đổi xuống 0 hoặc lên 2 3 4..."
                        color: (dlg.deltaSum + dlg._expectedSum === 0) ? "#16a34a" : "#dc2626"
                        font.pixelSize: Math.round(16 * dlg.uiScale)
                        font.bold: true
                    }
                }

            // --- Card chỉnh điểm win ---
            Rectangle {
                visible: dlg.showWinnerTick
                anchors.verticalCenter: parent.verticalCenter
                width: Math.round(260 * dlg.uiScale)
                height: Math.round(68 * dlg.uiScale)
                radius: Math.round(10 * dlg.uiScale)
                color: "#1B03DC"
                border.color: "#1400A0"
                border.width: Math.max(1, Math.round(1.5 * dlg.uiScale))

                Row {
                    anchors.centerIn: parent
                    spacing: Math.round(8 * dlg.uiScale)

                    AppText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: "Win:"
                        color: "white"
                        font.pixelSize: Math.round(20 * dlg.uiScale)
                        font.bold: true
                    }

                    // Nút giảm
                    Rectangle {
                        anchors.verticalCenter: parent.verticalCenter
                        width: Math.round(50 * dlg.uiScale)
                        height: width
                        radius: Math.round(8 * dlg.uiScale)
                        color: winMinusMA.pressed ? "#E0E0E0" : "white"
                        border.color: "#BDBDBD"
                        border.width: 1

                        AppText {
                            anchors.centerIn: parent
                            text: "−"
                            color: "#1B03DC"
                            font.pixelSize: Math.round(24 * dlg.uiScale)
                            font.bold: true
                        }

                        MouseArea {
                            id: winMinusMA
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (dlg.winPoints > 1) dlg.winPoints -= 1
                            }
                        }
                    }

                    // Giá trị
                    AppText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: String(dlg.winPoints)
                        color: "white"
                        font.pixelSize: Math.round(26 * dlg.uiScale)
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        width: Math.round(36 * dlg.uiScale)
                    }

                    // Nút tăng
                    Rectangle {
                        anchors.verticalCenter: parent.verticalCenter
                        width: Math.round(50 * dlg.uiScale)
                        height: width
                        radius: Math.round(8 * dlg.uiScale)
                        color: winPlusMA.pressed ? "#E0E0E0" : "white"
                        border.color: "#BDBDBD"
                        border.width: 1

                        AppText {
                            anchors.centerIn: parent
                            text: "+"
                            color: "#1B03DC"
                            font.pixelSize: Math.round(24 * dlg.uiScale)
                            font.bold: true
                        }

                        MouseArea {
                            id: winPlusMA
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: dlg.winPoints += 1
                        }
                    }
                }
            }

            // --- Card chỉnh Điểm chung ---
            Rectangle {
                visible: dlg.showCommonScoreTick
                anchors.verticalCenter: parent.verticalCenter
                width: Math.round(340 * dlg.uiScale)
                height: Math.round(160 * dlg.uiScale)
                radius: Math.round(12 * dlg.uiScale)
                color: "#3E26FF"
                border.color: Qt.darker("#3E26FF", 1.2)
                border.width: 1

                Column {
                    anchors.centerIn: parent
                    width: parent.width - Math.round(24 * dlg.uiScale)
                    spacing: Math.round(8 * dlg.uiScale)

                    AppText {
                        text: "Điểm chung"
                        color: "white"
                        font.pixelSize: Math.round(22 * dlg.uiScale)
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        width: parent.width
                    }

                    AppText {
                        text: trArgsLocal("add_points_current_score", [dlg.currentCommonScore], "Điểm hiện tại: " + dlg.currentCommonScore)
                        color: "white"
                        opacity: 0.98
                        font.pixelSize: Math.round(16 * dlg.uiScale)
                        horizontalAlignment: Text.AlignHCenter
                        width: parent.width
                    }

                    Row {
                        anchors.horizontalCenter: parent.horizontalCenter
                        spacing: Math.round(16 * dlg.uiScale)

                        // Nút giảm
                        Rectangle {
                            anchors.verticalCenter: parent.verticalCenter
                            width: Math.round(76 * dlg.uiScale)
                            height: Math.round(68 * dlg.uiScale)
                            radius: Math.round(10 * dlg.uiScale)
                            color: commonMinusMA.pressed ? "#E0E0E0" : "white"

                            AppText {
                                anchors.centerIn: parent
                                text: "−"
                                color: "#3E26FF"
                                font.pixelSize: Math.round(36 * dlg.uiScale)
                                font.bold: true
                            }

                            MouseArea {
                                id: commonMinusMA
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    if (dlg.commonScoreVal > 0) dlg.commonScoreVal -= 1
                                }
                            }
                        }

                        // Giá trị
                        Rectangle {
                            anchors.verticalCenter: parent.verticalCenter
                            width: Math.round(76 * dlg.uiScale)
                            height: Math.round(68 * dlg.uiScale)
                            radius: Math.round(10 * dlg.uiScale)
                            color: "#3E26FF"
                            border.color: "white"
                            border.width: 2

                            AppText {
                                anchors.centerIn: parent
                                text: String(dlg.commonScoreVal)
                                color: "white"
                                font.pixelSize: Math.round(26 * dlg.uiScale)
                                font.bold: true
                            }
                        }

                        // Nút tăng
                        Rectangle {
                            anchors.verticalCenter: parent.verticalCenter
                            width: Math.round(76 * dlg.uiScale)
                            height: Math.round(68 * dlg.uiScale)
                            radius: Math.round(10 * dlg.uiScale)
                            color: commonPlusMA.pressed ? "#E0E0E0" : "white"

                            AppText {
                                anchors.centerIn: parent
                                text: "+"
                                color: "#3E26FF"
                                font.pixelSize: Math.round(36 * dlg.uiScale)
                                font.bold: true
                            }

                            MouseArea {
                                id: commonPlusMA
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: dlg.commonScoreVal += 1
                            }
                        }
                    }
                }
            }
            }
        }
    }
}

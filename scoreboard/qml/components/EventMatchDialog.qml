// qml/components/EventMatchDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import "."

DialogShell {
    id: dlg

    readonly property var rankOrder: ["I", "H", "G", "F", "E", "D", "C", "B", "A", "S"]

    property var activeEventData: (typeof EventService !== "undefined" && EventService) ? EventService.activeEvent : ({})
    property string eventTitle: (activeEventData && activeEventData.name) ? activeEventData.name : "Sự kiện"

    // Tiêu đề & nút chuẩn của DialogShell
    titleText:   eventTitle.toUpperCase() + " - GHÉP TRẬN"
    confirmText: "Bắt đầu trận đấu"
    cancelText:  "Đóng"
    showCloseButton: true

    fixedW: Math.round(860 * dlg.uiScale)
    minW:   Math.round(680 * dlg.uiScale)

    avoidKeyboard: false
    maxHeightRatio: 0.96
    initialFocusItem: p1Input
    property bool isClosing: false

    function checkCreationTimeError() {
        var ev = dlg.activeEventData
        if (!ev || (!ev.match_creation_time && !ev.match_creation_time_end)) return ""
        var now = new Date()
        var nowMin = now.getHours() * 60 + now.getMinutes()
        function parseMin(tStr) {
            if (!tStr) return null
            var parts = String(tStr).split(":")
            if (parts.length < 2) return null
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
        }
        function fmtTime(tStr) {
            if (!tStr) return ""
            return String(tStr).substring(0, 5)
        }
        var sMin = parseMin(ev.match_creation_time)
        var eMin = parseMin(ev.match_creation_time_end)
        var t1 = fmtTime(ev.match_creation_time)
        var t2 = fmtTime(ev.match_creation_time_end)

        if (sMin !== null && eMin !== null) {
            var ok = (sMin <= eMin) ? (nowMin >= sMin && nowMin <= eMin) : (nowMin >= sMin || nowMin <= eMin)
            if (!ok) return "Thời gian tạo trận đấu chỉ trong khung giờ từ " + t1 + " đến " + t2 + "!"
        } else if (sMin !== null) {
            if (nowMin < sMin) return "Thời gian tạo trận đấu chỉ bắt đầu từ " + t1 + "!"
        } else if (eMin !== null) {
            if (nowMin > eMin) return "Thời gian tạo trận đấu đã kết thúc lúc " + t2 + "!"
        }
        return ""
    }

    onOpened: {
        isClosing = false
        if (typeof win !== "undefined" && win) win.activeDialog = dlg
        var timeWarn = checkCreationTimeError()
        dlg.creationError = (timeWarn !== "") ? timeWarn : ""
        p1Input.forceActiveFocus()
        try { Qt.inputMethod.show() } catch(e) {}
    }

    onAboutToHide: {
        isClosing = true
        try { Qt.inputMethod.hide() } catch(e) {}
    }

    onClosed: {
        isClosing = true
        if (typeof win !== "undefined" && win && win.activeDialog === dlg) win.activeDialog = null
        try { Qt.inputMethod.hide() } catch(e) {}
    }

    buttonHeight:         Math.round(56 * dlg.uiScale)
    buttonMinWidth:       Math.round(200 * dlg.uiScale)
    buttonFontSize:       Math.round(20 * dlg.uiScale)
    titleFontSize:        Math.round(26 * dlg.uiScale)
    headerContentSpacing: Math.round(10 * dlg.uiScale)
    contentMargins:       Math.round(14 * dlg.uiScale)

    // Trạng thái cơ thủ 1
    property string p1Phone: ""
    property bool   p1Loading: false
    property bool   p1Found: false
    property var    p1Data: ({})
    property string p1Error: ""

    // Trạng thái cơ thủ 2
    property string p2Phone: ""
    property bool   p2Loading: false
    property bool   p2Found: false
    property var    p2Data: ({})
    property string p2Error: ""

    // Thể thức thi đấu linh hoạt
    readonly property int minRaceTo: 9
    property int selectedRaceTo: 9
    property int handicapMode: 0 // 0 = Đồng cơ, 1 = P1 chấp P2, 2 = P2 chấp P1
    property int handicapValue: 0 // 0, 1, 2, ...
    readonly property int effectiveHandicap: (handicapMode === 0) ? 0 : handicapValue
    readonly property int totalRounds: Math.max(0, (selectedRaceTo * 2 - 1) - effectiveHandicap)
    readonly property real winPoints: Number((totalRounds * 0.35).toFixed(2))
    readonly property real losePoints: Number((totalRounds * 0.05).toFixed(2))

    readonly property int p1StartScore: (handicapMode === 2 ? handicapValue : 0)
    readonly property int p2StartScore: (handicapMode === 1 ? handicapValue : 0)

    readonly property string matchFormatLabel: {
        if (handicapMode === 0 || handicapValue === 0) {
            return "Đồng cơ chạm " + selectedRaceTo
        }
        var pName = (handicapMode === 1) ? (dlg.p1Data.name || "Cơ thủ 1") : (dlg.p2Data.name || "Cơ thủ 2")
        return "Chạm " + selectedRaceTo + " - " + pName + " chấp " + handicapValue
    }

    // Lỗi khi tạo trận đấu
    property string creationError: ""

    function openWith() {
        isClosing = false
        resetState()
        if (typeof EventService !== "undefined" && EventService) {
            EventService.fetchActiveEvent()
        }
        open()
        Qt.callLater(function() {
            p1Input.forceActiveFocus()
            try { Qt.inputMethod.show() } catch(e) {}
        })
    }

    function resetState() {
        p1Input.text = ""
        p2Input.text = ""
        p1Phone = ""
        p1Loading = false
        p1Found = false
        p1Data = ({})
        p1Error = ""

        p2Phone = ""
        p2Loading = false
        p2Found = false
        p2Data = ({})
        p2Error = ""

        selectedRaceTo = 9
        handicapMode = 0
        handicapValue = 0
        try { if (typeof raceToInput !== "undefined" && raceToInput) raceToInput.text = "9" } catch(e) {}
        try { if (typeof handicapInput !== "undefined" && handicapInput) handicapInput.text = "0" } catch(e) {}
        creationError = ""
    }

    Connections {
        target: Qt.inputMethod
        function onVisibleChanged() {
            if (dlg.visible && !dlg.isClosing && !Qt.inputMethod.visible) {
                Qt.callLater(function() {
                    if (dlg.visible && !dlg.isClosing && !Qt.inputMethod.visible) {
                        if (!p1Input.activeFocus && !p2Input.activeFocus) {
                            if (!dlg.p1Found) {
                                p1Input.forceActiveFocus()
                                try { Qt.inputMethod.show() } catch(e) {}
                            } else if (!dlg.p2Found) {
                                p2Input.forceActiveFocus()
                                try { Qt.inputMethod.show() } catch(e) {}
                            }
                        }
                    }
                })
            }
        }
    }

    Connections {
        target: typeof EventService !== "undefined" && EventService ? EventService : null
        function onPlayerChecked(slotIndex, found, data, errorMsg) {
            dlg.creationError = ""
            if (slotIndex === 1) {
                dlg.p1Loading = false
                dlg.p1Found = found
                dlg.p1Data = data || ({})
                dlg.p1Error = found ? "" : (errorMsg || "Không tìm thấy")
                if (found && !dlg.p2Found && p2Input.text.trim().length === 0) {
                    p2Input.forceActiveFocus()
                    try { Qt.inputMethod.show() } catch(e) {}
                }
            } else if (slotIndex === 2) {
                dlg.p2Loading = false
                dlg.p2Found = found
                dlg.p2Data = data || ({})
                dlg.p2Error = found ? "" : (errorMsg || "Không tìm thấy")
            }
            dlg.evaluateRules()
        }

        function onMatchCreated(success, matchData, errorMsg) {
            if (success) {
                dlg.creationError = ""
                dlg.close()
                if (typeof Controller !== "undefined" && Controller) {
                    Controller.leftName = dlg.p1Data.name || "Cơ thủ 1"
                    Controller.rightName = dlg.p2Data.name || "Cơ thủ 2"
                    Controller.leftScore = dlg.p1StartScore
                    Controller.rightScore = dlg.p2StartScore
                    Controller.raceTo = dlg.selectedRaceTo
                }
                if (typeof TournamentService !== "undefined" && TournamentService) {
                    TournamentService.fetchActiveMatch()
                }
                if (typeof win !== "undefined" && win && typeof win.pushPage === "function") {
                    win.pushPage("pages/TournamentPage.qml", {
                        routeName: "tournamentPage",
                        backTo: "home"
                    })
                }
            } else {
                dlg.creationError = errorMsg || "Không thể tạo trận đấu sự kiện"
                console.log("[EventMatchDialog] Tạo trận đấu thất bại:", errorMsg)
            }
        }
    }

    function getRankIndex(rankStr) {
        if (!rankStr) return -1
        var r = String(rankStr).trim().toUpperCase().replace(/^HẠNG\s+/, '').replace(/^HANG\s+/, '')
        var idx = rankOrder.indexOf(r)
        if (idx !== -1) return idx
        var match = r.match(/LV\s*\.?\s*(\d+)/) || r.match(/^(\d+)$/)
        if (match) {
            var num = parseInt(match[1])
            if (num >= 1 && num <= 10) return num - 1
        }
        return -1
    }

    function formatLevel(rank) {
        if (typeof win !== "undefined" && win && typeof win.formatLevel === "function") {
            return win.formatLevel(rank)
        }
        if (!rank || rank === "N/A") return ""
        var cleanRank = String(rank).trim().toUpperCase().replace(/^HẠNG\s+/, '').replace(/^HANG\s+/, '')
        var hasPlus = cleanRank.endsWith('+')
        var base = hasPlus ? cleanRank.slice(0, -1).trim() : cleanRank
        var lvl = ""
        switch (base) {
            case 'I':
            case 'K': lvl = 'Lv .1'; break
            case 'H': lvl = 'Lv .2'; break
            case 'G': lvl = 'Lv .3'; break
            case 'F': lvl = 'Lv .4'; break
            case 'E': lvl = 'Lv .5'; break
            case 'D': lvl = 'Lv .6'; break
            case 'C': lvl = 'Lv .7'; break
            case 'B': lvl = 'Lv .8'; break
            case 'A': lvl = 'Lv .9'; break
            case 'S': lvl = 'Lv .10'; break
            default:
                if (base.indexOf('LV') === 0) lvl = base
                else if (/^\d+$/.test(base)) lvl = 'Lv .' + base
                else lvl = 'Lv .' + base
        }
        return hasPlus ? (lvl + "+") : lvl
    }

    function evaluateRules() {
        if (!p1Found || !p2Found) {
            return
        }
        if (selectedRaceTo < minRaceTo) {
            selectedRaceTo = minRaceTo
        }
        if (handicapValue >= selectedRaceTo) {
            handicapValue = Math.max(0, selectedRaceTo - 1)
        }
    }

    function triggerCheck(slot) {
        var phone = (slot === 1) ? p1Phone : p2Phone
        if (phone.length >= 9) {
            if (slot === 1) p1Loading = true
            else p2Loading = true
            EventService.checkPlayer(slot, phone)
        }
    }

    // Nút xác nhận của DialogShell
    confirmEnabled: (p1Found && p2Found && p1Data.id && p2Data.id && (p1Data.id !== p2Data.id) && selectedRaceTo >= minRaceTo)

    onConfirmed: {
        if (!p1Found || !p2Found || !p1Data.id || !p2Data.id) return
        if (selectedRaceTo < minRaceTo) {
            dlg.creationError = "Số chạm tối thiểu cho trận đấu sự kiện là " + minRaceTo + " ván!"
            return
        }
        var timeErr = checkCreationTimeError()
        if (timeErr !== "") {
            dlg.creationError = timeErr
            return
        }
        dlg.creationError = ""
        EventService.createMatch(
            p1Data.id,
            p2Data.id,
            selectedRaceTo,
            p1StartScore,
            p2StartScore,
            matchFormatLabel
        )
    }

    onCancelled: close()

    // ===== NỘI DUNG BODY CỦA DIALOGSHELL =====
    body: Column {
        id: bodyCol
        width: parent.width
        spacing: Math.round(10 * dlg.uiScale)

        // Hàng 2 thẻ cơ thủ
        RowLayout {
            width: parent.width
            spacing: Math.round(14 * dlg.uiScale)

            // === CƠ THỦ 1 ===
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: Math.round(124 * dlg.uiScale)
                Layout.alignment: Qt.AlignTop
                color: "transparent"
                border.width: 0

                ColumnLayout {
                    id: p1Col
                    anchors.fill: parent
                    anchors.margins: 0
                    spacing: Math.round(6 * dlg.uiScale)

                    RowLayout {
                        id: p1HeaderRow
                        Layout.fillWidth: true
                        AppText {
                            text: "CƠ THỦ 1"
                            color: "#172339"
                            font.bold: true
                            font.pixelSize: Math.round(16 * dlg.uiScale)
                        }
                        Item { Layout.fillWidth: true }
                        Rectangle {
                            visible: dlg.p1Found
                            radius: Math.round(5 * dlg.uiScale)
                            color: "#166534"
                            implicitHeight: Math.round(24 * dlg.uiScale)
                            implicitWidth: p1RankBadge.implicitWidth + 16
                            AppText {
                                id: p1RankBadge
                                anchors.centerIn: parent
                                text: dlg.formatLevel(dlg.p1Data.rank)
                                color: "#FFFFFF"
                                font.bold: true
                                font.pixelSize: Math.round(13 * dlg.uiScale)
                            }
                        }
                    }

                    // Ô nhập số điện thoại
                    Rectangle {
                        id: p1InputBox
                        Layout.fillWidth: true
                        implicitHeight: Math.round(54 * dlg.uiScale)
                        radius: Math.round(10 * dlg.uiScale)
                        color: "#2b3242"
                        border.color: dlg.p1Found ? "#4ADE80" : (p1Input.activeFocus ? "#60A5FA" : "#475569")
                        border.width: dlg.p1Found ? 2 : 1

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: Math.round(14 * dlg.uiScale)
                            anchors.rightMargin: Math.round(14 * dlg.uiScale)

                            TextInput {
                                id: p1Input
                                Layout.fillWidth: true
                                verticalAlignment: Text.AlignVCenter
                                font.family: (typeof win !== "undefined" && win) ? win.appFontFamily : "Montserrat"
                                font.pixelSize: Math.round(20 * dlg.uiScale)
                                font.bold: true
                                font.hintingPreference: Font.PreferFullHinting
                                renderType: Text.NativeRendering
                                color: "#EDEFF3"
                                cursorVisible: true
                                selectByMouse: true
                                clip: true
                                inputMethodHints: Qt.ImhDigitsOnly
                                maximumLength: 12

                                AppText {
                                    id: p1Placeholder
                                    text: "Nhập số điện thoại..."
                                    color: "#8891a7"
                                    font.pixelSize: Math.round(18 * dlg.uiScale)
                                    font.hintingPreference: Font.PreferFullHinting
                                    renderType: Text.NativeRendering
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: p1Input.text.length === 0 && !p1Input.activeFocus

                                    MouseArea {
                                        anchors.fill: parent
                                        onClicked: {
                                            p1Input.forceActiveFocus()
                                            try { Qt.inputMethod.show() } catch(e) {}
                                        }
                                    }
                                }

                                onActiveFocusChanged: {
                                    if (activeFocus) {
                                        try { Qt.inputMethod.show() } catch(e) {}
                                    }
                                }
                                onAccepted: {
                                    p2Input.forceActiveFocus()
                                    try { Qt.inputMethod.show() } catch(e) {}
                                }

                                onTextEdited: {
                                    dlg.p1Phone = text.trim()
                                    dlg.p1Found = false
                                    dlg.p1Data = ({})
                                    dlg.p1Error = ""
                                    checkTimer1.restart()
                                }
                            }

                            BusyIndicator {
                                running: dlg.p1Loading
                                visible: dlg.p1Loading
                                implicitWidth: Math.round(24 * dlg.uiScale)
                                implicitHeight: Math.round(24 * dlg.uiScale)
                            }
                        }

                        MouseArea {
                            anchors.fill: parent
                            z: -1
                            onClicked: {
                                p1Input.forceActiveFocus()
                                try { Qt.inputMethod.show() } catch(e) {}
                            }
                        }
                    }

                    Timer {
                        id: checkTimer1
                        interval: 400
                        repeat: false
                        onTriggered: dlg.triggerCheck(1)
                    }

                    // Thông tin cơ thủ tìm thấy hoặc thông báo lỗi
                    Item {
                        Layout.fillWidth: true
                        Layout.fillHeight: true

                        AppText {
                            visible: dlg.p1Found
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: dlg.p1Data.name || ""
                            color: "#166534"
                            font.bold: true
                            font.pixelSize: Math.round(20 * dlg.uiScale)
                            elide: Text.ElideRight
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p1Found && dlg.p1Error !== ""
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: dlg.p1Error
                            color: "#DC2626"
                            font.pixelSize: Math.round(13 * dlg.uiScale)
                            font.bold: true
                            wrapMode: Text.WordWrap
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p1Found && dlg.p1Error === "" && !dlg.p1Loading
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: "Nhập SĐT đã đăng ký sự kiện"
                            color: "#94A3B8"
                            font.pixelSize: Math.round(13 * dlg.uiScale)
                        }
                    }
                }
            }

            // VS giữa 2 cơ thủ - bỏ nền, căn giữa theo ô nhập SĐT
            Item {
                id: vsWrap
                Layout.preferredWidth: Math.round(36 * dlg.uiScale)
                Layout.preferredHeight: Math.round(124 * dlg.uiScale)
                Layout.alignment: Qt.AlignTop

                AppText {
                    id: vsLabel
                    anchors.horizontalCenter: parent.horizontalCenter
                    y: Math.round(p1InputBox.y + (p1InputBox.height - height) / 2 + 1 * dlg.uiScale)
                    text: "VS"
                    color: "#64748B"
                    font.bold: true
                    font.italic: false
                    font.pixelSize: Math.round(16 * dlg.uiScale)
                    font.hintingPreference: Font.PreferFullHinting
                    renderType: Text.NativeRendering
                }
            }

            // === CƠ THỦ 2 ===
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: Math.round(124 * dlg.uiScale)
                Layout.alignment: Qt.AlignTop
                color: "transparent"
                border.width: 0

                ColumnLayout {
                    id: p2Col
                    anchors.fill: parent
                    anchors.margins: 0
                    spacing: Math.round(6 * dlg.uiScale)

                    RowLayout {
                        id: p2HeaderRow
                        Layout.fillWidth: true
                        AppText {
                            text: "CƠ THỦ 2"
                            color: "#172339"
                            font.bold: true
                            font.pixelSize: Math.round(16 * dlg.uiScale)
                        }
                        Item { Layout.fillWidth: true }
                        Rectangle {
                            visible: dlg.p2Found
                            radius: Math.round(5 * dlg.uiScale)
                            color: "#166534"
                            implicitHeight: Math.round(24 * dlg.uiScale)
                            implicitWidth: p2RankBadge.implicitWidth + 16
                            AppText {
                                id: p2RankBadge
                                anchors.centerIn: parent
                                text: dlg.formatLevel(dlg.p2Data.rank)
                                color: "#FFFFFF"
                                font.bold: true
                                font.pixelSize: Math.round(13 * dlg.uiScale)
                            }
                        }
                    }

                    // Ô nhập số điện thoại
                    Rectangle {
                        id: p2InputBox
                        Layout.fillWidth: true
                        implicitHeight: Math.round(54 * dlg.uiScale)
                        radius: Math.round(10 * dlg.uiScale)
                        color: "#2b3242"
                        border.color: dlg.p2Found ? "#4ADE80" : (p2Input.activeFocus ? "#60A5FA" : "#475569")
                        border.width: dlg.p2Found ? 2 : 1

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: Math.round(14 * dlg.uiScale)
                            anchors.rightMargin: Math.round(14 * dlg.uiScale)

                            TextInput {
                                id: p2Input
                                Layout.fillWidth: true
                                verticalAlignment: Text.AlignVCenter
                                font.family: (typeof win !== "undefined" && win) ? win.appFontFamily : "Montserrat"
                                font.pixelSize: Math.round(20 * dlg.uiScale)
                                font.bold: true
                                font.hintingPreference: Font.PreferFullHinting
                                renderType: Text.NativeRendering
                                color: "#EDEFF3"
                                cursorVisible: true
                                selectByMouse: true
                                clip: true
                                inputMethodHints: Qt.ImhDigitsOnly
                                maximumLength: 12

                                AppText {
                                    id: p2Placeholder
                                    text: "Nhập số điện thoại..."
                                    color: "#8891a7"
                                    font.pixelSize: Math.round(18 * dlg.uiScale)
                                    font.hintingPreference: Font.PreferFullHinting
                                    renderType: Text.NativeRendering
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: p2Input.text.length === 0 && !p2Input.activeFocus

                                    MouseArea {
                                        anchors.fill: parent
                                        onClicked: {
                                            p2Input.forceActiveFocus()
                                            try { Qt.inputMethod.show() } catch(e) {}
                                        }
                                    }
                                }

                                onActiveFocusChanged: {
                                    if (activeFocus) {
                                        try { Qt.inputMethod.show() } catch(e) {}
                                    }
                                }
                                onAccepted: {
                                    if (dlg.confirmEnabled) {
                                        dlg.confirmed()
                                    } else {
                                        if (!dlg.p1Found) {
                                            p1Input.forceActiveFocus()
                                        } else {
                                            p2Input.forceActiveFocus()
                                        }
                                        try { Qt.inputMethod.show() } catch(e) {}
                                    }
                                }

                                onTextEdited: {
                                    dlg.p2Phone = text.trim()
                                    dlg.p2Found = false
                                    dlg.p2Data = ({})
                                    dlg.p2Error = ""
                                    checkTimer2.restart()
                                }
                            }

                            BusyIndicator {
                                running: dlg.p2Loading
                                visible: dlg.p2Loading
                                implicitWidth: Math.round(24 * dlg.uiScale)
                                implicitHeight: Math.round(24 * dlg.uiScale)
                            }
                        }

                        MouseArea {
                            anchors.fill: parent
                            z: -1
                            onClicked: {
                                p2Input.forceActiveFocus()
                                try { Qt.inputMethod.show() } catch(e) {}
                            }
                        }
                    }

                    Timer {
                        id: checkTimer2
                        interval: 400
                        repeat: false
                        onTriggered: dlg.triggerCheck(2)
                    }

                    // Thông tin cơ thủ tìm thấy hoặc thông báo lỗi
                    Item {
                        Layout.fillWidth: true
                        Layout.fillHeight: true

                        AppText {
                            visible: dlg.p2Found
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: dlg.p2Data.name || ""
                            color: "#166534"
                            font.bold: true
                            font.pixelSize: Math.round(20 * dlg.uiScale)
                            elide: Text.ElideRight
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p2Found && dlg.p2Error !== ""
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: dlg.p2Error
                            color: "#DC2626"
                            font.pixelSize: Math.round(13 * dlg.uiScale)
                            font.bold: true
                            wrapMode: Text.WordWrap
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p2Found && dlg.p2Error === "" && !dlg.p2Loading
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: "Nhập SĐT đã đăng ký sự kiện"
                            color: "#94A3B8"
                            font.pixelSize: Math.round(13 * dlg.uiScale)
                        }
                    }
                }
            }
        }

        // === THÔNG BÁO KHI CHƯA NHẬP ĐỦ 2 CƠ THỦ ===
        Rectangle {
            visible: !(dlg.p1Found && dlg.p2Found)
            width: parent.width
            implicitHeight: Math.round(46 * dlg.uiScale)
            radius: Math.round(10 * dlg.uiScale)
            color: "#F8FAFC"
            border.color: "#E2E8F0"
            border.width: 1

            AppText {
                anchors.centerIn: parent
                text: "Nhập số điện thoại 2 cơ thủ để thiết lập số Chạm, Chấp và tính điểm."
                color: "#64748B"
                font.pixelSize: Math.round(14 * dlg.uiScale)
            }
        }

        // === KHUNG CÀI ĐẶT THỂ THỨC (CHẠM & CHẤP & TÍNH ĐIỂM) ===
        Rectangle {
            visible: dlg.p1Found && dlg.p2Found
            width: parent.width
            implicitHeight: setupCol.implicitHeight + Math.round(24 * dlg.uiScale)
            radius: Math.round(14 * dlg.uiScale)
            color: "#F8FAFC"
            border.color: "#CBD5E1"
            border.width: 1

            ColumnLayout {
                id: setupCol
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.margins: Math.round(12 * dlg.uiScale)
                spacing: Math.round(12 * dlg.uiScale)

                // Tiêu đề thể thức
                RowLayout {
                    Layout.fillWidth: true
                    AppText {
                        text: "THỂ THỨC THI ĐẤU"
                        color: "#0F172A"
                        font.bold: true
                        font.pixelSize: Math.round(15 * dlg.uiScale)
                    }
                    Item { Layout.fillWidth: true }
                    AppText {
                        text: dlg.matchFormatLabel
                        color: "#16A34A"
                        font.bold: true
                        font.pixelSize: Math.round(15 * dlg.uiScale)
                    }
                }

                // HÀNG 2 Ô NHẬP LIỆU: SỐ CHẠM & SỐ VÁN CHẤP
                RowLayout {
                    Layout.fillWidth: true
                    spacing: Math.round(14 * dlg.uiScale)

                    // === Ô NHẬP SỐ CHẠM (RACE TO) ===
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: Math.round(6 * dlg.uiScale)

                        RowLayout {
                            Layout.fillWidth: true
                            AppText {
                                text: "SỐ CHẠM (RACE TO)"
                                color: "#0F172A"
                                font.bold: true
                                font.pixelSize: Math.round(14 * dlg.uiScale)
                            }
                            Item { Layout.fillWidth: true }
                            AppText {
                                text: dlg.selectedRaceTo < dlg.minRaceTo ? ("Tối thiểu chạm " + dlg.minRaceTo + "!") : ("Mục tiêu: " + dlg.selectedRaceTo + " ván")
                                color: dlg.selectedRaceTo < dlg.minRaceTo ? "#EF4444" : "#2563EB"
                                font.bold: true
                                font.pixelSize: Math.round(13 * dlg.uiScale)
                            }
                        }

                        // Khung nhập số Chạm
                        Rectangle {
                            Layout.fillWidth: true
                            implicitHeight: Math.round(52 * dlg.uiScale)
                            radius: Math.round(10 * dlg.uiScale)
                            color: "#2b3242"
                            border.color: dlg.selectedRaceTo < dlg.minRaceTo ? "#EF4444" : (raceToInput.activeFocus ? "#60A5FA" : "#475569")
                            border.width: (dlg.selectedRaceTo < dlg.minRaceTo || raceToInput.activeFocus) ? 2 : 1

                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: Math.round(6 * dlg.uiScale)
                                anchors.rightMargin: Math.round(6 * dlg.uiScale)
                                spacing: Math.round(6 * dlg.uiScale)

                                // Nút giảm
                                Rectangle {
                                    implicitWidth: Math.round(40 * dlg.uiScale)
                                    implicitHeight: Math.round(40 * dlg.uiScale)
                                    radius: Math.round(8 * dlg.uiScale)
                                    color: "#3b4354"
                                    AppText {
                                        anchors.centerIn: parent
                                        text: "−"
                                        font.bold: true
                                        font.pixelSize: Math.round(20 * dlg.uiScale)
                                        color: dlg.selectedRaceTo > dlg.minRaceTo ? "#EDEFF3" : "#64748B"
                                    }
                                    MouseArea {
                                        anchors.fill: parent
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            if (dlg.selectedRaceTo > dlg.minRaceTo) {
                                                dlg.selectedRaceTo--
                                                raceToInput.text = String(dlg.selectedRaceTo)
                                                if (dlg.handicapValue >= dlg.selectedRaceTo) {
                                                    dlg.handicapValue = Math.max(0, dlg.selectedRaceTo - 1)
                                                    handicapInput.text = String(dlg.handicapValue)
                                                }
                                            }
                                        }
                                    }
                                }

                                // Ô gõ số Chạm
                                TextInput {
                                    id: raceToInput
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true
                                    horizontalAlignment: Text.AlignHCenter
                                    verticalAlignment: Text.AlignVCenter
                                    font.family: (typeof win !== "undefined" && win) ? win.appFontFamily : "Montserrat"
                                    font.pixelSize: Math.round(24 * dlg.uiScale)
                                    font.bold: true
                                    color: dlg.selectedRaceTo < dlg.minRaceTo ? "#F87171" : "#FFFFFF"
                                    cursorVisible: activeFocus
                                    selectByMouse: true
                                    clip: true
                                    inputMethodHints: Qt.ImhDigitsOnly
                                    maximumLength: 3
                                    text: String(dlg.selectedRaceTo)

                                    onActiveFocusChanged: {
                                        if (activeFocus) {
                                            selectAll()
                                            try { Qt.inputMethod.show() } catch(e) {}
                                        } else {
                                            var val = parseInt(text.trim())
                                            if (isNaN(val) || val < dlg.minRaceTo) {
                                                dlg.selectedRaceTo = dlg.minRaceTo
                                                text = String(dlg.minRaceTo)
                                            }
                                        }
                                    }

                                    onTextEdited: {
                                        var val = parseInt(text.trim())
                                        if (!isNaN(val)) {
                                            dlg.selectedRaceTo = val
                                            if (dlg.handicapValue >= dlg.selectedRaceTo) {
                                                dlg.handicapValue = Math.max(0, dlg.selectedRaceTo - 1)
                                                handicapInput.text = String(dlg.handicapValue)
                                            }
                                        }
                                    }

                                    onEditingFinished: {
                                        var val = parseInt(text.trim())
                                        if (isNaN(val) || val < dlg.minRaceTo) {
                                            dlg.selectedRaceTo = dlg.minRaceTo
                                            text = String(dlg.minRaceTo)
                                        } else {
                                            dlg.selectedRaceTo = val
                                            text = String(val)
                                        }
                                    }
                                }

                                // Nút tăng
                                Rectangle {
                                    implicitWidth: Math.round(40 * dlg.uiScale)
                                    implicitHeight: Math.round(40 * dlg.uiScale)
                                    radius: Math.round(8 * dlg.uiScale)
                                    color: "#3b4354"
                                    AppText {
                                        anchors.centerIn: parent
                                        text: "+"
                                        font.bold: true
                                        font.pixelSize: Math.round(20 * dlg.uiScale)
                                        color: dlg.selectedRaceTo < 99 ? "#EDEFF3" : "#64748B"
                                    }
                                    MouseArea {
                                        anchors.fill: parent
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            if (dlg.selectedRaceTo < 99) {
                                                dlg.selectedRaceTo++
                                                raceToInput.text = String(dlg.selectedRaceTo)
                                            }
                                        }
                                    }
                                }
                            }

                            MouseArea {
                                anchors.fill: parent
                                z: -1
                                onClicked: {
                                    raceToInput.forceActiveFocus()
                                    try { Qt.inputMethod.show() } catch(e) {}
                                }
                            }
                        }
                    }

                    // === Ô NHẬP SỐ VÁN CHẤP ===
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: Math.round(6 * dlg.uiScale)

                        RowLayout {
                            Layout.fillWidth: true
                            AppText {
                                text: "SỐ VÁN CHẤP"
                                color: "#0F172A"
                                font.bold: true
                                font.pixelSize: Math.round(14 * dlg.uiScale)
                            }
                            Item { Layout.fillWidth: true }
                            AppText {
                                text: dlg.handicapMode === 0 ? "Đồng cơ (0 ván)" : ("Chấp: " + dlg.handicapValue + " ván")
                                color: dlg.handicapMode === 0 ? "#64748B" : "#D97706"
                                font.bold: true
                                font.pixelSize: Math.round(13 * dlg.uiScale)
                            }
                        }

                        // Khung nhập số ván chấp
                        Rectangle {
                            Layout.fillWidth: true
                            implicitHeight: Math.round(52 * dlg.uiScale)
                            radius: Math.round(10 * dlg.uiScale)
                            color: dlg.handicapMode === 0 ? "#222733" : "#2b3242"
                            border.color: handicapInput.activeFocus ? "#F59E0B" : (dlg.handicapMode === 0 ? "#334155" : "#475569")
                            border.width: handicapInput.activeFocus ? 2 : 1

                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: Math.round(6 * dlg.uiScale)
                                anchors.rightMargin: Math.round(6 * dlg.uiScale)
                                spacing: Math.round(6 * dlg.uiScale)

                                // Nút giảm
                                Rectangle {
                                    implicitWidth: Math.round(40 * dlg.uiScale)
                                    implicitHeight: Math.round(40 * dlg.uiScale)
                                    radius: Math.round(8 * dlg.uiScale)
                                    color: "#3b4354"
                                    AppText {
                                        anchors.centerIn: parent
                                        text: "−"
                                        font.bold: true
                                        font.pixelSize: Math.round(20 * dlg.uiScale)
                                        color: dlg.handicapValue > 0 ? "#EDEFF3" : "#64748B"
                                    }
                                    MouseArea {
                                        anchors.fill: parent
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            if (dlg.handicapValue > 0) {
                                                dlg.handicapValue--
                                                handicapInput.text = String(dlg.handicapValue)
                                                if (dlg.handicapValue === 0) dlg.handicapMode = 0
                                            }
                                        }
                                    }
                                }

                                // Ô gõ số Ván Chấp
                                TextInput {
                                    id: handicapInput
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true
                                    horizontalAlignment: Text.AlignHCenter
                                    verticalAlignment: Text.AlignVCenter
                                    font.family: (typeof win !== "undefined" && win) ? win.appFontFamily : "Montserrat"
                                    font.pixelSize: Math.round(24 * dlg.uiScale)
                                    font.bold: true
                                    color: dlg.handicapMode === 0 ? "#94A3B8" : "#FBBF24"
                                    cursorVisible: activeFocus
                                    selectByMouse: true
                                    clip: true
                                    inputMethodHints: Qt.ImhDigitsOnly
                                    maximumLength: 2
                                    text: String(dlg.handicapValue)

                                    onActiveFocusChanged: {
                                        if (activeFocus) {
                                            selectAll()
                                            try { Qt.inputMethod.show() } catch(e) {}
                                        }
                                    }

                                    onTextEdited: {
                                        var val = parseInt(text.trim())
                                        if (!isNaN(val) && val >= 0) {
                                            if (val >= dlg.selectedRaceTo) {
                                                val = Math.max(0, dlg.selectedRaceTo - 1)
                                            }
                                            dlg.handicapValue = val
                                            if (val === 0) {
                                                dlg.handicapMode = 0
                                            } else if (dlg.handicapMode === 0) {
                                                dlg.handicapMode = 1
                                            }
                                        } else if (text.trim() === "") {
                                            dlg.handicapValue = 0
                                            dlg.handicapMode = 0
                                        }
                                    }
                                }

                                // Nút tăng
                                Rectangle {
                                    implicitWidth: Math.round(40 * dlg.uiScale)
                                    implicitHeight: Math.round(40 * dlg.uiScale)
                                    radius: Math.round(8 * dlg.uiScale)
                                    color: "#3b4354"
                                    AppText {
                                        anchors.centerIn: parent
                                        text: "+"
                                        font.bold: true
                                        font.pixelSize: Math.round(20 * dlg.uiScale)
                                        color: dlg.handicapValue < (dlg.selectedRaceTo - 1) ? "#EDEFF3" : "#64748B"
                                    }
                                    MouseArea {
                                        anchors.fill: parent
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            if (dlg.handicapValue < (dlg.selectedRaceTo - 1)) {
                                                dlg.handicapValue++
                                                handicapInput.text = String(dlg.handicapValue)
                                                if (dlg.handicapMode === 0) dlg.handicapMode = 1
                                            }
                                        }
                                    }
                                }
                            }

                            MouseArea {
                                anchors.fill: parent
                                z: -1
                                onClicked: {
                                    if (dlg.handicapMode === 0) {
                                        dlg.handicapMode = 1
                                        if (dlg.handicapValue <= 0) dlg.handicapValue = 1
                                        handicapInput.text = String(dlg.handicapValue)
                                    }
                                    handicapInput.forceActiveFocus()
                                    try { Qt.inputMethod.show() } catch(e) {}
                                }
                            }
                        }
                    }
                }

                // CHỌN CƠ THỦ CHẤP: Đồng cơ | P1 chấp | P2 chấp
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: Math.round(6 * dlg.uiScale)

                    AppText {
                        text: "Bên chấp điểm:"
                        color: "#475569"
                        font.bold: true
                        font.pixelSize: Math.round(13 * dlg.uiScale)
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: Math.round(8 * dlg.uiScale)

                        // Đồng cơ
                        Rectangle {
                            Layout.fillWidth: true
                            implicitHeight: Math.round(44 * dlg.uiScale)
                            radius: Math.round(8 * dlg.uiScale)
                            readonly property bool isSelected: dlg.handicapMode === 0
                            color: isSelected ? "#0F172A" : "#FFFFFF"
                            border.color: isSelected ? "#0F172A" : "#CBD5E1"
                            border.width: isSelected ? 2 : 1

                            AppText {
                                anchors.centerIn: parent
                                text: "Đồng cơ (Không chấp)"
                                color: parent.isSelected ? "#FFFFFF" : "#1E293B"
                                font.bold: parent.isSelected
                                font.pixelSize: Math.round(14 * dlg.uiScale)
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    dlg.handicapMode = 0
                                    dlg.handicapValue = 0
                                    handicapInput.text = "0"
                                }
                            }
                        }

                        // P1 chấp
                        Rectangle {
                            Layout.fillWidth: true
                            implicitHeight: Math.round(44 * dlg.uiScale)
                            radius: Math.round(8 * dlg.uiScale)
                            readonly property bool isSelected: dlg.handicapMode === 1
                            color: isSelected ? "#0F172A" : "#FFFFFF"
                            border.color: isSelected ? "#0F172A" : "#CBD5E1"
                            border.width: isSelected ? 2 : 1

                            AppText {
                                anchors.centerIn: parent
                                text: (dlg.p1Data.name ? (dlg.p1Data.name + " chấp") : "Cơ thủ 1 chấp")
                                color: parent.isSelected ? "#FFFFFF" : "#1E293B"
                                font.bold: parent.isSelected
                                font.pixelSize: Math.round(14 * dlg.uiScale)
                                elide: Text.ElideRight
                                width: parent.width - 12
                                horizontalAlignment: Text.AlignHCenter
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    dlg.handicapMode = 1
                                    if (dlg.handicapValue <= 0) dlg.handicapValue = 1
                                    handicapInput.text = String(dlg.handicapValue)
                                    handicapInput.forceActiveFocus()
                                    try { Qt.inputMethod.show() } catch(e) {}
                                }
                            }
                        }

                        // P2 chấp
                        Rectangle {
                            Layout.fillWidth: true
                            implicitHeight: Math.round(44 * dlg.uiScale)
                            radius: Math.round(8 * dlg.uiScale)
                            readonly property bool isSelected: dlg.handicapMode === 2
                            color: isSelected ? "#0F172A" : "#FFFFFF"
                            border.color: isSelected ? "#0F172A" : "#CBD5E1"
                            border.width: isSelected ? 2 : 1

                            AppText {
                                anchors.centerIn: parent
                                text: (dlg.p2Data.name ? (dlg.p2Data.name + " chấp") : "Cơ thủ 2 chấp")
                                color: parent.isSelected ? "#FFFFFF" : "#1E293B"
                                font.bold: parent.isSelected
                                font.pixelSize: Math.round(14 * dlg.uiScale)
                                elide: Text.ElideRight
                                width: parent.width - 12
                                horizontalAlignment: Text.AlignHCenter
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    dlg.handicapMode = 2
                                    if (dlg.handicapValue <= 0) dlg.handicapValue = 1
                                    handicapInput.text = String(dlg.handicapValue)
                                    handicapInput.forceActiveFocus()
                                    try { Qt.inputMethod.show() } catch(e) {}
                                }
                            }
                        }
                    }
                }

                // Đồng bộ 2 ô nhập liệu khi dlg thay đổi giá trị
                Connections {
                    target: dlg
                    function onSelectedRaceToChanged() {
                        if (!raceToInput.activeFocus) {
                            raceToInput.text = String(dlg.selectedRaceTo)
                        }
                    }
                    function onHandicapValueChanged() {
                        if (!handicapInput.activeFocus) {
                            handicapInput.text = String(dlg.handicapValue)
                        }
                    }
                }

                // 3. LIVE CALCULATION CARD (CÔNG THỨC HỆ SỐ MỚI)
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: calcCol.implicitHeight + Math.round(16 * dlg.uiScale)
                    radius: Math.round(10 * dlg.uiScale)
                    color: "#FFFFFF"
                    border.color: "#CBD5E1"
                    border.width: 1

                    ColumnLayout {
                        id: calcCol
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.top: parent.top
                        anchors.margins: Math.round(10 * dlg.uiScale)
                        spacing: Math.round(6 * dlg.uiScale)

                        // Dòng công thức quy đổi
                        RowLayout {
                            Layout.fillWidth: true
                            AppText {
                                text: "Tổng số trận quy đổi:"
                                color: "#475569"
                                font.pixelSize: Math.round(13 * dlg.uiScale)
                            }
                            Item { Layout.fillWidth: true }
                            AppText {
                                text: "(" + dlg.selectedRaceTo + " × 2 - 1) - " + dlg.effectiveHandicap + " = " + dlg.totalRounds + " ván"
                                color: "#0F172A"
                                font.bold: true
                                font.pixelSize: Math.round(15 * dlg.uiScale)
                            }
                        }

                        // Dòng điểm thắng / điểm thua
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: Math.round(10 * dlg.uiScale)

                            Rectangle {
                                Layout.fillWidth: true
                                implicitHeight: Math.round(36 * dlg.uiScale)
                                radius: Math.round(8 * dlg.uiScale)
                                color: "#ECFDF5"
                                border.color: "#A7F3D0"
                                border.width: 1

                                RowLayout {
                                    anchors.centerIn: parent
                                    spacing: Math.round(6 * dlg.uiScale)
                                    AppText {
                                        text: "Thắng (x0.35):"
                                        color: "#065F46"
                                        font.pixelSize: Math.round(13 * dlg.uiScale)
                                    }
                                    AppText {
                                        text: "+" + dlg.winPoints + " điểm"
                                        color: "#047857"
                                        font.bold: true
                                        font.pixelSize: Math.round(15 * dlg.uiScale)
                                    }
                                }
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                implicitHeight: Math.round(36 * dlg.uiScale)
                                radius: Math.round(8 * dlg.uiScale)
                                color: "#F8FAFC"
                                border.color: "#E2E8F0"
                                border.width: 1

                                RowLayout {
                                    anchors.centerIn: parent
                                    spacing: Math.round(6 * dlg.uiScale)
                                    AppText {
                                        text: "Thua (x0.05):"
                                        color: "#475569"
                                        font.pixelSize: Math.round(13 * dlg.uiScale)
                                    }
                                    AppText {
                                        text: "+" + dlg.losePoints + " điểm"
                                        color: "#334155"
                                        font.bold: true
                                        font.pixelSize: Math.round(15 * dlg.uiScale)
                                    }
                                }
                            }
                        }

                        // Ghi chú bonus + giới hạn cày điểm
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: Math.round(4 * dlg.uiScale)
                            AppText {
                                Layout.fillWidth: true
                                text: "⭐ Chạm trán lần đầu: +20đ/người (1 lần/tháng)  •  Tối đa 3 trận tính điểm/ngày giữa 2 cơ thủ"
                                color: "#B45309"
                                font.pixelSize: Math.round(12 * dlg.uiScale)
                                font.italic: true
                                wrapMode: Text.WordWrap
                            }
                        }
                    }
                }
            }
        }

        // Hiển thị lỗi tạo trận nếu có
        Rectangle {
            visible: dlg.creationError !== ""
            width: parent.width
            implicitHeight: errRow.implicitHeight + Math.round(16 * dlg.uiScale)
            radius: Math.round(10 * dlg.uiScale)
            color: "#FEF2F2"
            border.color: "#FCA5A5"
            border.width: 1

            RowLayout {
                id: errRow
                anchors.fill: parent
                anchors.margins: Math.round(10 * dlg.uiScale)
                spacing: Math.round(10 * dlg.uiScale)

                AppText {
                    text: "⚠️"
                    font.pixelSize: Math.round(18 * dlg.uiScale)
                }

                AppText {
                    Layout.fillWidth: true
                    text: dlg.creationError
                    color: "#DC2626"
                    font.pixelSize: Math.round(14 * dlg.uiScale)
                    font.bold: true
                    wrapMode: Text.Wrap
                }
            }
        }
    }
}

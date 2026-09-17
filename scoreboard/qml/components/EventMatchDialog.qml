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

    avoidKeyboard: true
    keyboardMargin: Math.round(16 * dlg.uiScale)

    buttonHeight:         Math.round(56 * dlg.uiScale)
    buttonMinWidth:       Math.round(150 * dlg.uiScale)
    buttonFontSize:       Math.round(18 * dlg.uiScale)
    titleFontSize:        Math.round(24 * dlg.uiScale)
    headerContentSpacing: Math.round(14 * dlg.uiScale)
    contentMargins:       Math.round(18 * dlg.uiScale)

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

    // Thể thức thi đấu
    property string selectedMode: ""
    property int    selectedRaceTo: 9
    property int    p1StartScore: 0
    property int    p2StartScore: 0
    property string matchFormatLabel: ""

    // Lỗi khi tạo trận đấu
    property string creationError: ""

    function openWith() {
        resetState()
        if (typeof EventService !== "undefined" && EventService) {
            EventService.fetchActiveEvent()
        }
        open()
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

        selectedMode = ""
        selectedRaceTo = 9
        p1StartScore = 0
        p2StartScore = 0
        matchFormatLabel = ""
        creationError = ""
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
            selectedMode = ""
            return
        }

        var r1 = getRankIndex(p1Data.rank)
        var r2 = getRankIndex(p2Data.rank)
        var diff = Math.abs(r1 - r2)

        if (diff === 0) {
            if (selectedMode !== "draw_9" && selectedMode !== "draw_11") {
                setDrawMode(9)
            }
        } else {
            if (selectedMode !== "handicap_1" && selectedMode !== "handicap_2") {
                setHandicapMode(1)
            }
        }
    }

    function setDrawMode(touchVal) {
        var ev = activeEventData || ({})
        // touchVal là 9 hoặc 11 (raceTo)
        // ev.draw_touch và ev.draw_touch_11 là điểm thưởng người thắng (mặc định 5 và 7)
        var winPoints = (touchVal === 11) ? (parseInt(ev.draw_touch_11 || 7) || 7) : (parseInt(ev.draw_touch || 5) || 5)
        selectedMode = (touchVal === 11) ? "draw_11" : "draw_9"
        selectedRaceTo = touchVal
        p1StartScore = 0
        p2StartScore = 0
        matchFormatLabel = "Đồng cơ chạm " + touchVal
    }

    function setHandicapMode(handicapPoints) {
        var ev = activeEventData || ({})
        var r1 = getRankIndex(p1Data.rank)
        var r2 = getRankIndex(p2Data.rank)
        var p1IsFav = (r1 >= r2)

        if (handicapPoints === 2) {
            // Chạm 13 chấp 2, người thắng nhận điểm từ handicap_2_touch (mặc định 7)
            var winPoints = parseInt(ev.handicap_2_touch || 7) || 7
            selectedMode = "handicap_2"
            selectedRaceTo = 13
            p1StartScore = 0
            p2StartScore = 0
            matchFormatLabel = "Chạm 13 chấp 2"
        } else {
            // Chạm 8 chấp 1, người thắng nhận điểm từ handicap_1_touch (mặc định 5), người thua nhận 1 điểm
            var winPoints = parseInt(ev.handicap_1_touch || 5) || 5
            selectedMode = "handicap_1"
            selectedRaceTo = 8
            p1StartScore = 0
            p2StartScore = 0
            matchFormatLabel = "Chạm 8 chấp 1"
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
    confirmEnabled: (p1Found && p2Found && selectedMode !== "")

    onConfirmed: {
        if (!p1Found || !p2Found || !p1Data.id || !p2Data.id) return
        if (!selectedMode) return
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
        spacing: Math.round(12 * dlg.uiScale)

        // Hàng 2 thẻ cơ thủ
        RowLayout {
            width: parent.width
            spacing: Math.round(14 * dlg.uiScale)

            // === CƠ THỦ 1 ===
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: Math.round(136 * dlg.uiScale)
                radius: Math.round(12 * dlg.uiScale)
                color: dlg.p1Found ? "#F0FDF4" : "#F8FAFC"
                border.color: dlg.p1Found ? "#86EFAC" : (p1Input.activeFocus ? "#172339" : "#E2E8F0")
                border.width: dlg.p1Found || p1Input.activeFocus ? 2 : 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: Math.round(12 * dlg.uiScale)
                    spacing: Math.round(6 * dlg.uiScale)

                    RowLayout {
                        Layout.fillWidth: true
                        AppText {
                            text: "CƠ THỦ 1"
                            color: "#172339"
                            font.bold: true
                            font.pixelSize: Math.round(15 * dlg.uiScale)
                        }
                        Item { Layout.fillWidth: true }
                        Rectangle {
                            visible: dlg.p1Found
                            radius: Math.round(5 * dlg.uiScale)
                            color: "#166534"
                            implicitHeight: Math.round(22 * dlg.uiScale)
                            implicitWidth: p1RankBadge.implicitWidth + 14
                            AppText {
                                id: p1RankBadge
                                anchors.centerIn: parent
                                text: dlg.formatLevel(dlg.p1Data.rank)
                                color: "#FFFFFF"
                                font.bold: true
                                font.pixelSize: Math.round(12 * dlg.uiScale)
                            }
                        }
                    }

                    // Ô nhập số điện thoại
                    Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: Math.round(44 * dlg.uiScale)
                        radius: Math.round(8 * dlg.uiScale)
                        color: "#FFFFFF"
                        border.color: p1Input.activeFocus ? "#172339" : "#CBD5E1"
                        border.width: 1

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: Math.round(12 * dlg.uiScale)
                            anchors.rightMargin: Math.round(12 * dlg.uiScale)

                            TextInput {
                                id: p1Input
                                Layout.fillWidth: true
                                verticalAlignment: Text.AlignVCenter
                                font.pixelSize: Math.round(16 * dlg.uiScale)
                                font.bold: true
                                color: "#172339"
                                clip: true
                                inputMethodHints: Qt.ImhDigitsOnly
                                maximumLength: 12

                                AppText {
                                    text: "Nhập số điện thoại..."
                                    color: "#94A3B8"
                                    font.pixelSize: Math.round(14 * dlg.uiScale)
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: p1Input.text.length === 0 && !p1Input.activeFocus
                                }

                                onActiveFocusChanged: if (activeFocus) Qt.inputMethod.show()
                                onAccepted: p2Input.forceActiveFocus()

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
                                implicitWidth: Math.round(20 * dlg.uiScale)
                                implicitHeight: Math.round(20 * dlg.uiScale)
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
                            font.pixelSize: Math.round(17 * dlg.uiScale)
                            elide: Text.ElideRight
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p1Found && dlg.p1Error !== ""
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: dlg.p1Error
                            color: "#DC2626"
                            font.pixelSize: Math.round(12 * dlg.uiScale)
                            wrapMode: Text.WordWrap
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p1Found && dlg.p1Error === "" && !dlg.p1Loading
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: "Nhập SĐT đã đăng ký sự kiện"
                            color: "#94A3B8"
                            font.pixelSize: Math.round(12 * dlg.uiScale)
                        }
                    }
                }
            }

            // VS Icon giữa 2 cơ thủ
            Rectangle {
                implicitWidth: Math.round(36 * dlg.uiScale)
                implicitHeight: Math.round(36 * dlg.uiScale)
                radius: width / 2
                color: "#172339"
                Layout.alignment: Qt.AlignVCenter
                AppText {
                    anchors.centerIn: parent
                    text: "VS"
                    color: "#FFFFFF"
                    font.bold: true
                    font.pixelSize: Math.round(13 * dlg.uiScale)
                }
            }

            // === CƠ THỦ 2 ===
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: Math.round(136 * dlg.uiScale)
                radius: Math.round(12 * dlg.uiScale)
                color: dlg.p2Found ? "#F0FDF4" : "#F8FAFC"
                border.color: dlg.p2Found ? "#86EFAC" : (p2Input.activeFocus ? "#172339" : "#E2E8F0")
                border.width: dlg.p2Found || p2Input.activeFocus ? 2 : 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: Math.round(12 * dlg.uiScale)
                    spacing: Math.round(6 * dlg.uiScale)

                    RowLayout {
                        Layout.fillWidth: true
                        AppText {
                            text: "CƠ THỦ 2"
                            color: "#172339"
                            font.bold: true
                            font.pixelSize: Math.round(15 * dlg.uiScale)
                        }
                        Item { Layout.fillWidth: true }
                        Rectangle {
                            visible: dlg.p2Found
                            radius: Math.round(5 * dlg.uiScale)
                            color: "#166534"
                            implicitHeight: Math.round(22 * dlg.uiScale)
                            implicitWidth: p2RankBadge.implicitWidth + 14
                            AppText {
                                id: p2RankBadge
                                anchors.centerIn: parent
                                text: dlg.formatLevel(dlg.p2Data.rank)
                                color: "#FFFFFF"
                                font.bold: true
                                font.pixelSize: Math.round(12 * dlg.uiScale)
                            }
                        }
                    }

                    // Ô nhập số điện thoại
                    Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: Math.round(44 * dlg.uiScale)
                        radius: Math.round(8 * dlg.uiScale)
                        color: "#FFFFFF"
                        border.color: p2Input.activeFocus ? "#172339" : "#CBD5E1"
                        border.width: 1

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: Math.round(12 * dlg.uiScale)
                            anchors.rightMargin: Math.round(12 * dlg.uiScale)

                            TextInput {
                                id: p2Input
                                Layout.fillWidth: true
                                verticalAlignment: Text.AlignVCenter
                                font.pixelSize: Math.round(16 * dlg.uiScale)
                                font.bold: true
                                color: "#172339"
                                clip: true
                                inputMethodHints: Qt.ImhDigitsOnly
                                maximumLength: 12

                                AppText {
                                    text: "Nhập số điện thoại..."
                                    color: "#94A3B8"
                                    font.pixelSize: Math.round(14 * dlg.uiScale)
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: p2Input.text.length === 0 && !p2Input.activeFocus
                                }

                                onActiveFocusChanged: if (activeFocus) Qt.inputMethod.show()
                                onAccepted: {
                                    if (dlg.confirmEnabled) dlg.confirmed()
                                    else Qt.inputMethod.hide()
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
                                implicitWidth: Math.round(20 * dlg.uiScale)
                                implicitHeight: Math.round(20 * dlg.uiScale)
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
                            font.pixelSize: Math.round(17 * dlg.uiScale)
                            elide: Text.ElideRight
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p2Found && dlg.p2Error !== ""
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: dlg.p2Error
                            color: "#DC2626"
                            font.pixelSize: Math.round(12 * dlg.uiScale)
                            wrapMode: Text.WordWrap
                            width: parent.width
                        }

                        AppText {
                            visible: !dlg.p2Found && dlg.p2Error === "" && !dlg.p2Loading
                            anchors.left: parent.left
                            anchors.verticalCenter: parent.verticalCenter
                            text: "Nhập SĐT đã đăng ký sự kiện"
                            color: "#94A3B8"
                            font.pixelSize: Math.round(12 * dlg.uiScale)
                        }
                    }
                }
            }
        }

        // === KHUNG CHỌN THỂ THỨC THI ĐẤU ===
        Rectangle {
            width: parent.width
            implicitHeight: Math.round(112 * dlg.uiScale)
            radius: Math.round(12 * dlg.uiScale)
            color: "#F8FAFC"
            border.color: (dlg.p1Found && dlg.p2Found) ? "#172339" : "#E2E8F0"
            border.width: 1

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Math.round(12 * dlg.uiScale)
                spacing: Math.round(8 * dlg.uiScale)

                RowLayout {
                    Layout.fillWidth: true
                    AppText {
                        text: "THỂ THỨC THI ĐẤU"
                        color: "#172339"
                        font.bold: true
                        font.pixelSize: Math.round(14 * dlg.uiScale)
                    }
                    Item { Layout.fillWidth: true }
                    AppText {
                        visible: dlg.p1Found && dlg.p2Found
                        text: dlg.matchFormatLabel
                        color: "#16A34A"
                        font.bold: true
                        font.pixelSize: Math.round(14 * dlg.uiScale)
                    }
                }

                // Thông báo khi chưa nhập đủ 2 cơ thủ
                AppText {
                    visible: !(dlg.p1Found && dlg.p2Found)
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
                    text: "Nhập số điện thoại 2 cơ thủ để hệ thống kiểm tra và xác định thể thức thi đấu."
                    color: "#94A3B8"
                    font.pixelSize: Math.round(13 * dlg.uiScale)
                }

                // Khi đã xác thực đủ 2 cơ thủ: Các nút lựa chọn thể thức
                RowLayout {
                    visible: dlg.p1Found && dlg.p2Found
                    Layout.fillWidth: true
                    spacing: Math.round(12 * dlg.uiScale)

                    readonly property int r1: dlg.getRankIndex(dlg.p1Data.rank)
                    readonly property int r2: dlg.getRankIndex(dlg.p2Data.rank)
                    readonly property bool isEqual: (r1 === r2)
                    readonly property bool p1IsFav: (r1 >= r2)

                    // Nút Lựa chọn 1
                    Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: Math.round(52 * dlg.uiScale)
                        radius: Math.round(10 * dlg.uiScale)
                        readonly property bool isSelected: parent.isEqual ? (dlg.selectedMode === "draw_9") : (dlg.selectedMode === "handicap_1")
                        color: isSelected ? "#172339" : "#FFFFFF"
                        border.color: isSelected ? "#172339" : "#CBD5E1"
                        border.width: isSelected ? 2 : 1

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (parent.parent.isEqual) dlg.setDrawMode(9)
                                else dlg.setHandicapMode(1)
                            }
                        }

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 1
                            AppText {
                                Layout.alignment: Qt.AlignHCenter
                                text: parent.parent.parent.isEqual ? "Đồng cơ chạm 9" : "Chạm 8 chấp 1"
                                color: parent.parent.isSelected ? "#FFFFFF" : "#172339"
                                font.bold: true
                                font.pixelSize: Math.round(15 * dlg.uiScale)
                            }
                            AppText {
                                Layout.alignment: Qt.AlignHCenter
                                text: parent.parent.parent.isEqual 
                                    ? ("Thắng nhận " + (dlg.activeEventData.draw_touch || "5") + "đ • Thua +1đ") 
                                    : ((parent.parent.parent.p1IsFav ? (dlg.p1Data.name + " chấp 1") : (dlg.p2Data.name + " chấp 1")) + " • Thắng +" + (dlg.activeEventData.handicap_1_touch || "5") + "đ • Thua +1đ")
                                color: parent.parent.isSelected ? "#86EFAC" : "#64748B"
                                font.pixelSize: Math.round(11 * dlg.uiScale)
                            }
                        }
                    }

                    // Nút Lựa chọn 2
                    Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: Math.round(52 * dlg.uiScale)
                        radius: Math.round(10 * dlg.uiScale)
                        readonly property bool isSelected: parent.isEqual ? (dlg.selectedMode === "draw_11") : (dlg.selectedMode === "handicap_2")
                        color: isSelected ? "#172339" : "#FFFFFF"
                        border.color: isSelected ? "#172339" : "#CBD5E1"
                        border.width: isSelected ? 2 : 1

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (parent.parent.isEqual) dlg.setDrawMode(11)
                                else dlg.setHandicapMode(2)
                            }
                        }

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 1
                            AppText {
                                Layout.alignment: Qt.AlignHCenter
                                text: parent.parent.parent.isEqual ? "Đồng cơ chạm 11" : "Chạm 13 chấp 2"
                                color: parent.parent.isSelected ? "#FFFFFF" : "#172339"
                                font.bold: true
                                font.pixelSize: Math.round(15 * dlg.uiScale)
                            }
                            AppText {
                                Layout.alignment: Qt.AlignHCenter
                                text: parent.parent.parent.isEqual 
                                    ? ("Thắng nhận " + (dlg.activeEventData.draw_touch_11 || "7") + "đ • Thua +2đ") 
                                    : ((parent.parent.parent.p1IsFav ? (dlg.p1Data.name + " chấp 2") : (dlg.p2Data.name + " chấp 2")) + " • Thắng +" + (dlg.activeEventData.handicap_2_touch || "7") + "đ • Thua +2đ")
                                color: parent.parent.isSelected ? "#86EFAC" : "#64748B"
                                font.pixelSize: Math.round(11 * dlg.uiScale)
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
                    font.pixelSize: Math.round(16 * dlg.uiScale)
                }

                AppText {
                    Layout.fillWidth: true
                    text: dlg.creationError
                    color: "#DC2626"
                    font.pixelSize: Math.round(13 * dlg.uiScale)
                    font.bold: true
                    wrapMode: Text.Wrap
                }
            }
        }
    }
}

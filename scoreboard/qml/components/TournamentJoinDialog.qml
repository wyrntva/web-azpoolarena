import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6
import "."

DialogShell {
    id: root

    property string leftName: "Player 1"
    property string rightName: "Player 2"

    property bool leftConfirmed: false
    property bool rightConfirmed: false

    property int btnW: Math.round(180 * uiScale)
    property int btnH: Math.round(72 * uiScale)
    property int titleFont: Math.round(24 * uiScale)

    signal bothConfirmed()

    titleText: "Xác nhận tham gia giải"
    contentMargins: 30
    confirmText: ""
    cancelText: ""
    
    // Ngăn chặn tắt dialog bằng nút X
    showCloseButton: false

    // Thời gian đếm ngược
    property int timeRemaining: 900

    function formatTime(seconds) {
        var hrs = Math.floor(seconds / 3600);
        var mins = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;
        return (hrs < 10 ? "0" + hrs : hrs) + ":" + 
               (mins < 10 ? "0" + mins : mins) + ":" + 
               (secs < 10 ? "0" + secs : secs);
    }

    // Helper: gửi trạng thái check-in lên backend
    function sendCheckIn(p1Status, p2Status) {
        if (typeof TournamentService === "undefined" || !TournamentService) return
        var m = TournamentService.activeMatch
        if (!m || !m.match_id) return
        TournamentService.updateCheckIn(m.match_id, p1Status || "", p2Status || "")
    }

    // Tính thời gian còn lại: deadline = match_time + 15 phút
    function calcTimeRemaining() {
        if (typeof TournamentService === "undefined" || !TournamentService) return 900
        var m = TournamentService.activeMatch
        if (!m || !m.match_time) return 900  // Fallback 15 phút nếu không có match_time

        var matchStart = new Date(m.match_time)
        if (isNaN(matchStart.getTime())) return 900  // Invalid date → fallback 15 phút

        var deadline = new Date(matchStart.getTime() + 15 * 60 * 1000) // +15 phút
        var now = new Date()
        var remaining = Math.floor((deadline.getTime() - now.getTime()) / 1000)
        console.log("[JoinDialog] match_time=" + m.match_time + " now=" + now.toISOString() + " remaining=" + remaining + "s")
        // Nếu deadline đã qua (trận bắt đầu muộn), vẫn cho 15 phút xác nhận
        return remaining > 0 ? remaining : 900
    }

    onOpened: {
        // Don't reset leftConfirmed/rightConfirmed here —
        // TournamentPage pre-populates them from backend before calling open()
        timeRemaining = calcTimeRemaining()

        if (timeRemaining <= 0) {
            // Đã quá hạn — đánh dấu vắng mặt ngay
            var p1 = leftConfirmed ? "" : "absent"
            var p2 = rightConfirmed ? "" : "absent"
            sendCheckIn(p1, p2)
            Qt.callLater(function() { root.close() })
            return
        }

        countdownTimer.restart()
        forceActiveFocus()

        // If both already confirmed (shouldn't normally open), auto-close
        if (leftConfirmed && rightConfirmed) {
            checkBoth()
        }
    }

    Timer {
        id: countdownTimer
        interval: 1000
        repeat: true
        running: false
        onTriggered: {
            if (root.timeRemaining > 0) {
                root.timeRemaining -= 1
            } else {
                running = false
                // Hết giờ — đánh dấu vắng mặt cho người chưa xác nhận
                var p1 = root.leftConfirmed ? "" : "absent"
                var p2 = root.rightConfirmed ? "" : "absent"
                root.sendCheckIn(p1, p2)

                // Tự đóng dialog
                root.close()
            }
        }
    }

    ColumnLayout {
        width: parent ? parent.width : 600
        spacing: Math.round(30 * root.uiScale)

        AppText {
            text: "Vui lòng xác nhận tham gia giải đấu, nếu không xác nhận hệ thống sẽ tự động ghi nhận vắng mặt sau " + formatTime(root.timeRemaining)
            font.pixelSize: Math.round(18 * root.uiScale)
            color: "#E53935"
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            Layout.alignment: Qt.AlignHCenter
            Layout.maximumWidth: parent.width - 40
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: Math.round(60 * root.uiScale)

            // Bên trái (Player 1)
            ColumnLayout {
                spacing: Math.round(20 * root.uiScale)
                AppText {
                    text: root.leftName
                    font.pixelSize: root.titleFont
                    font.bold: true
                    color: root.leftConfirmed ? "#60DB80" : "#172339"
                    Layout.alignment: Qt.AlignHCenter
                }
                
                Button {
                    property color bgNormal: root.leftConfirmed ? "#60DB80" : "#172339"
                    property color bgHover: root.leftConfirmed ? "#60DB80" : "#2d3e5e"

                    text: root.leftConfirmed ? "Đã xác nhận" : "Xác nhận"
                    Layout.minimumWidth: root.btnW
                    Layout.minimumHeight: root.btnH
                    enabled: !root.leftConfirmed
                    
                    background: Rectangle {
                        color: parent.pressed ? Qt.darker(parent.bgHover, 1.2) : (parent.hovered ? parent.bgHover : parent.bgNormal)
                        radius: 8
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "white"
                        font.pixelSize: Math.round(20 * root.uiScale)
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }

                    onClicked: {
                        root.leftConfirmed = true
                        // Gửi xác nhận player 1 lên backend
                        root.sendCheckIn("confirmed", "")
                        root.checkBoth()
                    }
                }
            }

            // Bên phải (Player 2)
            ColumnLayout {
                spacing: Math.round(20 * root.uiScale)
                AppText {
                    text: root.rightName
                    font.pixelSize: root.titleFont
                    font.bold: true
                    color: root.rightConfirmed ? "#60DB80" : "#172339"
                    Layout.alignment: Qt.AlignHCenter
                }
                
                Button {
                    property color bgNormal: root.rightConfirmed ? "#60DB80" : "#172339"
                    property color bgHover: root.rightConfirmed ? "#60DB80" : "#2d3e5e"

                    text: root.rightConfirmed ? "Đã xác nhận" : "Xác nhận"
                    Layout.minimumWidth: root.btnW
                    Layout.minimumHeight: root.btnH
                    enabled: !root.rightConfirmed
                    
                    background: Rectangle {
                        color: parent.pressed ? Qt.darker(parent.bgHover, 1.2) : (parent.hovered ? parent.bgHover : parent.bgNormal)
                        radius: 8
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "white"
                        font.pixelSize: Math.round(20 * root.uiScale)
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }

                    onClicked: {
                        root.rightConfirmed = true
                        // Gửi xác nhận player 2 lên backend
                        root.sendCheckIn("", "confirmed")
                        root.checkBoth()
                    }
                }
            }
        }
    }

    function checkBoth() {
        if (root.leftConfirmed && root.rightConfirmed) {
            autoCloseTimer.start()
        }
    }

    Timer {
        id: autoCloseTimer
        interval: 800
        repeat: false
        onTriggered: {
            root.bothConfirmed()
            root.close()
        }
    }
}

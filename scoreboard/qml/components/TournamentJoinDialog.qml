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

    onLeftConfirmedChanged: checkBoth()
    onRightConfirmedChanged: checkBoth()

    property int btnW: Math.round(180 * uiScale)
    property int btnH: Math.round(72 * uiScale)
    property int titleFont: Math.round(24 * uiScale)

    signal bothConfirmed()
    signal absentDetected()

    titleText: "Xác nhận tham gia giải"
    contentMargins: 30
    confirmText: ""
    cancelText: ""
    
    // Ngăn chặn tắt dialog bằng nút X
    showCloseButton: false

    // Thời gian đếm ngược (30 phút = 1800 giây)
    property int timeRemaining: 1800

    property int leftMinScore: 0
    property int rightMinScore: 0

    property int p1LatePenalty: 0
    property int p2LatePenalty: 0

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

    // Tính thời gian còn lại: deadline = match_time + 30 phút
    function calcTimeRemaining() {
        if (typeof TournamentService === "undefined" || !TournamentService) return 1800
        var m = TournamentService.activeMatch
        if (!m || !m.match_time) return 1800  // Fallback 30 phút nếu không có match_time

        var matchStart = new Date(m.match_time)
        if (isNaN(matchStart.getTime())) return 1800  // Invalid date → fallback 30 phút

        var deadline = new Date(matchStart.getTime() + 30 * 60 * 1000) // +30 phút
        var now = new Date()
        var remaining = Math.floor((deadline.getTime() - now.getTime()) / 1000)
        console.log("[JoinDialog] match_time=" + m.match_time + " now=" + now.toISOString() + " remaining=" + remaining + "s")
        // Nếu deadline đã qua (trận bắt đầu muộn), vẫn cho 30 phút xác nhận
        return remaining > 0 ? remaining : 1800
    }

    function checkLatePenalties() {
        // Không áp dụng phạt và không reset điểm khi cả hai đã xác nhận.
        // countdownTimer có thể vẫn chạy sau khi dialog đóng — guard này
        // ngăn nó ghi đè điểm user đang thi đấu.
        if (leftConfirmed && rightConfirmed) return

        if (typeof TournamentService === "undefined" || !TournamentService) return
        var m = TournamentService.activeMatch
        if (!m || !m.match_id) return

        var elapsedSecs = 1800 - timeRemaining
        if (elapsedSecs < 0) elapsedSecs = 0

        // Chỉ tính phạt nếu người chơi chưa xác nhận (chưa check-in)
        if (!leftConfirmed) {
            if (elapsedSecs >= 1800) {
                p1LatePenalty = 3 // Absent
            } else if (elapsedSecs >= 1200) {
                p1LatePenalty = 2
            } else if (elapsedSecs >= 600) {
                p1LatePenalty = 1
            }
        }

        if (!rightConfirmed) {
            if (elapsedSecs >= 1800) {
                p2LatePenalty = 3 // Absent
            } else if (elapsedSecs >= 1200) {
                p2LatePenalty = 2
            } else if (elapsedSecs >= 600) {
                p2LatePenalty = 1
            }
        }

        // Tự động xử lý Vắng mặt nếu muộn 30 phút
        if (p1LatePenalty === 3 || p2LatePenalty === 3) {
            countdownTimer.stop()
            var p1Status = leftConfirmed ? "" : "absent"
            var p2Status = rightConfirmed ? "" : "absent"
            sendCheckIn(p1Status, p2Status)
            root.absentDetected()
            root.close()
            return
        }

        // Điểm phạt của người này sẽ cộng cho đối thủ của họ
        var expectedP1Score = leftMinScore + p2LatePenalty
        var expectedP2Score = rightMinScore + p1LatePenalty

        if (Controller.leftScore !== expectedP1Score || Controller.rightScore !== expectedP2Score) {
            console.log("[JoinDialog] Cập nhật điểm phạt đi muộn: elapsedSecs=" + elapsedSecs + " leftScore=" + expectedP1Score + " rightScore=" + expectedP2Score)
            Controller.leftScore = expectedP1Score
            Controller.rightScore = expectedP2Score
            TournamentService.updateScore(m.match_id, Controller.leftScore, Controller.rightScore, 0)
        }
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

        // Khởi tạo các giá trị phạt ban đầu
        p1LatePenalty = 0
        p2LatePenalty = 0
        checkLatePenalties()

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
                root.checkLatePenalties()
            } else {
                running = false
                // Hết giờ — đánh dấu vắng mặt cho người chưa xác nhận
                var p1 = root.leftConfirmed ? "" : "absent"
                var p2 = root.rightConfirmed ? "" : "absent"
                root.sendCheckIn(p1, p2)
                root.absentDetected()

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
                        root.checkLatePenalties()
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
                        root.checkLatePenalties()
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
            countdownTimer.stop()
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

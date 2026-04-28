// components/SettingsDialog.qml
// Dùng cho MultiCardScorePage — "Sử dụng Điểm chung"
import QtQuick 6
import QtQuick.Controls 6
import "."

DialogShell {
    id: dlg

    titleText:   (typeof win !== "undefined" && win) ? win.tr("settings_dialog_title") : "CÀI ĐẶT"
    confirmText: (typeof win !== "undefined" && win) ? win.tr("common_confirm") : "Xác nhận"
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_cancel")  : "Hủy"

    onConfirmed: close()
    onCancelled: {
        allowCommonScore = _savedCommon
        close()
    }

    property bool _savedCommon: false
    onOpened: {
        _savedCommon = allowCommonScore
    }

    // ===== Settings state =====
    property bool allowCommonScore: false

    signal settingsChanged()

    Column {
        width: parent ? parent.width : Math.round(dlg.dialogW - 2 * dlg.contentMargins)
        spacing: Math.round(16 * dlg.uiScale)
        topPadding: Math.round(10 * dlg.uiScale)
        bottomPadding: Math.round(20 * dlg.uiScale)

        // === Cho phép tính Điểm chung ===
        Rectangle {
            width: parent.width
            height: Math.round(72 * dlg.uiScale)
            radius: Math.round(10 * dlg.uiScale)
            color: dlg.allowCommonScore ? "#E8F5E9" : "#F5F5F5"
            border.color: dlg.allowCommonScore ? "#4CAF50" : "#E0E0E0"
            border.width: Math.max(1, Math.round(1.5 * dlg.uiScale))

            Behavior on color { ColorAnimation { duration: 150 } }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    dlg.allowCommonScore = !dlg.allowCommonScore
                    dlg.settingsChanged()
                }
            }

            Row {
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.leftMargin: Math.round(16 * dlg.uiScale)
                anchors.right: parent.right
                anchors.rightMargin: Math.round(16 * dlg.uiScale)
                spacing: Math.round(14 * dlg.uiScale)

                Rectangle {
                    anchors.verticalCenter: parent.verticalCenter
                    width: Math.round(32 * dlg.uiScale)
                    height: width
                    radius: Math.round(6 * dlg.uiScale)
                    color: dlg.allowCommonScore ? "#4CAF50" : "white"
                    border.color: dlg.allowCommonScore ? "#388E3C" : "#BDBDBD"
                    border.width: Math.max(1, Math.round(2 * dlg.uiScale))

                    Behavior on color { ColorAnimation { duration: 150 } }

                    Canvas {
                        anchors.centerIn: parent
                        width: Math.round(20 * dlg.uiScale)
                        height: Math.round(20 * dlg.uiScale)
                        visible: dlg.allowCommonScore
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
                }

                AppText {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Sử dụng Điểm chung"
                    color: "#172339"
                    font.pixelSize: Math.round(22 * dlg.uiScale)
                    font.bold: false
                }
            }
        }
    }
}

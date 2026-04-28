// components/WinsEditDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import "."

DialogShell {
    id: dlg

    titleText:   (typeof win !== "undefined" && win) ? win.tr("wins_edit_title") : "CHỈNH SỐ VÁN THẮNG"
    confirmText: (typeof win !== "undefined" && win) ? win.tr("common_confirm") : "Xác nhận"
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_cancel")  : "Hủy"

    property int playerIndex: -1
    property string playerName: ""
    property color playerColor: "#172339"
    property int currentWins: 0
    property int _editWins: 0

    // Kích thước
    readonly property int cardW:    Math.round(280 * uiScale)
    readonly property int cardH:    Math.round(200 * uiScale)
    readonly property int cornerR:  Math.round(14 * uiScale)
    readonly property int btnSize:  Math.round(56 * uiScale)

    signal winsChanged(int playerIndex, int newWins)

    function openFor(idx, name, color, wins) {
        playerIndex = idx
        playerName = name
        playerColor = color
        currentWins = wins
        _editWins = wins
        open()
    }

    onConfirmed: {
        if (_editWins !== currentWins) {
            winsChanged(playerIndex, _editWins)
        }
        close()
    }
    onCancelled: close()

    Column {
        width: parent ? parent.width : Math.round(dlg.dialogW - 2 * dlg.contentMargins)
        spacing: Math.round(16 * dlg.uiScale)

        // === Card giống AddPointsDialog ===
        Rectangle {
            id: card
            width: dlg.cardW
            height: dlg.cardH
            radius: dlg.cornerR
            color: dlg.playerColor
            border.color: Qt.darker(dlg.playerColor, 1.2)
            border.width: 1
            anchors.horizontalCenter: parent.horizontalCenter

            Column {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.verticalCenter: parent.verticalCenter
                spacing: Math.round(14 * dlg.uiScale)

                // Tên người chơi
                AppText {
                    text: dlg.playerName
                    color: "white"
                    font.pixelSize: Math.round(dlg.contentFontSize)
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    width: dlg.cardW - Math.round(24 * dlg.uiScale)
                    anchors.horizontalCenter: parent.horizontalCenter
                    elide: Text.ElideRight
                }

                // Row: nút − | số wins | nút +
                Row {
                    anchors.horizontalCenter: parent.horizontalCenter
                    spacing: Math.round(12 * dlg.uiScale)

                    // Nút trừ
                    Rectangle {
                        width: dlg.btnSize
                        height: dlg.btnSize
                        radius: dlg.cornerR
                        color: minusMA.pressed ? "#E0E0E0" : "white"

                        Behavior on color { ColorAnimation { duration: 80 } }

                        AppText {
                            anchors.centerIn: parent
                            text: "−"
                            color: dlg._editWins > 0 ? dlg.playerColor : "#BDBDBD"
                            font.pixelSize: Math.round(28 * dlg.uiScale)
                            font.bold: true
                        }

                        MouseArea {
                            id: minusMA
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (dlg._editWins > 0)
                                    dlg._editWins -= 1
                            }
                        }
                    }

                    // Số wins ở giữa
                    Rectangle {
                        width: Math.round(80 * dlg.uiScale)
                        height: dlg.btnSize
                        radius: dlg.cornerR
                        color: dlg.playerColor
                        border.color: "white"
                        border.width: 2

                        AppText {
                            anchors.centerIn: parent
                            text: String(dlg._editWins)
                            color: "white"
                            font.pixelSize: Math.round(28 * dlg.uiScale)
                            font.bold: true
                        }
                    }

                    // Nút cộng
                    Rectangle {
                        width: dlg.btnSize
                        height: dlg.btnSize
                        radius: dlg.cornerR
                        color: plusMA.pressed ? "#E0E0E0" : "white"

                        Behavior on color { ColorAnimation { duration: 80 } }

                        AppText {
                            anchors.centerIn: parent
                            text: "+"
                            color: dlg.playerColor
                            font.pixelSize: Math.round(28 * dlg.uiScale)
                            font.bold: true
                        }

                        MouseArea {
                            id: plusMA
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: dlg._editWins += 1
                        }
                    }
                }
            }
        }

        // Ghi chú thay đổi
        AppText {
            width: parent.width
            visible: dlg._editWins !== dlg.currentWins
            text: dlg._editWins > dlg.currentWins
                  ? "+" + (dlg._editWins - dlg.currentWins)
                  : String(dlg._editWins - dlg.currentWins)
            color: dlg._editWins > dlg.currentWins ? "#16a34a" : "#dc2626"
            font.pixelSize: Math.round(18 * dlg.uiScale)
            font.bold: true
            horizontalAlignment: Text.AlignHCenter
        }
    }
}

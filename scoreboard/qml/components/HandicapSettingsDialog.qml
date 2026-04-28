// components/HandicapSettingsDialog.qml
// Dùng cho MultiScorePage — "Chấp nửa" + sub-options
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
        handicapHalf = _savedHandicap
        handicapFirstGame = _savedFirst
        close()
    }

    property bool _savedHandicap: false
    property bool _savedFirst: true
    onOpened: {
        _savedHandicap = handicapHalf
        _savedFirst = handicapFirstGame
    }

    // ===== Settings state =====
    property bool handicapHalf: false           // Chấp nửa
    property bool handicapFirstGame: true       // true = Ván đầu chấp, false = Ván đầu không chấp

    signal settingsChanged()

    // ===== Reusable checkbox =====
    component SettingCheck: Rectangle {
        id: chk
        property bool checked: false
        property string label: ""
        property bool indented: false
        property color activeColor: "#1976D2"
        property color activeBorder: "#1565C0"

        width: parent.width
        height: Math.round(64 * dlg.uiScale)
        radius: Math.round(10 * dlg.uiScale)
        color: checked ? "#E3F2FD" : "#F5F5F5"
        border.color: checked ? activeColor : "#E0E0E0"
        border.width: Math.max(1, Math.round(1.5 * dlg.uiScale))

        Behavior on color { ColorAnimation { duration: 150 } }

        MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: chk.checked = !chk.checked
        }

        Row {
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: parent.left
            anchors.leftMargin: Math.round((chk.indented ? 56 : 16) * dlg.uiScale)
            anchors.right: parent.right
            anchors.rightMargin: Math.round(16 * dlg.uiScale)
            spacing: Math.round(14 * dlg.uiScale)

            Rectangle {
                anchors.verticalCenter: parent.verticalCenter
                width: Math.round(32 * dlg.uiScale)
                height: width
                radius: Math.round(6 * dlg.uiScale)
                color: chk.checked ? chk.activeColor : "white"
                border.color: chk.checked ? chk.activeBorder : "#BDBDBD"
                border.width: Math.max(1, Math.round(2 * dlg.uiScale))

                Behavior on color { ColorAnimation { duration: 150 } }

                Canvas {
                    anchors.centerIn: parent
                    width: Math.round(20 * dlg.uiScale)
                    height: Math.round(20 * dlg.uiScale)
                    visible: chk.checked
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
                text: chk.label
                color: "#172339"
                font.pixelSize: Math.round(22 * dlg.uiScale)
                font.bold: false
            }
        }
    }

    // ===== Content =====
    Column {
        width: parent ? parent.width : Math.round(dlg.dialogW - 2 * dlg.contentMargins)
        spacing: Math.round(12 * dlg.uiScale)
        topPadding: Math.round(10 * dlg.uiScale)
        bottomPadding: Math.round(20 * dlg.uiScale)

        // === Chấp nửa ===
        SettingCheck {
            checked: dlg.handicapHalf
            label: (typeof win !== "undefined" && win) ? win.tr("settings_handicap_half") : "Chấp nửa"
            onCheckedChanged: {
                dlg.handicapHalf = checked
                dlg.settingsChanged()
            }
        }

        // === Ván đầu chấp (radio) ===
        SettingCheck {
            visible: dlg.handicapHalf
            checked: dlg.handicapHalf && dlg.handicapFirstGame
            label: (typeof win !== "undefined" && win) ? win.tr("settings_handicap_first_yes") : "Ván đầu chấp"
            indented: true
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    dlg.handicapFirstGame = true
                    dlg.settingsChanged()
                }
            }
        }

        // === Ván đầu không chấp (radio) ===
        SettingCheck {
            visible: dlg.handicapHalf
            checked: dlg.handicapHalf && !dlg.handicapFirstGame
            label: (typeof win !== "undefined" && win) ? win.tr("settings_handicap_first_no") : "Ván đầu không chấp"
            indented: true
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    dlg.handicapFirstGame = false
                    dlg.settingsChanged()
                }
            }
        }
    }
}

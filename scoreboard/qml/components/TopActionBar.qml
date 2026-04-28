import QtQuick 6
import QtQuick.Controls 6

Item {
    id: root

    // Scale chung
    property real uiScale: (typeof win !== "undefined" && win) ? win.uiScale : 1

    // Nhãn
    property string addPlayerLabel:    (typeof win !== "undefined" && win) ? win.tr("top_add_player")    : "Thêm người chơi"
    property string changePointsLabel: (typeof win !== "undefined" && win) ? win.tr("top_change_points") : "Thay đổi điểm"
    property string settingsLabel:     (typeof win !== "undefined" && win) ? win.tr("top_settings")      : "Cài đặt"

    // Trạng thái
    property bool addPlayerEnabled: true
    property bool showChangePoints: true
    property bool showSettings: true

    // Kích thước
    property int matchClockPx: Math.round(48 * uiScale)
    property int buttonH:      Math.round(matchClockPx + 12 * uiScale)
    property int btnWAdd:      Math.round(220 * uiScale)
    property int btnWChange:   Math.round(220 * uiScale)
    property int btnWSettings:  Math.round(160 * uiScale)
    property int radius:       Math.round(8 * uiScale)
    property int fontPx:       Math.round(22 * uiScale)
    property int spacing:      Math.round(12 * uiScale)

    property int leftMarginPx: 50
    property int _leftMargin: Math.round(leftMarginPx * uiScale)

    // Màu
    property color baseColor:   "#172339"
    property color hoverColor:  "#1E2B44"
    property color downColor:   "#0F1A2A"
    property color disabledBg:  "#9CA3AF"
    property color textColor:   "white"

    // Tín hiệu
    signal addPlayerRequested()
    signal changePointsRequested()
    signal settingsRequested()

    // Handicap tile
    property bool   showHandicapTile: false
    property bool   handicapActive: true        // true = Chấp, false = Không chấp
    property string handicapTextYes: "Chấp"
    property string handicapTextNo:  "Không chấp"
    readonly property int btnWHandicap: Math.round(180 * uiScale)

    function toggleHandicap() {
        if (!root.showHandicapTile) return
        root.handicapActive = !root.handicapActive
    }
    function resetHandicap(firstGameHandicap) {
        root.handicapActive = firstGameHandicap
    }

    implicitHeight: buttonH
    implicitWidth:  _leftMargin
                   + (showSettings ? (btnWSettings + spacing) : 0)
                   + btnWAdd
                   + (showChangePoints ? (spacing + btnWChange) : 0)
                   + (showHandicapTile ? (spacing + btnWHandicap) : 0)

    Row {
        id: row
        anchors.left: parent.left
        anchors.leftMargin: root._leftMargin
        anchors.verticalCenter: parent.verticalCenter
        spacing: root.spacing

        // Nút Cài đặt
        Button {
            id: settingsBtn
            visible: root.showSettings
            width:  root.showSettings ? root.btnWSettings : 0
            height: root.buttonH
            background: Rectangle {
                radius: root.radius
                color: settingsBtn.down ? root.downColor
                                        : (settingsBtn.hovered ? root.hoverColor : root.baseColor)
            }
            contentItem: Row {
                anchors.centerIn: parent
                spacing: Math.round(6 * root.uiScale)
                Image {
                    anchors.verticalCenter: parent.verticalCenter
                    source: Qt.resolvedUrl("../../assets/icon/settings.svg")
                    width: Math.round(24 * root.uiScale)
                    height: width
                    sourceSize.width: width * 2
                    sourceSize.height: height * 2
                    fillMode: Image.PreserveAspectFit
                    smooth: true
                    antialiasing: true
                }
                Text {
                    text: root.settingsLabel
                    color: root.textColor
                    font.pixelSize: root.fontPx
                    font.bold: true
                    anchors.verticalCenter: parent.verticalCenter
                }
            }
            onClicked: root.settingsRequested()
        }

        // Nút Thêm người chơi
        Button {
            id: addPlayerBtn
            enabled: root.addPlayerEnabled
            width:  root.btnWAdd
            height: root.buttonH
            background: Rectangle {
                radius: root.radius
                color: addPlayerBtn.enabled
                       ? (addPlayerBtn.down ? root.downColor
                                            : (addPlayerBtn.hovered ? root.hoverColor : root.baseColor))
                       : root.disabledBg
            }
            contentItem: Text {
                text: root.addPlayerLabel
                color: root.textColor
                font.pixelSize: root.fontPx
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            onClicked: if (enabled) root.addPlayerRequested()
        }

        // Nút Thay đổi điểm (ẩn/hiện theo showChangePoints)
        Button {
            id: changePointsBtn
            visible: root.showChangePoints
            width:   root.showChangePoints ? root.btnWChange : 0
            height:  root.buttonH
            background: Rectangle {
                radius: root.radius
                color: changePointsBtn.down ? root.downColor
                                            : (changePointsBtn.hovered ? root.hoverColor : root.baseColor)
            }
            contentItem: Text {
                text: root.changePointsLabel
                visible: changePointsBtn.visible
                color: root.textColor
                font.pixelSize: root.fontPx
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            onClicked: if (root.showChangePoints) root.changePointsRequested()
        }


        // Handicap tile ("Chấp" / "Không chấp")
        Button {
            id: handicapTile
            visible: root.showHandicapTile
            width: visible ? root.btnWHandicap : 0
            height: root.buttonH
            background: Rectangle {
                radius: root.radius
                color: root.baseColor
            }
            contentItem: Text {
                text: root.handicapActive ? root.handicapTextYes : root.handicapTextNo
                color: root.textColor
                font.pixelSize: root.fontPx
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
        }
    }
}

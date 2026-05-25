// qml/components/MultiScoreTile.qml
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Window
import "../components"

Item {
    id: root

    // ===== API =====
    function trLocal(key) {
        return (typeof win !== "undefined" && win && typeof win.tr === "function") ? win.tr(key) : key
    }

    property string nameText: trLocal("score_tile_default_title")
    property int    score: 0
    property int    wins:  0
    property color  cardColor: "#ffcd00"
    property real   uiScale: (typeof win !== "undefined" && win)
                            ? Math.min(win.width/1920, win.height/1080) : 1
    property bool   showActions: false
    property real   contentScale: 1.0  // 1.0 = chuẩn (4 người), >1 = to hơn (3 người), <1 = nhỏ hơn (5 người)
    property real   nameMaxWidth: width * 0.5

    // Cho phép đẩy cụm điểm sang phải từ trang ngoài
    property int scoreShift: 0   // px bổ sung
    property bool centerScore: false  // true = center score horizontally between buttons

    // Icon assets (SVG)
    property url editIconSource:   "../../assets/icon/pen-svgrepo-com.svg"
    property url deleteIconSource: "../../assets/icon/user-delete-svgrepo-com.svg"

    // Kích thước icon / vùng bấm (scale theo contentScale)
    property int iconButtonSize:   Math.round(64 * uiScale * contentScale)
    property int iconGraphicSize:  Math.round(36 * uiScale * contentScale)
    property int iconMargin:       Math.round(12 * uiScale * contentScale)

    signal editTitleRequested()
    signal deleteRequested()
    signal winsEditRequested()

    // ===== Aliases để trang ngoài có thể neo/chèn cạnh số điểm =====
    property alias scoreItem: scoreDigits
    default property alias extraContent: scoreWrap.data

    width:  Math.round(400 * uiScale)
    height: Math.round(220 * uiScale)

    // ===== CARD =====
    Rectangle {
        id: card
        anchors.fill: parent
        radius: Math.round(20 * root.uiScale)
        color: root.cardColor
        antialiasing: true
        clip: true

        layer.enabled: true
        layer.samples: 4

        // ===== Nút ĐỔI TÊN: góc TRÊN-PHẢI =====
        ToolButton {
            id: editBtn
            anchors.top:    parent.top
            anchors.right:  parent.right
            anchors.topMargin:    root.iconMargin
            anchors.rightMargin:  root.iconMargin
            width:  root.iconButtonSize
            height: root.iconButtonSize
            hoverEnabled: true
            focusPolicy: Qt.NoFocus
            activeFocusOnTab: false
            background: Rectangle { color: "transparent"; border.width: 0 }
            display: AbstractButton.IconOnly
            icon.source: root.editIconSource
            icon.width:  root.iconGraphicSize
            icon.height: root.iconGraphicSize
            onClicked: root.editTitleRequested()
        }

        // ===== Nút XOÁ: góc DƯỚI-PHẢI =====
        ToolButton {
            id: deleteBtn
            anchors.bottom: parent.bottom
            anchors.right:  parent.right
            anchors.bottomMargin: root.iconMargin
            anchors.rightMargin:  root.iconMargin
            width:  root.iconButtonSize
            height: root.iconButtonSize
            hoverEnabled: true
            focusPolicy: Qt.NoFocus
            activeFocusOnTab: false
            background: Rectangle { color: "transparent"; border.width: 0 }
            display: AbstractButton.IconOnly
            icon.source: root.deleteIconSource
            icon.width:  root.iconGraphicSize
            icon.height: root.iconGraphicSize
            onClicked: root.deleteRequested()
        }

        // ===== TÊN NGƯỜI CHƠI =====
        AppText {
            id: nameLbl
            text: root.nameText
            color: "white"
            font.pixelSize: Math.round(98 * root.uiScale * root.contentScale)
            font.bold: true
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: parent.left
            anchors.leftMargin: Math.round(30 * root.uiScale)
            width: root.nameMaxWidth
            height: parent.height
            horizontalAlignment: Text.AlignLeft
            verticalAlignment: Text.AlignVCenter
            elide: Text.ElideRight
            wrapMode: Text.NoWrap
            fontSizeMode: Text.Fit
            minimumPixelSize: Math.round(14 * root.uiScale * root.contentScale)
            renderType: Text.NativeRendering
            font.hintingPreference: Font.PreferFullHinting
            layer.enabled: true
            opacity: 0.9999
        }

        // ===== KHU VỰC ĐIỂM (slot) =====
        Item {
            id: scoreWrap
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: nameLbl.right
            anchors.leftMargin: Math.round(40 * root.uiScale + 100) + root.scoreShift
            anchors.right: parent.right
            anchors.rightMargin: Math.max(root.iconButtonSize + root.iconMargin * 2,
                                          Math.round(60 * root.uiScale))
            height: Math.round(160 * root.uiScale)

            // Số điểm (alias scoreItem)
            AppText {
                id: scoreDigits
                text: String(Math.abs(root.score))
                color: "white"
                font.bold: true
                font.pixelSize: Math.round(140 * root.uiScale * root.contentScale)
                anchors.verticalCenter: parent.verticalCenter
                verticalAlignment: Text.AlignVCenter
                renderType: Text.NativeRendering
                font.hintingPreference: Font.PreferFullHinting
                layer.enabled: true

                states: [
                    State {
                        name: "left"
                        when: !root.centerScore
                        AnchorChanges {
                            target: scoreDigits
                            anchors.left: scoreWrap.left
                            anchors.horizontalCenter: undefined
                        }
                        PropertyChanges {
                            target: scoreDigits
                            horizontalAlignment: Text.AlignLeft
                        }
                    },
                    State {
                        name: "center"
                        when: root.centerScore
                        AnchorChanges {
                            target: scoreDigits
                            anchors.left: undefined
                            anchors.horizontalCenter: scoreWrap.horizontalCenter
                        }
                        PropertyChanges {
                            target: scoreDigits
                            horizontalAlignment: Text.AlignHCenter
                        }
                    }
                ]
            }

            // Dấu âm
            AppText {
                id: scoreSign
                text: "-"
                visible: root.score < 0 && scoreDigits.visible
                color: "white"
                font.bold: true
                font.pixelSize: scoreDigits.font.pixelSize
                anchors.verticalCenter: scoreDigits.verticalCenter
                anchors.right: scoreDigits.left
                anchors.rightMargin: Math.round(24 * root.uiScale)
                renderType: Text.NativeRendering
                font.hintingPreference: Font.PreferFullHinting
                layer.enabled: true
            }

            // Mọi child từ trang sẽ được chèn vào đây (extraContent)

            // Badge số chiến thắng (góc trên phải score)
            Rectangle {
                id: winsBadge
                visible: root.wins > 0
                anchors.top: scoreDigits.top
                anchors.topMargin: Math.round(-4 * root.uiScale * root.contentScale)
                anchors.left: scoreDigits.right
                anchors.leftMargin: Math.round(6 * root.uiScale * root.contentScale)
                width: Math.max(Math.round(36 * root.uiScale * root.contentScale), winsText.implicitWidth + Math.round(14 * root.uiScale * root.contentScale))
                height: Math.round(36 * root.uiScale * root.contentScale)
                radius: Math.round(18 * root.uiScale * root.contentScale)
                color: "#FFFFFF"
                border.color: root.cardColor
                border.width: Math.max(1, Math.round(2 * root.uiScale))
                scale: badgeMA.pressed ? 0.9 : 1.0
                Behavior on scale { NumberAnimation { duration: 100 } }

                AppText {
                    id: winsText
                    anchors.centerIn: parent
                    text: String(root.wins)
                    color: root.cardColor
                    font.pixelSize: Math.round(22 * root.uiScale * root.contentScale)
                    font.bold: true
                }

                MouseArea {
                    id: badgeMA
                    anchors.fill: parent
                    anchors.margins: Math.round(-8 * root.uiScale)
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.winsEditRequested()
                }
            }
        }
    }

    MultiEffect {
        z: -1
        anchors.fill: card
        source: card
        shadowEnabled: root.visible
        shadowColor: "#30000000"
        shadowHorizontalOffset: 0
        shadowVerticalOffset: Math.round(4 * root.uiScale)
        shadowBlur: 0.6
        autoPaddingEnabled: false
    }
}

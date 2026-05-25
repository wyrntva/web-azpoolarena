// qml/components/NavCard.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6
import "."

Item {
    id: root
    width: 435
    height: 275

    // API
    property string title: ""
    property string subtitle: ""
    property url    iconSource: ""      // Ưu tiên SVG 24×24 hoặc bội số
    property int    radius: 16
    property color  bg: "#172339"
    property color  fg: "#FFFFFF"

    // Kích thước icon hiển thị
    property int iconPx: Math.max(28, Math.round(Math.min(width, height) * 0.34))
    // Hệ số supersample (2 = render 2x rồi thu nhỏ để mịn)
    property real iconSupersample: Screen.devicePixelRatio > 1 ? 1.6 : 1.0

    signal clicked()

    Rectangle {
        id: card
        anchors.fill: parent
        radius: root.radius
        color: root.bg
    }

    RealShadow {
        anchors.fill: card
        sourceItem: card
        shadowVisible: root.visible
        autoPad: true
        z: -1
    }

    Column {
        id: content
        anchors.centerIn: parent
        spacing: Math.round(Math.min(root.width, root.height) * 0.06)

        // ICON — ưu tiên mượt, chống răng cưa
        Item {
            id: iconWrap
            width:  Math.round(root.iconPx)
            height: Math.round(root.iconPx)
            anchors.horizontalCenter: parent.horizontalCenter

            Image {
                id: iconImg
                anchors.centerIn: parent
                width:  iconWrap.width
                height: iconWrap.height
                source: root.iconSource
                fillMode: Image.PreserveAspectFit

                // Supersample + HiDPI: tạo texture lớn rồi thu nhỏ mượt
                sourceSize: Qt.size(
                    Math.max(1, Math.round(width  * Screen.devicePixelRatio * root.iconSupersample)),
                    Math.max(1, Math.round(height * Screen.devicePixelRatio * root.iconSupersample))
                )

                // Lọc mượt & mipmap để giảm răng cưa khi scale
                smooth: true
                mipmap: true
                antialiasing: true
                asynchronous: true
                cache: true

            }
        }

        Text {
            id: titleLabel
            text: root.title
            color: root.fg
            font.pixelSize: Math.max(14, Math.round(root.height * 0.16))
            font.bold: true
            wrapMode: Text.WordWrap
            width: Math.min(root.width * 0.86, 520)
            horizontalAlignment: Text.AlignHCenter
            anchors.horizontalCenter: parent.horizontalCenter
        }
    }

    Rectangle {
        anchors.fill: parent
        radius: root.radius
        color: "#FFFFFF"
        opacity: 0
        Behavior on opacity { NumberAnimation { duration: 120 } }
        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onEntered:  parent.opacity = 0.06
            onExited:   parent.opacity = 0.0
            onPressed:  parent.opacity = 0.12
            onReleased: parent.opacity = containsMouse ? 0.06 : 0.0
            onClicked:  root.clicked()
        }
    }

    Accessible.name: title
    Accessible.role: Accessible.Button
}

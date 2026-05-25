// qml/components/CircleIconButton.qml
import QtQuick 6
import QtQuick.Controls 6
import "."

Item {
    id: root

    // ==== API ====
    // Đường kính tổng thể (chỉ cần chỉnh cái này)
    property int  diameter: 44
    // Đệm giữa viền và icon
    property int  padding: 8
    // Icon
    property url  iconSource: ""
    // Màu nền theo trạng thái
    property color bg:       "#FFFFFF"
    property color hoverBg:  "#F5F7FA"
    property color downBg:   "#EDF1F5"
    // Kích cỡ icon (mặc định auto theo diameter)
    property int iconSize: Math.max(12, Math.min(diameter - 2*padding, 64))
    // Bật/tắt đổ bóng
    property bool showShadow: true

    // Kích thước thực
    width:  diameter
    height: diameter

    // --- BÓNG: vẽ phía dưới hình tròn, tự nới padding để không bị cắt ---
    RealShadow {
        anchors.fill: circle
        sourceItem: circle
        shadowVisible: root.showShadow && root.visible
        autoPad: true
        z: -1
    }

    // Nền hình tròn (luôn hiển thị)
    Rectangle {
        id: circle
        anchors.centerIn: parent
        width:  root.diameter
        height: root.diameter
        radius: width / 2
        color: mouseArea.pressed ? root.downBg
             : (mouseArea.containsMouse ? root.hoverBg : root.bg)
        antialiasing: true
    }

    // Icon
    Image {
        id: icon
        anchors.centerIn: parent
        source: root.iconSource
        sourceSize.width:  root.iconSize
        sourceSize.height: root.iconSize
        fillMode: Image.PreserveAspectFit
        smooth: true
        antialiasing: true
    }

    // Sự kiện
    signal clicked()

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        onClicked: root.clicked()
    }

    // (Tuỳ chọn) hỗ trợ bàn phím/remote:
    Keys.onReturnPressed: root.clicked()
    Keys.onEnterPressed:  root.clicked()
    activeFocusOnTab: true
    focus: false
}

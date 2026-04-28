// qml/components/AppToast.qml
import QtQuick 6
import QtQuick.Controls 6

Item {
    id: toast
    visible: false
    opacity: 0.0

    // === API cơ bản ===
    property string text: ""
    property int    durationMs: 5000
    property color  accentColor: "#C6010B"
    property real   uiScale: (typeof win !== "undefined" && win)
                             ? Math.min(win.width/1920, win.height/1080) : 1

    // Vị trí: "top" | "bottom"
    property string dock: "top"
    property real   topMargin:    24 * uiScale
    property real   bottomMargin: 32 * uiScale

    // Icon mặc định trong assets/icon
    property bool   alwaysShowIcon: true
    property string iconFolder: "../../assets/icon"
    property string defaultIconName: "info_outline.svg"
    property string _iconName: defaultIconName

    // Kích thước / giới hạn theo màn hình
    property real minWidth:   260 * uiScale
    property real baseWidth:  380 * uiScale
    property real maxWidth:   parent ? (parent.width - 48 * uiScale) : (600 * uiScale)
    property real boxWidth:   Math.max(minWidth, Math.min(baseWidth, maxWidth))
    property real padding:     16 * uiScale
    property real gap:         10 * uiScale
    property real radius:       8 * uiScale

    readonly property real _kbH: Math.max(
        (Qt.inputMethod.visible ? Qt.inputMethod.keyboardRectangle.height : 0),
        (win && win.vkHeight ? win.vkHeight : 0)
    )

    width:  boxWidth
    height: contentRow.implicitHeight + 2*padding

    anchors.horizontalCenter: parent ? parent.horizontalCenter : undefined
    anchors.top:    dock === "top"    && parent ? parent.top    : undefined
    anchors.bottom: dock === "bottom" && parent ? parent.bottom : undefined
    anchors.topMargin:    dock === "top"    ? Math.round(topMargin) : 0
    anchors.bottomMargin: dock === "bottom" ? (Math.round(bottomMargin) + _kbH) : 0

    // Nền (không vạch/viền)
    Rectangle {
        id: bg
        anchors.fill: parent
        color: "#FFFFFF"
        radius: toast.radius
        antialiasing: true
        clip: true
    }

    // Nội dung CĂN GIỮA
    Row {
        id: contentRow
        anchors.centerIn: parent          // ← căn giữa khối nội dung trong hộp
        spacing: toast.gap

        Image {
            visible: toast.alwaysShowIcon
            source: toast.iconFolder + "/" + toast._iconName
            fillMode: Image.PreserveAspectFit
            width:  20 * toast.uiScale
            height: 20 * toast.uiScale
        }

        Text {
            text: toast.text
            color: "#172339"
            wrapMode: Text.WordWrap
            font.pixelSize: Math.round(14 * toast.uiScale)
            horizontalAlignment: Text.AlignHCenter   // ← căn giữa chữ
            // Giới hạn bề rộng để xuống dòng đẹp, vẫn trừ phần icon nếu có
            width: toast.boxWidth
                   - 2*toast.padding
                   - (contentRow.spacing + (toast.alwaysShowIcon ? (20*toast.uiScale) : 0))
        }
    }

    // API hiển thị
    function show(msg, ms) {
        // Disabled: do nothing
    }
    function showWithIcon(name, msg, ms) {
        // Disabled: do nothing
    }

    SequentialAnimation {
        id: anim
        PropertyAnimation { target: toast; property: "opacity"; from: 0; to: 1; duration: 120; easing.type: Easing.OutCubic }
        PauseAnimation    { duration: toast.durationMs }
        PropertyAnimation { target: toast; property: "opacity"; to: 0; duration: 180; easing.type: Easing.InCubic }
        onStopped: { if (toast.opacity <= 0.01) toast.visible = false }
    }
}

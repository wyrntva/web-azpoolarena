// qml/components/ControlButton.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import "."

Item {
    id: root

    // ---- Nội dung ----
    property url    iconSource: ""
    property string label: ""
    signal clicked()
    signal longPressed()

    // ---- Style / kích thước (snap về pixel) ----
    property int  btnWidth:      140
    property int  btnHeight:       90
    property int  radius:          16
    property int  padding:         12
    property int  gap:              8
    property int  iconSize:        36
    property int  fontPx:          16
    property color bg:           "white"
    property color fg:           "#172339"
    property color shadowColor:   "#26000000"
    property real  shadowBlur:      10       // px
    property int   shadowOffsetY:    6
    property bool  enabled: true
    property string tooltip: ""

    // ===== Snap số đo về pixel nguyên =====
    readonly property int _w:        Math.round(btnWidth)
    readonly property int _h:        Math.round(btnHeight)
    readonly property int _radius:   Math.round(radius)
    readonly property int _pad:      Math.round(padding)
    readonly property int _gap:      Math.round(gap)
    readonly property int _icon:     Math.round(iconSize)
    readonly property int _font:     Math.round(fontPx)

    width: _w
    height: _h
    Accessible.name: label
    Accessible.role: Accessible.Button

    // ===== NỀN (làm source cho bóng) =====
    Rectangle {
        id: cardBg
        anchors.fill: parent
        radius: root._radius
        color: root.bg
        border.width: 1
        border.color: "#E5E7EB"
        visible: true
    }

    // ===== BÓNG (RealShadow helper) =====
    RealShadow {
        anchors.fill: cardBg
        sourceItem: cardBg
        z: -1
        dropColor: root.shadowColor
        horizontalOffset: 0
        verticalOffset: root.shadowOffsetY
        blurRadius: root.shadowBlur
        autoPad: true
        shadowVisible: root.visible
    }

    // ===== OVERLAY NHẤN/HOVER =====
    Rectangle {
        id: overlay
        anchors.fill: parent
        radius: root._radius
        color: "#172339"
        opacity: 0
        visible: true
        Behavior on opacity { NumberAnimation { duration: 120 } }
    }

    // ===== NỘI DUNG =====
    Item {
        id: content
        width: root.width - 2*root._pad
        height: Math.round(root._icon + root._gap + labelItem.implicitHeight)
        x: Math.round((root.width  - width)  / 2)
        y: Math.round((root.height - height) / 2)

        // ICON
        Item {
            id: iconWrap
            width:  root._icon
            height: root._icon
            x: Math.round((content.width - width) / 2)
            y: 0

            Image {
                id: iconImg
                anchors.centerIn: parent
                source: root.iconSource
                width:  Math.round(iconWrap.width)
                height: Math.round(iconWrap.height)
                fillMode: Image.PreserveAspectFit
                smooth: false
                mipmap: true
                cache: true
                opacity: root.enabled ? 1 : 0.5

                // Raster SVG theo DPR để nét
                readonly property real dpr: Screen.devicePixelRatio
                sourceSize.width:  Math.max(1, Math.round(width  * dpr))
                sourceSize.height: Math.max(1, Math.round(height * dpr))
            }
        }

        // NHÃN
        Text {
            id: labelItem
            text: root.label
            color: root.fg
            font.pixelSize: root._font
            font.bold: true
            horizontalAlignment: Text.AlignHCenter
            wrapMode: Text.WordWrap
            width: content.width
            x: 0
            y: Math.round(iconWrap.y + iconWrap.height + root._gap)
            opacity: root.enabled ? 1 : 0.5
            renderType: Text.NativeRendering
        }
    }

    // ===== LONG PRESS =====
    property int  longPressMs: 450
    property bool _longFired: false
    property bool _hovered: false

    Timer {
        id: holdTimer
        interval: root.longPressMs
        repeat: false
        onTriggered: { root._longFired = true; root.longPressed() }
    }

    // ===== TƯƠNG TÁC =====
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        enabled: root.enabled
        hoverEnabled: true
        cursorShape: root.enabled ? Qt.PointingHandCursor : Qt.ArrowCursor

        onEntered:    { if (root.enabled) overlay.opacity = 0.06; root._hovered = true }
        onExited:     { overlay.opacity = 0; root._hovered = false }
        onPressed:    {
            if (!root.enabled) return
            overlay.opacity = 0.12
            root._longFired = false
            holdTimer.restart()
        }
        onReleased:   {
            overlay.opacity = containsMouse ? 0.06 : 0
            holdTimer.stop()
        }
        onCanceled:   { overlay.opacity = 0; holdTimer.stop() }
        onClicked:    { if (root.enabled && !root._longFired) root.clicked() }
    }

    // Tooltip
    ToolTip.visible: tooltip !== "" && root._hovered
    ToolTip.text: tooltip
}

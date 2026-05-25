import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6   // Screen.devicePixelRatio

Control {
    id: root

    // API
    property url    iconSource: ""
    property string text: ""
    property string size: "md"          // "sm" | "md" | "lg"
    property string variant: "solid"    // "solid" | "outline" | "ghost" | "secondary"
    property string tooltip: text

    // Kích thước theo size
    readonly property int padX:   (size === "lg" ? 16 : size === "sm" ? 10 : 12)
    readonly property int padY:   (size === "lg" ? 10 : size === "sm" ?  6 :  8)
    readonly property int iconPx: (size === "lg" ? 24 : size === "sm" ? 16 : 20)
    readonly property int fontPx: (size === "lg" ? 16 : size === "sm" ? 12 : 14)

    // Style theo variant
    readonly property color bgColor: ({
        "solid":     "#172339",
        "secondary": "#E5E7EB",
        "outline":   "transparent",
        "ghost":     "transparent"
    }[variant]) || "transparent"

    readonly property color borderColor: ({
        "solid":     "transparent",
        "secondary": "#D1D5DB",
        "outline":   "#D1D5DB",
        "ghost":     "transparent"
    }[variant]) || "transparent"

    readonly property int borderW: (variant === "outline" ? 1 : (variant === "secondary" ? 1 : 0))

    readonly property color fgColor: ({
        "solid":     "white",
        "secondary": "#172339",
        "outline":   "#172339",
        "ghost":     "#172339"
    }[variant]) || "#172339"

    // Hover/Pressed
    readonly property color bgHover: ({
        "solid":     "#223253",
        "secondary": "#EEF0F3",
        "outline":   "rgba(23,35,57,0.06)",
        "ghost":     "rgba(23,35,57,0.06)"
    }[variant]) || bgColor

    readonly property color bgDown: ({
        "solid":     "#101829",
        "secondary": "#E6E8EC",
        "outline":   "rgba(23,35,57,0.10)",
        "ghost":     "rgba(23,35,57,0.10)"
    }[variant]) || bgColor

    implicitWidth:  contentItem.implicitWidth  + padX * 2 + borderW * 2
    implicitHeight: contentItem.implicitHeight + padY * 2 + borderW * 2
    hoverEnabled: true
    focusPolicy: Qt.StrongFocus

    background: Rectangle {
        radius: 10
        color: root.pressed ? root.bgDown : (root.hovered ? root.bgHover : root.bgColor)
        border.color: root.borderColor
        border.width: root.borderW
        antialiasing: true
    }

    contentItem: Row {
        id: row
        spacing: (text.length > 0 && iconSource !== "") ? 8 : 0
        anchors.fill: parent
        anchors.margins: 0
        anchors.leftMargin:   root.padX
        anchors.rightMargin:  root.padX
        anchors.topMargin:    root.padY
        anchors.bottomMargin: root.padY

        // Icon (nếu có)
        Image {
            id: iconImg
            visible: iconSource !== ""
            source: root.iconSource
            width: root.iconPx
            height: root.iconPx
            fillMode: Image.PreserveAspectFit
            smooth: true
            // HiDPI
            sourceSize.width:  width  * Screen.devicePixelRatio
            sourceSize.height: height * Screen.devicePixelRatio
            anchors.verticalCenter: parent.verticalCenter
        }

        // Text (nếu có)
        Text {
            id: label
            visible: root.text.length > 0
            text: root.text
            color: root.fgColor
            font.pixelSize: root.fontPx
            font.bold: false
            verticalAlignment: Text.AlignVCenter
            readonly property var windowRef: root.Window.window
            // dùng font app và fallback theo ngôn ngữ (khi khả dụng)
            font.family: (windowRef && windowRef.appFontFamily)
                         ? windowRef.appFontFamily : ""
        }
    }

    // Tooltip: attached property
    ToolTip.visible: root.hovered && root.tooltip.length > 0
    ToolTip.text: root.tooltip
    ToolTip.delay: 500

    // API click
    signal clicked()
    onClicked: {}

    Keys.onReturnPressed: root.clicked()
    Keys.onEnterPressed:  root.clicked()
    Keys.onSpacePressed:  root.clicked()

    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        onClicked: root.clicked()
        cursorShape: Qt.PointingHandCursor
    }
}

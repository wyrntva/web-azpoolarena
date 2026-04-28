// qml/components/DialogShell.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import QtQuick.Controls.Material
import "../components"

Popup {
    id: root
    parent: (typeof win !== "undefined" && win ? win.contentItem : undefined)

    modal: true
    focus: true
    closePolicy: Popup.NoAutoClose

    enter: Transition { NumberAnimation { properties: "opacity,scale"; duration: 0 } }
    exit:  Transition { NumberAnimation { properties: "opacity,scale"; duration: 0 } }

    // ===== Overlay nền xung quanh (đen 30%) + CHẶN CLICK =====
    property color backdropColor: "#4D000000"
    // ===== Overlay "khoét lỗ" cho bàn phím (union IM rect + InputPanel visual, có margin tuỳ chỉnh) =====
    Overlay.modal: Item {
        id: dimmer
        anchors.fill: parent

        // Tuỳ chỉnh khoảng chừa thêm
        readonly property real holeMarginX: Math.round(0 * root.uiScale)
        readonly property real holeMarginY: Math.round(0 * root.uiScale)

        // 1) Rect do Qt báo (không tính scale của InputPanel)
        readonly property rect imRect: (Qt.inputMethod && Qt.inputMethod.visible)
                                    ? Qt.inputMethod.keyboardRectangle
                                    : Qt.rect(0, 0, 0, 0)
        readonly property bool imOk: (imRect.width > 0 && imRect.height > 0)

        // 2) Rect thực tế của InputPanel sau khi scale/transform (nếu có)
        //    Lưu ý: 'inputPanel' là id bạn khai báo ở main. Nếu khác id, đổi ở đây.
        readonly property bool panelOk: (typeof inputPanel !== "undefined" && inputPanel && inputPanel.visible)

        readonly property var _p0: panelOk ? inputPanel.mapToItem(dimmer, 0, 0) : Qt.point(0, 0)
        readonly property var _p1: panelOk ? inputPanel.mapToItem(dimmer, inputPanel.width, inputPanel.height) : Qt.point(0, 0)
        readonly property real pX: panelOk ? Math.min(_p0.x, _p1.x) : 0
        readonly property real pY: panelOk ? Math.min(_p0.y, _p1.y) : 0
        readonly property real pW: panelOk ? Math.abs(_p1.x - _p0.x) : 0
        readonly property real pH: panelOk ? Math.abs(_p1.y - _p0.y) : 0

        // 3) Hợp nhất 2 rect (cái nào visible thì tính)
        readonly property bool kbVisible: (imOk || panelOk)

        readonly property real rawX: (imOk && panelOk) ? Math.min(imRect.x, pX)
                                : (imOk ? imRect.x : pX)
        readonly property real rawY: (imOk && panelOk) ? Math.min(imRect.y, pY)
                                : (imOk ? imRect.y : pY)
        readonly property real rawRight: (imOk && panelOk) ? Math.max(imRect.x + imRect.width,  pX + pW)
                                    : (imOk ? (imRect.x + imRect.width) : (pX + pW))
        readonly property real rawBottom:(imOk && panelOk) ? Math.max(imRect.y + imRect.height, pY + pH)
                                    : (imOk ? (imRect.y + imRect.height) : (pY + pH))

        // 4) Nới lỗ bằng margin, có clamp về biên màn hình overlay
        readonly property real holeX: Math.max(0, rawX - holeMarginX)
        readonly property real holeY: Math.max(0, rawY - holeMarginY)
        readonly property real holeW: Math.min(dimmer.width  - holeX, (rawRight  - rawX) + 2*holeMarginX)
        readonly property real holeH: Math.min(dimmer.height - holeY, (rawBottom - rawY) + 2*holeMarginY)

        // === 4 mảnh overlay xung quanh lỗ ===
        Rectangle { // TRÊN
            anchors.left: parent.left
            anchors.right: parent.right
            y: 0
            height: Math.max(0, kbVisible ? holeY : dimmer.height)
            color: root.backdropColor
            visible: true
            Behavior on opacity { NumberAnimation { duration: 120 } }
        }
        Rectangle { // TRÁI
            x: 0; y: holeY
            width: Math.max(0, kbVisible ? holeX : 0)
            height: holeH
            color: root.backdropColor
            visible: kbVisible
        }
        Rectangle { // PHẢI
            x: holeX + holeW; y: holeY
            width: Math.max(0, kbVisible ? (dimmer.width - (holeX + holeW)) : 0)
            height: holeH
            color: root.backdropColor
            visible: kbVisible
        }
        Rectangle { // DƯỚI
            anchors.left: parent.left
            anchors.right: parent.right
            y: holeY + holeH
            height: Math.max(0, kbVisible ? (dimmer.height - (holeY + holeH)) : 0)
            color: root.backdropColor
            visible: kbVisible
        }

        // Chặn click nền nhưng không chặn vùng "lỗ"
        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.AllButtons
            hoverEnabled: true
            propagateComposedEvents: false
            function inHole(x, y) {
                if (!kbVisible) return false
                return (x >= holeX && x <= holeX + holeW &&
                        y >= holeY && y <= holeY + holeH)
            }
            onPressed:  (m)=> { m.accepted = !inHole(m.x, m.y) }
            onReleased: (m)=> { m.accepted = true }
            onClicked:  (m)=> { m.accepted = true }
            onWheel:    (w)=> { w.accepted = true }
        }
    }


    // ===== Responsive =====
    property real uiScale: (typeof win !== "undefined" && win)
                           ? Math.min(win.width/1920, win.height/1080) : 1

    // ===== NGANG =====
    property real fixedW:     560 * uiScale
    property real minW:       320 * uiScale
    property real sideMargin: 20  * uiScale

    readonly property real _overlayW: (win ? win.width  : width)
    readonly property real _overlayH: (win ? win.height : height)
    readonly property real _maxW: Math.max(0, _overlayW - 2*sideMargin)
    property  real dialogW: Math.round(Math.max(minW, Math.min(fixedW, _maxW)))

    // ===== DỌC =====
    property real maxHeightRatio: 0.92
    property bool avoidKeyboard: false
    property real keyboardMargin: 0
    readonly property real _safeH: Math.max(0, _overlayH * maxHeightRatio)

    // ===== Typography =====
    property int    titleFontSize:   Math.round(32 * uiScale)
    property string titleFontFamily: ""
    property int    contentFontSize: Math.round(16 * uiScale)

    // ===== Spacing & Margins =====
    property real contentMargins:       24 * uiScale
    property real sectionSpacing:       12 * uiScale
    property real headerContentSpacing: 24 * uiScale
    property real contentBottomMargin:  contentMargins

    // ===== API =====
    property string titleText:   (typeof win !== "undefined" && win) ? win.tr("dialog_default_title") : "Tiêu đề"
    property string confirmText: (typeof win !== "undefined" && win) ? win.tr("common_confirm") : "Xác nhận"
    property bool   confirmEnabled: true
    property string cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_cancel") : "Hủy"
    property bool   destructive: false

    // === NEW: nơi gắn ô nhập cần focus khi mở dialog
    property Item   initialFocusItem: null
    // === NEW: nếu không set initialFocusItem, thử auto-find input đầu tiên
    property bool   autoFocusOnOpen: true

    // ===== Nút =====
    property int   buttonHeight:    Math.round(72 * uiScale)
    property int   buttonMinWidth:  Math.round(180 * uiScale)
    property int   buttonFontSize:  Math.round(24 * uiScale)
    property color okNormalColor: "#60DB80"
    property color okHoverColor:  "#73E390"
    property color okDownColor:   "#4FC56B"
    property color okTextColor:   "white"

    // ===== Nút X tuỳ biến kích thước =====
    property int closeButtonDiameter: Math.round(56 * uiScale)
    property int closeButtonPadding:  Math.round(6  * uiScale)
    property int closeButtonRightMargin: Math.round(5 * uiScale)
    property int closeButtonTopMargin:   Math.round(5 * uiScale)
    property bool showScrollbar: false
    property bool showCloseButton: true

    signal confirmed()
    signal cancelled()

    // Định vị theo window — luôn căn giữa, chỉ né bàn phím khi avoidKeyboard = true
    x: Math.round((_overlayW - width) / 2)
    readonly property real _centerY: Math.round((_overlayH - height) / 2)
    readonly property real _maxTop: Math.max(contentMargins, _overlayH - height - contentBottomMargin)
    readonly property real _vkH: (typeof win !== "undefined" && win) ? win.vkHeight : 0
    readonly property real _kbTop: (avoidKeyboard && _vkH > 0)
                                   ? Math.max(contentMargins, _overlayH - _vkH - height - keyboardMargin)
                                   : _centerY
    y: Math.round(Math.max(contentMargins, Math.min(_maxTop, _kbTop)))

    background: Rectangle { color: "#FFFFFFFF"; radius: Math.round(14 * root.uiScale) }
    implicitWidth: dialogW

    // === NEW: Khi mở, ép focus vào input & bật VK ===
    onOpened: {
        // 1) ưu tiên item do caller truyền
        if (initialFocusItem && initialFocusItem.forceActiveFocus) {
            initialFocusItem.forceActiveFocus()
            try { Qt.inputMethod.show() } catch(e) {}
            return
        }
        // 2) fallback: auto tìm input bên trong body
        if (autoFocusOnOpen) {
            // duyệt đơn giản: lấy phần tử đầu trong bodyWrap nếu có API forceActiveFocus
            for (let i = 0; i < bodyWrap.data.length; ++i) {
                const c = bodyWrap.data[i]
                if (c && typeof c.forceActiveFocus === "function") {
                    c.forceActiveFocus()
                    try { Qt.inputMethod.show() } catch(e) {}
                    break
                }
            }
        }
    }

    // ===== CONTENT =====
    contentItem: Item {
        id: contentBox
        implicitWidth:  root.dialogW

        readonly property int _btnH:      root.buttonHeight
        readonly property int _btnW1:     root.buttonMinWidth
        readonly property int _btnW2:     root.buttonMinWidth
        readonly property int _btnFont:   root.buttonFontSize
        readonly property int _btnRadius: Math.round(28 * root.uiScale)

        Column {
            id: col
            x: Math.round(root.contentMargins)
            y: Math.round(root.contentMargins)
            width: Math.round(contentBox.width - 2*root.contentMargins)
            spacing: 0

            // Header
            Item {
                id: headerRow
                width: col.width
                height: Math.max(titleLabel.implicitHeight, closeWrap.height)

                AppText {
                    id: titleLabel
                    text: (root.titleText || "").toUpperCase()
                    color: "#172339"
                    wrapMode: Text.WordWrap
                    width: Math.max(0, headerRow.width - (closeWrap.width + Math.round(12 * root.uiScale)))
                    anchors.left: parent.left
                    anchors.verticalCenter: parent.verticalCenter
                    font.pixelSize: Math.round(root.titleFontSize)
                    font.bold: true
                    font.italic: true
                    font.family: root.titleFontFamily !== "" ? root.titleFontFamily : font.family
                    font.hintingPreference: Font.PreferFullHinting
                    renderType: Text.NativeRendering
                }

                // Close (X)
                Item {
                    id: closeWrap
                    visible: root.showCloseButton
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.rightMargin: -Math.round(root.contentMargins) + root.closeButtonRightMargin
                    anchors.topMargin:   -Math.round(root.contentMargins) + root.closeButtonTopMargin

                    width:  root.closeButtonDiameter
                    height: root.closeButtonDiameter

                    CircleIconButton {
                        anchors.centerIn: parent
                        diameter: root.closeButtonDiameter
                        padding:  root.closeButtonPadding
                        iconSource: "../../assets/icon/xmark_outline.svg"
                        onClicked: { root.cancelled(); root.close() }
                    }
                }
            }

            // Gap Header → Body
            Item { width: 1; height: Math.round(root.headerContentSpacing) }

            // Body cuộn
            Flickable {
                id: scroll
                width: col.width
                clip: true
                z: 0
                boundsBehavior: Flickable.StopAtBounds
                flickableDirection: Flickable.VerticalFlick

                readonly property real maxBodyH: Math.max(
                    0,
                    root._safeH
                    - root.contentMargins
                    - headerRow.height
                    - root.headerContentSpacing
                    - footerGap.height
                    - footerWrap.implicitHeight
                    - contentSpacer.height
                    - contentBox._btnH
                    - root.contentBottomMargin
                )
                height: Math.min(bodyWrap.implicitHeight, maxBodyH)

                contentWidth:  bodyWrap.width
                contentHeight: bodyWrap.implicitHeight

                // === NEW: chỉ bật kéo khi nội dung dài hơn khung
                interactive: bodyWrap.implicitHeight > maxBodyH

                // Mẹo: ưu tiên sự kiện cho con khi không kéo
                pressDelay: interactive ? 150 : 0

                ScrollBar.vertical: ScrollBar {
                    policy: root.showScrollbar ? ScrollBar.AsNeeded : ScrollBar.AlwaysOff
                    width: Math.max(8, Math.round(10 * root.uiScale))
                    contentItem: Rectangle {
                        radius: width / 2
                        color: "#CBD5E1"
                    }
                    background: Rectangle { color: "transparent" }
                }

                Column {
                    id: bodyWrap
                    width: scroll.width
                    spacing: Math.round(8 * root.uiScale)
                }
            }

            // Gap Body → Footer (only if footer has content)
            Item {
                id: footerGap
                width: 1
                height: footerWrap.implicitHeight > 0 ? Math.round(root.sectionSpacing) : 0
            }

            // Footer (non-scroll, stays fixed above buttons)
            Column {
                id: footerWrap
                width: col.width
                spacing: Math.round(8 * root.uiScale)
            }

            // Gap Body → Buttons
            Item { id: contentSpacer; width: 1; height: Math.round(root.sectionSpacing) }

            // Footer buttons
            Item {
                width: col.width
                height: contentBox._btnH
                z: 10

                Row {
                    id: btnRow
                    anchors.right: parent.right
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: Math.round(10 * root.uiScale)

                    Button {
                        id: cancelBtn
                        visible: root.cancelText !== ""
                        width:  Math.max(contentBox._btnW1, implicitContentWidth + Math.round(40 * root.uiScale))
                        height: contentBox._btnH
                        background: Rectangle {
                            color: "transparent"
                            radius: contentBox._btnRadius
                            border.color: root.destructive ? "#E53935" : root.okNormalColor
                            border.width: 1
                        }
                        contentItem: AppText {
                            text: root.cancelText
                            color: "#172339"
                            font.pixelSize: contentBox._btnFont
                            font.hintingPreference: Font.PreferFullHinting
                            renderType: Text.NativeRendering
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        onClicked: { root.cancelled(); root.close() }
                    }

                    Button {
                        id: confirmBtn
                        visible: root.confirmText !== ""
                        enabled: root.confirmEnabled
                        width:  Math.max(contentBox._btnW2, implicitContentWidth + Math.round(40 * root.uiScale))
                        height: contentBox._btnH
                        background: Rectangle {
                            readonly property color _baseColor: root.destructive
                                ? (confirmBtn.down ? "#D32F2F" : (confirmBtn.hovered ? "#EF5350" : "#E53935"))
                                : (confirmBtn.down ? root.okDownColor : (confirmBtn.hovered ? root.okHoverColor : root.okNormalColor))
                            color: confirmBtn.enabled ? _baseColor : "#CBD5E1"
                            radius: contentBox._btnRadius
                        }
                        contentItem: AppText {
                            text: root.confirmText
                            color: root.okTextColor
                            opacity: confirmBtn.enabled ? 1 : 0.35
                            font.pixelSize: contentBox._btnFont
                            font.bold: true
                            font.hintingPreference: Font.PreferFullHinting
                            renderType: Text.NativeRendering
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        onClicked: { root.confirmed(); root.close() }
                    }
                }
            }
        }

        implicitHeight: col.implicitHeight + root.contentMargins + root.contentBottomMargin
    }

    // Slot cho nội dung con
    default property alias body: bodyWrap.data
    property alias footer: footerWrap.data
}

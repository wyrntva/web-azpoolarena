// qml/components/ControlPanel.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Shapes 6
import QtQuick.Window 6
import Qt5Compat.GraphicalEffects

Item {
    id: panel

    // ========== KÍCH THƯỚC & BỐ CỤC ==========
    property bool useFixedSize: true
    property int  panelWidth:   400
    property int  panelHeight:  700

    property int  panelPadding: 14
    property int  gap:          12
    property int  panelRadius:  16
    property color bgColor:     "#172339"
    property color borderColor: "#172339"

    // Header
    function trLocal(key) {
        return (typeof win !== "undefined" && win && typeof win.tr === "function") ? win.tr(key) : key
    }

    property string headerText:         DeviceSettings.tableName ? DeviceSettings.tableName.toUpperCase() : trLocal("score_header_table3")
    property int    headerHeight:       48
    property int    headerFontPx:       32
    property color  headerStripColor:   "#60DB80"
    property int    headerStripWidth:   420
    property real   headerBottomRadius: 14

    // Khoảng cách
    property int contentTopMargin: 20
    property int sectionGap:       10

    // ---- Tham số style cho NÚT (KHÔNG tô màu icon) ----
    // Lưu ý: không có iconColor; màu icon sẽ lấy từ màu gốc file SVG/PNG.
    property int  actionBtnWidth:   140
    property int  actionBtnHeight:   90
    property int  actionRadius:      16
    property int  actionPadding:     12
    property int  actionGap:          8
    property int  actionIconSize:    36
    property int  actionFontPx:      16
    property color actionBg:         "white"
    property color actionFg:         "#172339"
    property color actionShadowColor:"#0F000000"
    property real  actionShadowBlur: 10
    property int   actionShadowOffsetY: 6
    property int   btnGap: 36

    // ---- Text/icon mặc định cho 3 nút (optional) ----
    property string btn1Text: trLocal("panel_btn1_default")
    property string btn2Text: trLocal("panel_btn2_default")
    property string btn3Text: trLocal("panel_btn3_default")
    property url    btn1Icon: ""
    property url    btn2Icon: ""
    property url    btn3Icon: ""

    // ---- Slot để đặt nội dung tuỳ ý ----
    default property alias content: contentHost.data

    // ===== SNAP integer (giúp icon & stroke không rơi vào nửa pixel) =====
    readonly property int _panelW:     Math.round(panelWidth)
    readonly property int _panelH:     Math.round(panelHeight)
    readonly property int _pad:        Math.round(panelPadding)
    readonly property int _gap:        Math.round(gap)
    readonly property int _radius:     Math.round(panelRadius)
    readonly property int _hdrH:       Math.round(headerHeight)
    readonly property int _hdrFont:    Math.round(headerFontPx)
    readonly property int _hdrStripW:  Math.round(headerStripWidth)
    readonly property int _hdrBottomR: Math.round(headerBottomRadius)
    readonly property int _contentTop: Math.round(contentTopMargin)
    readonly property int _sectionGap: Math.round(sectionGap)

    // Snap cho nhóm nút
    readonly property int _actionW:    Math.round(actionBtnWidth)
    readonly property int _actionH:    Math.round(actionBtnHeight)
    readonly property int _actionR:    Math.round(actionRadius)
    readonly property int _actionPad:  Math.round(actionPadding)
    readonly property int _actionGap:  Math.round(actionGap)
    readonly property int _actionIcon: Math.round(actionIconSize)
    readonly property int _actionFont: Math.round(actionFontPx)
    readonly property int _btnGap:     Math.round(btnGap)

    // ==== KHUNG 16:9 (để add camera sau) ====
    // Rộng = 3 nút + 2 khe; cao tự tính 16:9; nằm sát ngay dưới content (5px)
    property bool  frameVisible:       true
    property int   frameTopGap:        5
    property int   frameWidth:         _actionW * 3 + _btnGap * 2
    readonly property int frameHeight: Math.round(frameWidth * 9 / 16)
    property int   frameRadius:        14
    property color frameStroke:        "white"
    property real  frameStrokeW:       4
    property real  framePadding:       4
    property int   frameBottomMargin:  5

    // ==== IDLE BANNER SYSTEM ====
    property bool  enableBanner: true           // bật/tắt tính năng idle banner
    property int   idleTimeout: 120000          // ms trước khi ẩn nút (120s)
    property var   bannerImages: []             // danh sách URL banner (từ page)
    property string fallbackBanner: ""          // banner mặc định khi không có API
    property bool  _isIdle: false               // trạng thái idle hiện tại
    property int   _bannerIndex: 0              // index banner hiện tại
    
    // Cấu hình đồng bộ thời gian như SplashPage
    property int   slideIntervalMs: 15000
    property int   fadeDurationMs: 500
    property bool  _flipBanner: false

    onBannerImagesChanged: {
        if (panel._isIdle) {
            panel._initBannerSync()
        }
    }

    function bumpButtons() {
        if (!panel.enableBanner) return
        _isIdle = false
        _idleTimer.restart()
    }

    Timer {
        id: _idleTimer
        interval: panel.idleTimeout
        repeat: false
        running: panel.enableBanner
        onTriggered: {
            if (panel.enableBanner && (panel.bannerImages.length > 0 || panel.fallbackBanner !== "")) {
                panel._isIdle = true
                panel._initBannerSync()
            }
        }
    }
    // ===== PRECISE BANNER TRANSITION TIMER =====
    Timer {
        id: _bannerTransitionTimer
        interval: 1000
        running: false
        repeat: false
        onTriggered: {
            panel._doBannerTransition()
            panel._scheduleBannerTransition()
        }
    }

    on_IsIdleChanged: {
        if (panel._isIdle && panel.bannerImages.length > 1) {
            panel._initBannerSync()
        } else {
            _bannerTransitionTimer.stop()
        }
    }

    function _scheduleBannerTransition() {
        if (!panel._isIdle || panel.bannerImages.length <= 1) return
        var now = Date.now()
        var nextMs = (Math.floor(now / panel.slideIntervalMs) + 1) * panel.slideIntervalMs
        var delay = nextMs - now
        _bannerTransitionTimer.interval = Math.max(50, delay + 100)
        _bannerTransitionTimer.start()

        // Preload
        var nextEpochSec = Math.floor(nextMs / 1000)
        var intervalSec = Math.max(1, Math.round(panel.slideIntervalMs / 1000))
        var nextIndex = Math.floor(nextEpochSec / intervalSec) % panel.bannerImages.length
        var hiddenImg = panel._flipBanner ? bannerImgCurrent : bannerImgNext
        if (hiddenImg.source !== panel.bannerImages[nextIndex]) {
            hiddenImg.source = panel.bannerImages[nextIndex]
        }
    }

    function _doBannerTransition() {
        var imgs = panel.bannerImages
        if (imgs.length <= 1) return
        var intervalSec = Math.max(1, Math.round(panel.slideIntervalMs / 1000))
        var epochSec = Math.floor(Date.now() / 1000)
        var newIndex = Math.floor(epochSec / intervalSec) % imgs.length

        if (newIndex !== panel._bannerIndex) {
            panel._crossFadeBannerTo(newIndex)
        }
    }

    function _crossFadeBannerTo(next) {
        var imgs = panel.bannerImages
        if (imgs.length === 0) return

        var incoming = panel._flipBanner ? bannerImgCurrent : bannerImgNext
        var outgoing = panel._flipBanner ? bannerImgNext : bannerImgCurrent

        if (incoming.source !== imgs[next]) {
            incoming.source = imgs[next]
        }
        incoming.opacity = 0

        fadeInAnim.target  = incoming
        fadeOutAnim.target = outgoing
        fadeInAnim.start()
        fadeOutAnim.start()

        panel._bannerIndex = next
        panel._flipBanner = !panel._flipBanner
    }

    function _initBannerSync() {
        var imgs = panel.bannerImages
        panel._flipBanner = false   // reset flip state for consistent sync
        if (imgs.length <= 1) {
            panel._bannerIndex = 0
            bannerImgCurrent.source = imgs.length > 0 ? imgs[0] : panel.fallbackBanner
            bannerImgCurrent.opacity = 1
            bannerImgNext.opacity = 0
            return
        }
        var intervalSec = Math.max(1, Math.round(panel.slideIntervalMs / 1000))
        var epochSec = Math.floor(Date.now() / 1000)
        var idx = Math.floor(epochSec / intervalSec) % imgs.length

        panel._bannerIndex = idx
        bannerImgCurrent.source = imgs[idx]
        bannerImgCurrent.opacity = 1
        bannerImgNext.opacity = 0

        // Bắt đầu precise timer
        _scheduleBannerTransition()
    }

    // ====== KÍCH THƯỚC NGẦM ĐỊNH ======
    implicitWidth:  360
    implicitHeight: _hdrH
                   + _gap
                   + Math.max(0, contentHost.implicitHeight)
                   + (frameVisible ? (_gap + imageBox.implicitHeight) : 0)
                   + _pad * 2

    width:  useFixedSize ? _panelW  : Math.max(implicitWidth, 220)
    height: useFixedSize ? _panelH  : implicitHeight

    // ====== NỀN PANEL ======
    Rectangle {
        id: bgRect
        anchors.fill: parent
        color: bgColor
        radius: _radius
        border.width: 1
        border.color: borderColor
        z: -1
    }

    // ====== HEADER ======
    Item {
        id: headerBar
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: _hdrH

        Item {
            id: headerStripBox
            width: Math.min(parent.width - _pad*2, _hdrStripW)
            height: parent.height
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.verticalCenter: parent.verticalCenter

            Shape {
                anchors.fill: parent
                preferredRendererType: Shape.CurveRenderer
                ShapePath {
                    strokeWidth: 0
                    strokeColor: "transparent"
                    fillColor: headerStripColor
                    PathSvg {
                        path: {
                            const w = Math.round(headerStripBox.width);
                            const h = Math.round(headerStripBox.height);
                            let r = _hdrBottomR;
                            r = Math.max(0, Math.min(r, w/2, h/2));
                            return "M 0 0 H " + w + " V " + (h - r) +
                                   " A " + r + " " + r + " 0 0 1 " + (w - r) + " " + h +
                                   " H " + r + " A " + r + " " + r + " 0 0 1 0 " + (h - r) +
                                   " V 0 Z";
                        }
                    }
                }
            }

            AppText {
                anchors.centerIn: headerStripBox
                text:  panel.headerText
                color: "white"
                font.pixelSize: _hdrFont
                font.bold: true
            }
        }
    }

    // ====== SLOT NỘI DUNG (buttons) ======
    Item {
        id: contentHost
        visible: opacity > 0
        opacity: panel._isIdle ? 0 : 1
        Behavior on opacity { NumberAnimation { duration: 300; easing.type: Easing.InOutQuad } }
        anchors.top: headerBar.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: _pad
        anchors.topMargin: _pad + _contentTop
        implicitHeight: childrenRect.height
    }

    // ====== IDLE BANNER OVERLAY ======
    Rectangle {
        id: idleBannerHost
        visible: opacity > 0
        opacity: panel._isIdle ? 1 : 0
        Behavior on opacity { NumberAnimation { duration: 300; easing.type: Easing.InOutQuad } }

        // Tính vùng available giữa header và camera
        readonly property real _availTop: headerBar.y + headerBar.height + _pad + _contentTop
        readonly property real _availBottom: frameVisible ? imageBox.y : panel.height - _pad
        readonly property real _availH: Math.max(0, _availBottom - _availTop)

        // Kích thước 16:9 dựa trên chiều rộng panel
        readonly property real _bannerW: panel.width - _pad * 2
        readonly property real _bannerH: Math.round(_bannerW * 9 / 16)

        // Đẩy banner lên trên, chừa chỗ cho text hint bên dưới
        readonly property real _hintH: Math.round(40 * _uiS)
        x: _pad
        y: _availTop + Math.round(8 * _uiS)
        width: _bannerW
        height: Math.min(_bannerH, _availH - _hintH - Math.round(16 * _uiS))

        readonly property real _uiS: (typeof win !== "undefined" ? win.uiScale : 1)
        readonly property real _bannerRadius: Math.round(14 * _uiS)
        radius: 0
        color: "transparent"
        clip: true

        // Ảnh A
        Image {
            id: bannerImgCurrent
            width: idleBannerHost.width
            height: idleBannerHost.height
            anchors.centerIn: parent
            fillMode: Image.PreserveAspectCrop
            smooth: true
            source: panel.bannerImages.length > 0 ? panel.bannerImages[0] : panel.fallbackBanner
            opacity: 1
            layer.enabled: true
            layer.effect: OpacityMask {
                maskSource: Rectangle {
                    width: bannerImgCurrent.width
                    height: bannerImgCurrent.height
                    radius: idleBannerHost._bannerRadius
                }
            }
        }

        // Ảnh B
        Image {
            id: bannerImgNext
            width: idleBannerHost.width
            height: idleBannerHost.height
            anchors.centerIn: parent
            fillMode: Image.PreserveAspectCrop
            smooth: true
            source: ""
            opacity: 0
            layer.enabled: true
            layer.effect: OpacityMask {
                maskSource: Rectangle {
                    width: bannerImgNext.width
                    height: bannerImgNext.height
                    radius: idleBannerHost._bannerRadius
                }
            }
        }

        // Animation cross-fade
        NumberAnimation { id: fadeInAnim;  property: "opacity"; to: 1; duration: panel.fadeDurationMs;  easing.type: Easing.OutCubic }
        NumberAnimation { id: fadeOutAnim; property: "opacity"; to: 0; duration: panel.fadeDurationMs;  easing.type: Easing.OutCubic }

        MouseArea {
            anchors.fill: parent
            onClicked: panel.bumpButtons()
        }
    }

    // ====== HINT TEXT DƯỚI BANNER ======
    AppText {
        id: idleHintText
        visible: opacity > 0
        opacity: panel._isIdle ? 1 : 0
        Behavior on opacity { NumberAnimation { duration: 300; easing.type: Easing.InOutQuad } }
        anchors.top: idleBannerHost.bottom
        anchors.topMargin: Math.round(10 * (typeof win !== "undefined" ? win.uiScale : 1))
        anchors.horizontalCenter: idleBannerHost.horizontalCenter
        text: "👆 Chạm vào đây để hiển thị các nút chức năng"
        color: "#8899aa"
        font.pixelSize: Math.round(16 * (typeof win !== "undefined" ? win.uiScale : 1))
        font.italic: true

        MouseArea {
            anchors.fill: parent
            anchors.margins: -10
            onClicked: panel.bumpButtons()
        }
    }

    // ====== KHUNG 16:9 VỚI VIDEO CAMERA ======
    property string videoStreamUrl: ""          // URL HLS stream từ CameraController
    property bool   videoAutoPlay: true         // Tự động phát khi có URL
    property bool   videoMuted: true            // Tắt tiếng video
    property alias  cameraVideo: cameraVideoLoader.item
    signal videoClicked()                       // Emitted when user taps the video area

    Item {
        id: imageBox
        visible: frameVisible

        width: parent.width
        height: Math.round(frameHeight + framePadding)

        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: Math.round(frameBottomMargin)

        // Video container - simple clip without layer effect
        Rectangle {
            id: videoContainer
            width:  Math.round(frameWidth) - Math.round(frameStrokeW) * 2
            height: Math.round(frameHeight) - Math.round(frameStrokeW) * 2
            anchors.centerIn: parent
            radius: Math.max(0, Math.round(frameRadius) - Math.round(frameStrokeW))
            color: "#1a1a2e"
            clip: true

            // Camera video (loaded dynamically)
            Loader {
                id: cameraVideoLoader
                anchors.fill: parent
                active: frameVisible && panel.videoStreamUrl !== ""
                sourceComponent: CameraVideo {
                    streamUrl: panel.videoStreamUrl
                    radius: 0  // No radius needed, parent clips
                    autoPlay: panel.videoAutoPlay
                    muted: panel.videoMuted
                }
            }

            // Placeholder when no video
            Column {
                anchors.centerIn: parent
                spacing: 8 * (typeof win !== "undefined" ? win.uiScale : 1)
                visible: !cameraVideoLoader.active

                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: {
                        var hasCam = typeof CameraController !== "undefined" && CameraController
                        var url = hasCam ? CameraController.cameraUrl : ""
                        return url === "" ? "📷  Camera chưa được kết nối!" : "16:9"
                    }
                    color: {
                        var hasCam = typeof CameraController !== "undefined" && CameraController
                        var url = hasCam ? CameraController.cameraUrl : ""
                        return url === "" ? Qt.rgba(1, 1, 1, 0.5) : Qt.rgba(1, 1, 1, 0.15)
                    }
                    font.pixelSize: {
                        var hasCam = typeof CameraController !== "undefined" && CameraController
                        var url = hasCam ? CameraController.cameraUrl : ""
                        var scale = typeof win !== "undefined" ? win.uiScale : 1
                        return url === "" ? 18 * scale : 28 * scale
                    }
                    font.family: "Montserrat"
                    font.bold: true
                }
            }

            // Clickable overlay on the entire video container
            MouseArea {
                anchors.fill: parent
                z: 10  // On top of video and placeholder
                cursorShape: cameraVideoLoader.active ? Qt.PointingHandCursor : Qt.ArrowCursor
                onClicked: {
                    if (cameraVideoLoader.active) {
                        panel.bumpButtons()
                        panel.videoClicked()
                    }
                }
            }

            // Zoom hint icon (visible when video is playing)
            Rectangle {
                visible: cameraVideoLoader.active && cameraVideoLoader.item && cameraVideoLoader.item.isPlaying
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                anchors.rightMargin: Math.round(8 * (typeof win !== "undefined" ? win.uiScale : 1))
                anchors.bottomMargin: Math.round(8 * (typeof win !== "undefined" ? win.uiScale : 1))
                width: Math.round(28 * (typeof win !== "undefined" ? win.uiScale : 1))
                height: width
                radius: Math.round(6 * (typeof win !== "undefined" ? win.uiScale : 1))
                color: "#66000000"
                z: 11

                Text {
                    anchors.centerIn: parent
                    text: "⛶"
                    color: "white"
                    font.pixelSize: Math.round(16 * (typeof win !== "undefined" ? win.uiScale : 1))
                }

                // Don't block parent MouseArea
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        panel.bumpButtons()
                        panel.videoClicked()
                    }
                }
            }
        }

        // Frame border (on top of video)
        Rectangle {
            id: frameOnly
            width:  Math.round(frameWidth)
            height: Math.round(frameHeight)
            radius: Math.round(frameRadius)
            color: "transparent"
            border.color: frameStroke
            border.width: Math.round(frameStrokeW)
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.verticalCenter: parent.verticalCenter
            anchors.margins: Math.round(framePadding)
        }
    }
}

import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtMultimedia 6

import "../components"

DialogShell {
    id: root

    fixedW: Math.round(1200 * uiScale)
    maxHeightRatio: 0.92

    titleText: clipMode ? "Cắt video" : "Xem lại (6h)"
    confirmText: "Đóng"
    cancelText: ""

    property int segSec: 60
    readonly property int maxHours: 6
    readonly property int secondsInRange: maxHours * 60 * 60  // 6h = 21600 seconds

    // Rolling 6h window: rangeStart = now - 6h, rangeEnd = now
    property date rangeEnd: new Date()
    property date rangeStart: new Date(rangeEnd.getTime() - secondsInRange * 1000)

    property bool isScrubbing: false
    property bool isLoading: false
    property bool _autoAdvancing: false  // true when auto-loading next segment (no overlay)
    property string statusText: ""

    // Playback speed (kept in sync with TimelineBar)
    readonly property real playbackSpeed: timeline.currentSpeed

    property int _pendingSeekMs: -1
    property int _segmentStartSec: 0  // Timeline seconds at the START of current video segment
    property bool _isSeeking: false   // true while seek in progress, blocks onPositionChanged from updating timeline
    property string _pendingSourceUrl: ""  // URL queued for source change (delayed for overlay rendering)

    // Clip mode properties
    property bool clipMode: false
    property int clipStartSec: -1  // -1 = not set
    property int clipEndSec: -1    // -1 = not set
    property string clipCam: "1"

    // Computed clip timestamps
    readonly property string clipStartIso: clipStartSec >= 0 ? toIsoLocal(new Date(rangeStart.getTime() + clipStartSec * 1000)) : ""
    readonly property string clipEndIso: clipEndSec >= 0 ? toIsoLocal(new Date(rangeStart.getTime() + clipEndSec * 1000)) : ""
    readonly property bool clipReady: clipStartSec >= 0 && clipEndSec >= 0 && clipEndSec > clipStartSec
    readonly property int clipDuration: clipReady ? (clipEndSec - clipStartSec) : 0

    function pad2(n) { return (n < 10 ? "0" : "") + n }
    function fmtDate(d) {
        return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " +
               pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds())
    }
    function toIsoLocal(d) {
        return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + "T" +
               pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds())
    }
    function formatTime(sec) {
        var ts = new Date(rangeStart.getTime() + sec * 1000)
        return pad2(ts.getHours()) + ":" + pad2(ts.getMinutes()) + ":" + pad2(ts.getSeconds())
    }

    function openNow() {
        // Rolling 6h window ending at current time
        var now = new Date()
        rangeEnd = now
        rangeStart = new Date(now.getTime() - secondsInRange * 1000)

        // Set timeline to show full 6h range
        timeline.secondsInRange = secondsInRange
        timeline.rangeStartTime = rangeStart

        // Position caret close to "now" — only need ~20s buffer for segment completion + indexing
        timeline.seconds = secondsInRange - 20

        // Reset clip mode
        clipMode = false
        clipStartSec = -1
        clipEndSec = -1

        statusText = ""
        timeline.currentSpeed = 1.0  // Reset speed to 1x
        root.open()

        // Auto-jump to the selected time
        jumpToSeconds(timeline.seconds)
    }

    function setClipStart() {
        clipStartSec = timeline.seconds
        // If end is before start, reset end
        if (clipEndSec >= 0 && clipEndSec <= clipStartSec) {
            clipEndSec = -1
        }
    }

    function setClipEnd() {
        clipEndSec = timeline.seconds
        // If start is after end, reset start
        if (clipStartSec >= 0 && clipStartSec >= clipEndSec) {
            clipStartSec = -1
        }
    }

    function resetClip() {
        clipStartSec = -1
        clipEndSec = -1
    }

    function getClipUrl() {
        if (!clipReady) return ""
        return ClipController.getClipUrl(clipCam, clipStartIso, clipEndIso)
    }

    function jumpToSeconds(secOffset, autoAdvance) {
        // secOffset is seconds from rangeStart (0 = 6h ago, secondsInRange = now)
        // autoAdvance = true when called from loadNextSegment (no loading overlay)
        timeline.seconds = secOffset
        _autoAdvancing = (autoAdvance === true)
        _isSeeking = true

        // Calculate actual timestamp — NO offset needed.
        // Index 'start' = mtime - segSec = actual start of recording.
        // Video content covers [start, start+segSec].
        var ts = new Date(rangeStart.getTime() + secOffset * 1000)
        var iso = toIsoLocal(ts)
        var result = DVRController.resolve(iso)
        if (!result || !result.ok) {
            statusText = result && result.error ? result.error : "Không có bản ghi"
            isLoading = false
            _autoAdvancing = false
            _isSeeking = false
            return
        }

        statusText = ""

        var url = result.fileUrl
        var offsetMs = result.offsetMs
        var segStartIso = result.segStartIso

        // Calculate segment start time on timeline using actual segment start time
        var segStartDate = new Date(segStartIso)
        _segmentStartSec = Math.floor((segStartDate.getTime() - rangeStart.getTime()) / 1000)

        console.log("jumpToSeconds:", secOffset, "autoAdvance:", _autoAdvancing,
                    "segStartIso:", segStartIso, "_segmentStartSec:", _segmentStartSec, "offsetMs:", offsetMs)

        if (mediaPlayer.source.toString() !== url) {
            // Switching to a different video file
            _pendingSeekMs = offsetMs

            // Always show overlay to prevent black flash during source switch.
            isLoading = true
            mediaPlayer.pause()

            if (_autoAdvancing) {
                // Auto-advance: play from START of next segment (no seek needed).
                // This eliminates the seek delay for seamless transitions.
                _pendingSeekMs = 0
                // Align _segmentStartSec so poller advances timeline immediately
                _segmentStartSec = timeline.seconds
                var autoUrl = url
                Qt.callLater(function() {
                    console.log("[auto] Setting source:", autoUrl)
                    mediaPlayer.source = autoUrl
                    mediaPlayer.play()
                })
            } else {
                // Manual seek: use timer to ensure overlay renders first
                root._pendingSourceUrl = url
                sourceChangeTimer.restart()
            }
            // Seek will be handled by onMediaStatusChanged when loaded
        } else {
            // Same file, just seek — pause first to prevent onPositionChanged jitter
            mediaPlayer.pause()
            _pendingSeekMs = -1
            _autoAdvancing = false
            if (offsetMs > 0) {
                mediaPlayer.position = offsetMs
            }
            // Delay play to let seek settle, then clear _isSeeking
            seekPlayTimer.restart()
        }
    }

    // Load next segment when current one ends
    function loadNextSegment() {
        // Use current timeline position + 1 second to get the next segment
        var nextSec = timeline.seconds + 1

        // Don't go past "now - 20s" to avoid incomplete segment (12s segment + indexing buffer)
        var maxSec = secondsInRange - 20
        if (nextSec > maxSec) {
            statusText = "Đã đến video mới nhất"
            return
        }

        console.log("Auto-loading next segment at:", nextSec)
        jumpToSeconds(nextSec, true)  // true = autoAdvance, no loading overlay
    }

    onConfirmed: {
        mediaPlayer.stop()
        root.close()
    }

    Timer {
        id: nowTimer
        interval: 1000
        repeat: true
        running: root.opened
        onTriggered: {
            // Don't update rangeStart while playing or scrubbing
            // Otherwise time display will run at 2x speed
            if (root.isScrubbing) return
            if (mediaPlayer.playbackState === MediaPlayer.PlayingState) return

            // Update rolling window (rangeEnd = now, rangeStart = now - 6h)
            var now = new Date()
            root.rangeEnd = now
            root.rangeStart = new Date(now.getTime() - root.secondsInRange * 1000)

            // Update timeline's rangeStartTime for labels
            timeline.rangeStartTime = root.rangeStart
        }
    }

    body: ColumnLayout {
        width: parent.width
        spacing: Math.round(12 * root.uiScale)

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.round(420 * root.uiScale)
            color: "black"
            radius: Math.round(12 * root.uiScale)
            border.color: "#2a2a2a"
            border.width: 1

            Item {
                id: videoStage
                anchors.fill: parent
                anchors.margins: 1
                clip: true  // Clip zoomed video to container bounds

                readonly property var _res: mediaPlayer.metaData ? mediaPlayer.metaData.value(MediaMetaData.Resolution) : undefined
                readonly property real _srcW: Math.max(1, (_res && _res.width) ? _res.width : 16)
                readonly property real _srcH: Math.max(1, (_res && _res.height) ? _res.height : 9)
                readonly property real _ar: _srcW / _srcH

                readonly property real _fitW: Math.min(width, height * _ar)
                readonly property real _fitH: Math.min(height, width / _ar)

                // ===== Zoom & Pan properties =====
                property real zoomScale: 1.0
                property real panX: 0
                property real panY: 0
                readonly property real minZoom: 1.0
                readonly property real maxZoom: 5.0
                readonly property bool isZoomed: zoomScale > 1.05

                Behavior on zoomScale {
                    id: zoomAnim
                    enabled: false
                    NumberAnimation { duration: 250; easing.type: Easing.OutCubic }
                }
                Behavior on panX {
                    id: panXAnim
                    enabled: false
                    NumberAnimation { duration: 250; easing.type: Easing.OutCubic }
                }
                Behavior on panY {
                    id: panYAnim
                    enabled: false
                    NumberAnimation { duration: 250; easing.type: Easing.OutCubic }
                }

                function resetZoom() {
                    zoomAnim.enabled = true
                    panXAnim.enabled = true
                    panYAnim.enabled = true
                    zoomScale = 1.0
                    panX = 0
                    panY = 0
                    // Disable animation after it completes
                    resetAnimTimer.restart()
                }

                Timer {
                    id: resetAnimTimer
                    interval: 300
                    onTriggered: {
                        zoomAnim.enabled = false
                        panXAnim.enabled = false
                        panYAnim.enabled = false
                    }
                }

                function clampPan() {
                    // Limit panning so video stays partially visible
                    var maxPanX = (_fitW * (zoomScale - 1)) / 2
                    var maxPanY = (_fitH * (zoomScale - 1)) / 2
                    panX = Math.max(-maxPanX, Math.min(maxPanX, panX))
                    panY = Math.max(-maxPanY, Math.min(maxPanY, panY))
                }

                VideoOutput {
                    id: videoOut
                    width: videoStage._fitW
                    height: videoStage._fitH
                    anchors.centerIn: parent
                    fillMode: VideoOutput.Stretch

                    transform: [
                        Scale {
                            origin.x: videoOut.width / 2
                            origin.y: videoOut.height / 2
                            xScale: videoStage.zoomScale
                            yScale: videoStage.zoomScale
                        },
                        Translate {
                            x: videoStage.panX
                            y: videoStage.panY
                        }
                    ]
                }

                // ===== Pinch-to-zoom + Drag-to-pan =====
                PinchArea {
                    id: pinchArea
                    anchors.fill: parent
                    z: 5
                    enabled: !root.isLoading

                    property real startScale: 1.0
                    property real startPanX: 0
                    property real startPanY: 0

                    onPinchStarted: {
                        zoomAnim.enabled = false
                        panXAnim.enabled = false
                        panYAnim.enabled = false
                        startScale = videoStage.zoomScale
                        startPanX = videoStage.panX
                        startPanY = videoStage.panY
                    }

                    onPinchUpdated: function(pinch) {
                        // Scale
                        var newScale = startScale * pinch.scale
                        videoStage.zoomScale = Math.max(videoStage.minZoom, Math.min(videoStage.maxZoom, newScale))

                        // Pan following pinch center movement
                        videoStage.panX = startPanX + (pinch.center.x - pinch.startCenter.x)
                        videoStage.panY = startPanY + (pinch.center.y - pinch.startCenter.y)
                    }

                    onPinchFinished: {
                        if (videoStage.zoomScale < 1.05) {
                            videoStage.resetZoom()
                        } else {
                            videoStage.clampPan()
                        }
                    }

                    // Drag-to-pan when zoomed + double-tap to reset
                    MouseArea {
                        anchors.fill: parent
                        enabled: true

                        property real lastX: 0
                        property real lastY: 0
                        property bool dragging: false

                        onPressed: function(mouse) {
                            lastX = mouse.x
                            lastY = mouse.y
                            dragging = false
                        }

                        onPositionChanged: function(mouse) {
                            if (videoStage.isZoomed) {
                                var dx = mouse.x - lastX
                                var dy = mouse.y - lastY
                                if (!dragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                                    dragging = true
                                }
                                if (dragging) {
                                    zoomAnim.enabled = false
                                    panXAnim.enabled = false
                                    panYAnim.enabled = false
                                    videoStage.panX += dx
                                    videoStage.panY += dy
                                    lastX = mouse.x
                                    lastY = mouse.y
                                }
                            }
                        }

                        onReleased: {
                            if (videoStage.isZoomed) {
                                videoStage.clampPan()
                            }
                            dragging = false
                        }

                        onDoubleClicked: {
                            if (videoStage.isZoomed) {
                                videoStage.resetZoom()
                            }
                        }
                    }
                }

                // ===== Zoom indicator badge =====
                Rectangle {
                    visible: videoStage.isZoomed
                    anchors.top: parent.top
                    anchors.right: parent.right
                    anchors.topMargin: Math.round(8 * root.uiScale)
                    anchors.rightMargin: Math.round(8 * root.uiScale)
                    width: zoomLabel.implicitWidth + Math.round(16 * root.uiScale)
                    height: zoomLabel.implicitHeight + Math.round(8 * root.uiScale)
                    color: "#CC000000"
                    radius: Math.round(6 * root.uiScale)
                    z: 15

                    AppText {
                        id: zoomLabel
                        anchors.centerIn: parent
                        text: videoStage.zoomScale.toFixed(1) + "x"
                        color: "white"
                        font.pixelSize: Math.round(14 * root.uiScale)
                        font.bold: true
                        renderType: Text.NativeRendering
                    }
                }

                // Loading overlay to prevent flash during segment transitions
                Rectangle {
                    id: loadingOverlay
                    anchors.fill: parent
                    color: "black"
                    // Show instantly, fade out slowly
                    opacity: root.isLoading ? 1.0 : 0.0
                    visible: true  // Always visible to prevent flicker
                    z: 10

                    Behavior on opacity {
                        enabled: !root.isLoading  // Only animate when hiding (fade out)
                        NumberAnimation { duration: 350 }
                    }

                    AppText {
                        anchors.centerIn: parent
                        text: "Đang tải..."
                        color: "white"
                        font.pixelSize: Math.round(18 * root.uiScale)
                        renderType: Text.NativeRendering
                        // Only show text for manual seeks, not for auto-advance
                        visible: root.isLoading && !root._autoAdvancing
                    }
                }
            }

            Rectangle {
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                height: Math.round(36 * root.uiScale)
                color: "#00000080"

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: Math.round(8 * root.uiScale)

                    AppText {
                        Layout.fillWidth: true
                        text: root.statusText
                        color: "#ffb4b4"
                        visible: root.statusText.length > 0
                        elide: Text.ElideRight
                        font.pixelSize: Math.round(16 * root.uiScale)
                        renderType: Text.NativeRendering
                    }

                    AppText {
                        text: root.isLoading ? "Loading..." : ""
                        color: "white"
                        visible: root.isLoading
                        font.pixelSize: Math.round(16 * root.uiScale)
                        renderType: Text.NativeRendering
                    }
                }
            }
        }

        TimelineBar {
            id: timeline
            Layout.fillWidth: true
            secondsInRange: root.secondsInRange
            rangeStartTime: root.rangeStart

            // Clip mode limits: when start is set, cannot go back before start, max 15 min forward
            minSec: (root.clipMode && root.clipStartSec >= 0) ? root.clipStartSec : 0
            maxSec: (root.clipMode && root.clipStartSec >= 0) ? Math.min(root.clipStartSec + 900, root.secondsInRange - 20) : (root.secondsInRange - 20)

            onSecondsChangedByUser: (sec)=>{ /* live update only; seek happens on release */ }
            onScrubStarted:  root.isScrubbing = true
            onScrubEnded:    (sec)=>{ root.isScrubbing = false; root.jumpToSeconds(sec) }
            onSeekBackward: (delta)=>{ root.jumpToSeconds(Math.max(timeline.minSec, timeline.seconds - delta)) }
            onSeekForward:  (delta)=>{ root.jumpToSeconds(Math.min(timeline.maxSec, timeline.seconds + delta)) }

            // Clip markers overlay
            Item {
                visible: root.clipMode
                anchors.fill: parent
                z: 5

                // Start marker
                Rectangle {
                    visible: root.clipStartSec >= 0
                    width: 4
                    height: parent.height - 20
                    x: (parent.width / 2) + (root.clipStartSec - timeline.seconds) * timeline.pixelsPerSecond - 2
                    y: 0
                    color: "#4CAF50"
                    radius: 2

                    Rectangle {
                        width: 20
                        height: 16
                        radius: 4
                        color: "#4CAF50"
                        anchors.horizontalCenter: parent.horizontalCenter
                        anchors.top: parent.top
                        anchors.topMargin: 4

                        AppText {
                            anchors.centerIn: parent
                            text: "S"
                            color: "white"
                            font.pixelSize: 11
                            font.bold: true
                        }
                    }
                }

                // End marker
                Rectangle {
                    visible: root.clipEndSec >= 0
                    width: 4
                    height: parent.height - 20
                    x: (parent.width / 2) + (root.clipEndSec - timeline.seconds) * timeline.pixelsPerSecond - 2
                    y: 0
                    color: "#f44336"
                    radius: 2

                    Rectangle {
                        width: 20
                        height: 16
                        radius: 4
                        color: "#f44336"
                        anchors.horizontalCenter: parent.horizontalCenter
                        anchors.top: parent.top
                        anchors.topMargin: 4

                        AppText {
                            anchors.centerIn: parent
                            text: "E"
                            color: "white"
                            font.pixelSize: 11
                            font.bold: true
                        }
                    }
                }

                // Selection range highlight
                Rectangle {
                    visible: root.clipStartSec >= 0 && root.clipEndSec >= 0
                    height: 8
                    y: parent.height - 28
                    x: (parent.width / 2) + (root.clipStartSec - timeline.seconds) * timeline.pixelsPerSecond
                    width: (root.clipEndSec - root.clipStartSec) * timeline.pixelsPerSecond
                    color: "#8066BB6A"
                    radius: 4
                }
            }
        }

        // Clip mode controls
        RowLayout {
            Layout.fillWidth: true
            Layout.topMargin: Math.round(8 * root.uiScale)
            spacing: Math.round(12 * root.uiScale)

            // Start button
            Rectangle {
                visible: root.clipMode
                Layout.preferredWidth: Math.round(120 * root.uiScale)
                Layout.preferredHeight: Math.round(40 * root.uiScale)
                color: startBtnMouse.containsMouse ? "#5CAF5F" : "#4CAF50"
                radius: Math.round(8 * root.uiScale)

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 6

                    AppText {
                        text: "S"
                        color: "white"
                        font.pixelSize: Math.round(14 * root.uiScale)
                        font.bold: true
                    }
                    AppText {
                        text: root.clipStartSec >= 0 ? root.formatTime(root.clipStartSec) : "--:--:--"
                        color: "white"
                        font.pixelSize: Math.round(14 * root.uiScale)
                    }
                }

                MouseArea {
                    id: startBtnMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.setClipStart()
                }
            }

            // End button
            Rectangle {
                visible: root.clipMode
                Layout.preferredWidth: Math.round(120 * root.uiScale)
                Layout.preferredHeight: Math.round(40 * root.uiScale)
                color: endBtnMouse.containsMouse ? "#E53935" : "#f44336"
                radius: Math.round(8 * root.uiScale)

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 6

                    AppText {
                        text: "E"
                        color: "white"
                        font.pixelSize: Math.round(14 * root.uiScale)
                        font.bold: true
                    }
                    AppText {
                        text: root.clipEndSec >= 0 ? root.formatTime(root.clipEndSec) : "--:--:--"
                        color: "white"
                        font.pixelSize: Math.round(14 * root.uiScale)
                    }
                }

                MouseArea {
                    id: endBtnMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.setClipEnd()
                }
            }

            // Duration display
            Rectangle {
                Layout.preferredWidth: Math.round(100 * root.uiScale)
                Layout.preferredHeight: Math.round(40 * root.uiScale)
                color: "#333"
                radius: Math.round(8 * root.uiScale)
                visible: root.clipMode && root.clipReady

                AppText {
                    anchors.centerIn: parent
                    text: {
                        var d = root.clipDuration
                        var m = Math.floor(d / 60)
                        var s = d % 60
                        return root.pad2(m) + ":" + root.pad2(s)
                    }
                    color: "white"
                    font.pixelSize: Math.round(16 * root.uiScale)
                    font.bold: true
                }
            }

            Item { Layout.fillWidth: true }

            // Reset button
            Rectangle {
                Layout.preferredWidth: Math.round(80 * root.uiScale)
                Layout.preferredHeight: Math.round(40 * root.uiScale)
                color: resetBtnMouse.containsMouse ? "#666" : "#555"
                radius: Math.round(8 * root.uiScale)
                visible: root.clipMode && (root.clipStartSec >= 0 || root.clipEndSec >= 0)

                AppText {
                    anchors.centerIn: parent
                    text: "Reset"
                    color: "white"
                    font.pixelSize: Math.round(14 * root.uiScale)
                }

                MouseArea {
                    id: resetBtnMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.resetClip()
                }
            }

            // Toggle clip mode button
            Rectangle {
                Layout.preferredWidth: Math.round(130 * root.uiScale)
                Layout.preferredHeight: Math.round(40 * root.uiScale)
                color: clipModeBtnMouse.containsMouse ? (root.clipMode ? "#555" : "#1976D2") : (root.clipMode ? "#444" : "#1565C0")
                radius: Math.round(8 * root.uiScale)

                AppText {
                    anchors.centerIn: parent
                    text: root.clipMode ? "Huỷ cắt video" : "Cắt video"
                    color: "white"
                    font.pixelSize: Math.round(14 * root.uiScale)
                }

                MouseArea {
                    id: clipModeBtnMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        root.clipMode = !root.clipMode
                        if (!root.clipMode) {
                            root.resetClip()
                        }
                    }
                }
            }
        }

        // QR Code section — download QR (left) + WiFi QR (right)
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.round(140 * root.uiScale)
            Layout.topMargin: Math.round(8 * root.uiScale)
            color: "#1a1a1a"
            radius: Math.round(12 * root.uiScale)
            visible: root.clipMode && root.clipReady

            // WiFi data from BannerService
            property string wifiSsid: (typeof BannerService !== "undefined" && BannerService) ? BannerService.wifiSsid() : ""
            property string wifiPass: (typeof BannerService !== "undefined" && BannerService) ? BannerService.wifiPassword() : ""
            property string wifiQrString: wifiSsid.length > 0 ? ("WIFI:T:WPA;S:" + wifiSsid + ";P:" + wifiPass + ";;") : ""

            Connections {
                target: BannerService
                function onWifiChanged() {
                    parent.wifiSsid = BannerService.wifiSsid()
                    parent.wifiPass = BannerService.wifiPassword()
                }
            }

            RowLayout {
                anchors.fill: parent
                anchors.margins: Math.round(16 * root.uiScale)
                spacing: Math.round(16 * root.uiScale)

                // ── LEFT: Download video QR ──
                RowLayout {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    spacing: Math.round(12 * root.uiScale)

                    QrCodeImage {
                        id: qrCode
                        Layout.alignment: Qt.AlignVCenter
                        qrSize: Math.round(100 * root.uiScale)
                        targetUrl: root.clipReady ? root.getClipUrl() : ""
                    }

                    ColumnLayout {
                        Layout.alignment: Qt.AlignVCenter
                        spacing: Math.round(5 * root.uiScale)

                        AppText {
                            text: "Quét mã QR để tải video về máy"
                            color: "white"
                            font.pixelSize: Math.round(15 * root.uiScale)
                            font.bold: true
                        }

                        AppText {
                            text: "Bắt đầu: " + root.clipStartIso
                            color: "#4CAF50"
                            font.pixelSize: Math.round(13 * root.uiScale)
                        }

                        AppText {
                            text: "Kết thúc: " + root.clipEndIso
                            color: "#f44336"
                            font.pixelSize: Math.round(13 * root.uiScale)
                        }

                        AppText {
                            text: {
                                var d = root.clipDuration
                                var m = Math.floor(d / 60)
                                var s = d % 60
                                var txt = "Thời gian: "
                                if (m > 0) txt += m + " phút "
                                txt += s + " giây"
                                txt += " (tối đa 15 phút)"
                                return txt
                            }
                            color: root.clipDuration > 900 ? "#f44336" : "#888"
                            font.pixelSize: Math.round(12 * root.uiScale)
                        }
                    }
                }

                // ── Divider ──
                Rectangle {
                    Layout.preferredWidth: 1
                    Layout.fillHeight: true
                    Layout.topMargin: Math.round(8 * root.uiScale)
                    Layout.bottomMargin: Math.round(8 * root.uiScale)
                    color: "#333"
                }

                // ── RIGHT: WiFi QR ──
                RowLayout {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    spacing: Math.round(12 * root.uiScale)

                    QrCodeImage {
                        id: wifiQrCode
                        Layout.alignment: Qt.AlignVCenter
                        qrSize: Math.round(100 * root.uiScale)
                        targetUrl: parent.parent.parent.wifiQrString
                    }

                    ColumnLayout {
                        Layout.alignment: Qt.AlignVCenter
                        spacing: Math.round(5 * root.uiScale)

                        AppText {
                            text: "Quét mã QR để kết nối WIFI của quán"
                            color: "white"
                            font.pixelSize: Math.round(15 * root.uiScale)
                            font.bold: true
                        }

                        AppText {
                            text: "Tính năng tải video chỉ khả dụng\nkhi bạn sử dụng mạng Wi-Fi\nnội bộ của quán."
                            color: "#888"
                            font.pixelSize: Math.round(12 * root.uiScale)
                            lineHeight: 1.3
                            wrapMode: Text.WordWrap
                        }
                    }
                }
            }
        }



        MediaPlayer {
            id: mediaPlayer
            videoOutput: videoOut
            audioOutput: AudioOutput { }
            playbackRate: root.playbackSpeed

            onMediaStatusChanged: {
                console.log("MediaStatus changed:", mediaStatus, "pending:", root._pendingSeekMs)

                // DON'T seek during LoadingMedia - MP4 moov atom isn't parsed yet

                // Handle loading complete
                if (mediaStatus === MediaPlayer.LoadedMedia || mediaStatus === MediaPlayer.BufferedMedia) {
                    if (root._pendingSeekMs > 0) {
                        // Need to seek within segment
                        var seekTarget = root._pendingSeekMs
                        root._pendingSeekMs = -1
                        mediaPlayer.pause()
                        mediaPlayer.position = seekTarget
                        console.log("Seek applied to:", seekTarget, "ms")
                        seekPlayTimer.restart()
                        return
                    }
                    // offsetMs was 0 or already consumed — play from start, no seek needed
                    root._pendingSeekMs = -1
                    root._isSeeking = false
                    // Align _segmentStartSec so poller advances timeline immediately
                    root._segmentStartSec = timeline.seconds
                    if (playbackState !== MediaPlayer.PlayingState) {
                        play()
                    }
                }

                // Handle end of media - auto load next segment
                if (mediaStatus === MediaPlayer.EndOfMedia) {
                    console.log("End of media reached, loading next segment...")
                    // Show overlay IMMEDIATELY to prevent black flash
                    root.isLoading = true
                    root.loadNextSegment()
                }

                // Handle errors
                if (mediaStatus === MediaPlayer.InvalidMedia || mediaStatus === MediaPlayer.NoMedia) {
                    root.isLoading = false
                    root._autoAdvancing = false
                    root._isSeeking = false
                    if (mediaStatus === MediaPlayer.InvalidMedia) {
                        root.statusText = "Không thể phát video này"
                    }
                }
            }

            onPlaybackStateChanged: {
                console.log("PlaybackState changed:", playbackState)
                if (playbackState === MediaPlayer.PlayingState) {
                    // Use shorter overlay for auto-advance (seamless transition)
                    // vs longer overlay for manual seek (ensure stable render)
                    overlayHideTimer.interval = root._autoAdvancing ? 150 : 350
                    overlayHideTimer.restart()
                }
            }

            onPositionChanged: {
                // Timeline sync is handled by timelinePoller timer for reliability
            }

            onErrorOccurred: function(error, errorString) {
                console.log("MediaPlayer error:", error, errorString)
                root.isLoading = false
                root._isSeeking = false
                root.statusText = errorString || ("Lỗi phát video: " + error)
            }
        }

        Timer {
            id: seekPlayTimer
            interval: 200
            repeat: false
            onTriggered: {
                root._isSeeking = false
                mediaPlayer.play()

                // Align _segmentStartSec to compensate for keyframe offset.
                // Video may land on a keyframe 1-2s before the target;
                // this adjustment ensures the poller calculates the correct
                // timeline value immediately, so the clock runs without delay.
                var posMs = mediaPlayer.position
                if (posMs >= 0) {
                    root._segmentStartSec = timeline.seconds - Math.floor(posMs / 1000)
                }
            }
        }

        // Timer to delay source change so overlay renders first (manual seek only)
        Timer {
            id: sourceChangeTimer
            interval: 50
            repeat: false
            onTriggered: {
                if (root._pendingSourceUrl) {
                    console.log("Setting media player source to:", root._pendingSourceUrl)
                    mediaPlayer.source = root._pendingSourceUrl
                    root._pendingSourceUrl = ""
                    mediaPlayer.play()
                }
            }
        }

        // Reliable timeline position tracker — polls every 500ms
        Timer {
            id: timelinePoller
            interval: 500
            repeat: true
            running: root.opened && !root._isSeeking && !root.isScrubbing &&
                     mediaPlayer.playbackState === MediaPlayer.PlayingState
            onTriggered: {
                var posMs = mediaPlayer.position
                if (posMs < 0) return

                var positionSec = Math.floor(posMs / 1000)
                var newTimelineSec = root._segmentStartSec + positionSec

                // Only advance timeline forward — after a drag, timeline holds at
                // the user's target until video position catches up, then advances.
                if (newTimelineSec > timeline.seconds) {
                    timeline.seconds = newTimelineSec
                }
            }
        }

        // Timer to delay hiding overlay until first video frame is actually rendered
        Timer {
            id: overlayHideTimer
            interval: 350  // Dynamically set: 150 for auto-advance, 350 for manual
            repeat: false
            onTriggered: {
                root.isLoading = false
                root._autoAdvancing = false
            }
        }

    }
}

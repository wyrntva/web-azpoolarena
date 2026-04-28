// qml/components/CameraVideo.qml
import QtQuick 6
import QtQuick.Controls 6
import QtMultimedia 6

/**
 * CameraVideo - Video player component for delayed camera stream
 *
 * Usage:
 *   CameraVideo {
 *       width: 400
 *       height: 225  // 16:9 aspect
 *       streamUrl: CameraController.streamUrl
 *       radius: 14
 *   }
 */
Item {
    id: root

    // ========== Properties ==========
    property string streamUrl: ""
    property real radius: 0
    property bool autoPlay: true
    property bool showControls: false
    property bool muted: true

    // Camera URL update state (from Main.qml)
    property bool isReconnecting: typeof win !== "undefined" && win ? win.cameraIsReconnecting : false

    // Expose internal player and output for shared use (e.g., VideoZoomDialog)
    property alias player: mediaPlayer
    property alias videoOut: videoOutput

    // Status - use mediaStatus for more accurate state detection
    property alias status: mediaPlayer.playbackState
    property alias errorString: mediaPlayer.errorString
    // MediaStatus: 0=NoMedia, 1=Loading, 2=Loaded, 3=Stalled, 4=Buffering, 5=Buffered, 6=EndOfMedia, 7=InvalidMedia
    property bool isPlaying: mediaPlayer.mediaStatus >= 4 && mediaPlayer.mediaStatus <= 5
    property bool isLoading: mediaPlayer.mediaStatus === 1 || mediaPlayer.mediaStatus === 3 || mediaPlayer.mediaStatus === 4
    property bool hasError: mediaPlayer.mediaStatus === 7 || mediaPlayer.error !== MediaPlayer.NoError

    // Styling
    property color backgroundColor: "#1a1a2e"
    property color textColor: "#ffffff"
    property color loadingColor: "#60DB80"
    property color errorColor: "#E53935"

    // ========== Listen for force reload from CameraController ==========
    Connections {
        target: typeof CameraController !== "undefined" && CameraController ? CameraController : null
        function onForceReload() {
            console.log("[CameraVideo] forceReload received, reconnecting...")
            root.reconnect()
        }
    }

    Component.onCompleted: {
        var hasCam = (typeof CameraController !== "undefined" && CameraController !== null)
        console.log("[CameraVideo] Component created. streamUrl:", root.streamUrl,
                    "hasCameraController:", hasCam)
    }

    // ========== Reconnect State (exponential backoff) ==========
    property int _reconnectAttempts: 0
    // 0 = unlimited retries
    readonly property int _maxReconnectAttempts: 0
    readonly property int _baseReconnectMs: 2000  // 2s, 4s, 8s, 16s, 32s
    readonly property int _maxReconnectMs: 10000  // Cap reconnect delay to keep recovery responsive
    property int _stalledTicks: 0

    function nextReconnectInterval() {
        // Exponential backoff with hard cap (2s -> 4s -> 8s -> 10s ...)
        const exp = _baseReconnectMs * Math.pow(2, Math.max(0, _reconnectAttempts))
        return Math.min(_maxReconnectMs, exp)
    }

    // ========== Media Player ==========
    MediaPlayer {
        id: mediaPlayer
        source: root.streamUrl
        audioOutput: AudioOutput {
            muted: root.muted
            volume: 0.5
        }
        videoOutput: videoOutput

        onPlaybackStateChanged: {
            // No need to handle overlay here - Main.qml timer controls it
        }

        onErrorOccurred: function(error, errorString) {
            // Exponential backoff reconnect (only if under max attempts)
            if (root.autoPlay && root.streamUrl !== "" &&
                (root._maxReconnectAttempts <= 0 || root._reconnectAttempts < root._maxReconnectAttempts)) {
                reconnectTimer.interval = root.nextReconnectInterval()
                reconnectTimer.restart()
            }
        }

        onMediaStatusChanged: {
            if (mediaStatus === MediaPlayer.LoadedMedia && root.autoPlay) {
                reconnectTimer.stop()
                root._reconnectAttempts = 0  // Reset on success
                root._stalledTicks = 0
                mediaPlayer.play()
            } else if (mediaStatus === MediaPlayer.BufferedMedia) {
                reconnectTimer.stop()
                root._reconnectAttempts = 0
                root._stalledTicks = 0
            } else if (mediaStatus === MediaPlayer.EndOfMedia) {
                // HLS stream ended, reconnect with backoff
                if (root._maxReconnectAttempts <= 0 || root._reconnectAttempts < root._maxReconnectAttempts) {
                    reconnectTimer.interval = root.nextReconnectInterval()
                    reconnectTimer.restart()
                }
            }
        }
    }

    // ========== Reconnect Timer (exponential backoff) ==========
    Timer {
        id: reconnectTimer
        interval: root._baseReconnectMs
        repeat: false
        onTriggered: {
            if (root.streamUrl !== "" &&
                (root._maxReconnectAttempts <= 0 || root._reconnectAttempts < root._maxReconnectAttempts)) {
                root._reconnectAttempts++
                mediaPlayer.stop()
                mediaPlayer.source = ""
                mediaPlayer.source = root.streamUrl
                mediaPlayer.play()
            }
        }
    }

    Timer {
        id: watchdogTimer
        interval: 3000
        repeat: true
        running: root.visible && root.streamUrl !== ""
        onTriggered: {
            if (!root.visible || root.streamUrl === "") return

            // If player is not playing and not actively loading, force reconnect.
            if (mediaPlayer.playbackState !== MediaPlayer.PlayingState) {
                if (!root.isLoading && !reconnectTimer.running) {
                    root.reconnect()
                }
                return
            }

            // Live HLS often reports non-monotonic position; use StalledMedia as signal.
            if (mediaPlayer.mediaStatus === MediaPlayer.StalledMedia) {
                root._stalledTicks += 1
            } else {
                root._stalledTicks = 0
            }

            if (root._stalledTicks >= 2 && !reconnectTimer.running) {
                root._stalledTicks = 0
                root.reconnect()
            }
        }
    }

    // ========== Auto-play on URL change ==========
    onStreamUrlChanged: {
        root._reconnectAttempts = 0
        root._stalledTicks = 0
        if (streamUrl !== "" && autoPlay) {
            mediaPlayer.source = streamUrl
            mediaPlayer.play()
        } else if (streamUrl === "") {
            mediaPlayer.stop()
        }
    }

    onVisibleChanged: {
        if (!visible) {
            reconnectTimer.stop()
            watchdogTimer.stop()
            mediaPlayer.stop()
            mediaPlayer.source = ""
            return
        }
        if (streamUrl !== "" && autoPlay) {
            root.reconnect()
            watchdogTimer.start()
        }
    }

    // ========== Video Output ==========
    VideoOutput {
        id: videoOutput
        anchors.fill: parent
        fillMode: VideoOutput.PreserveAspectFit
    }

    // ========== Loading State ==========
    Item {
        id: loadingOverlay
        anchors.fill: parent
        visible: root.isLoading && !root.isPlaying

        Rectangle {
            anchors.fill: parent
            color: root.backgroundColor
            radius: root.radius
        }

        Column {
            anchors.centerIn: parent
            spacing: 12 * (typeof win !== "undefined" ? win.uiScale : 1)

            // Loading spinner
            Item {
                id: spinner
                width: 40 * (typeof win !== "undefined" ? win.uiScale : 1)
                height: width
                anchors.horizontalCenter: parent.horizontalCenter

                Rectangle {
                    id: spinnerArc
                    width: parent.width
                    height: width
                    radius: width / 2
                    color: "transparent"
                    border.width: 3 * (typeof win !== "undefined" ? win.uiScale : 1)
                    border.color: root.loadingColor
                    opacity: 0.3
                }

                Rectangle {
                    width: parent.width
                    height: width
                    radius: width / 2
                    color: "transparent"
                    border.width: 3 * (typeof win !== "undefined" ? win.uiScale : 1)
                    border.color: root.loadingColor

                    // Only show quarter arc
                    layer.enabled: true
                    layer.smooth: true

                    RotationAnimation on rotation {
                        from: 0
                        to: 360
                        duration: 1000
                        loops: Animation.Infinite
                        running: loadingOverlay.visible
                    }
                }
            }

            Text {
                text: trLocal("camera_connecting")
                color: root.textColor
                font.pixelSize: 16 * (typeof win !== "undefined" ? win.uiScale : 1)
                font.family: "Montserrat"
                anchors.horizontalCenter: parent.horizontalCenter

                function trLocal(key) {
                    if (typeof win !== "undefined" && win && typeof win.tr === "function")
                        return win.tr(key)
                    return "Connecting camera..."
                }
            }
        }
    }

    // ========== Error State ==========
    Item {
        id: errorOverlay
        anchors.fill: parent
        visible: root.hasError && !root.isPlaying

        Rectangle {
            anchors.fill: parent
            color: root.backgroundColor
            radius: root.radius
        }

        Column {
            anchors.centerIn: parent
            spacing: 8 * (typeof win !== "undefined" ? win.uiScale : 1)

            // Error icon
            Text {
                text: "\u26A0"  // Warning sign
                color: root.errorColor
                font.pixelSize: 32 * (typeof win !== "undefined" ? win.uiScale : 1)
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: root.streamUrl === "" ? trLocalNoUrl("camera_not_configured") : trLocalOffline("camera_offline")
                color: root.errorColor
                font.pixelSize: 14 * (typeof win !== "undefined" ? win.uiScale : 1)
                font.family: "Montserrat"
                anchors.horizontalCenter: parent.horizontalCenter

                function trLocalNoUrl(key) {
                    if (typeof win !== "undefined" && win && typeof win.tr === "function")
                        return win.tr(key)
                    return "Camera not configured"
                }

                function trLocalOffline(key) {
                    if (typeof win !== "undefined" && win && typeof win.tr === "function")
                        return win.tr(key)
                    return "Camera offline"
                }
            }

            // Retry button
            Rectangle {
                width: 100 * (typeof win !== "undefined" ? win.uiScale : 1)
                height: 32 * (typeof win !== "undefined" ? win.uiScale : 1)
                radius: 6 * (typeof win !== "undefined" ? win.uiScale : 1)
                color: retryMouse.containsMouse ? "#3a3a5e" : "#2a2a4e"
                anchors.horizontalCenter: parent.horizontalCenter
                visible: root.hasError

                Text {
                    anchors.centerIn: parent
                    text: trLocalRetry("common_retry")
                    color: root.textColor
                    font.pixelSize: 12 * (typeof win !== "undefined" ? win.uiScale : 1)
                    font.family: "Montserrat"

                    function trLocalRetry(key) {
                        if (typeof win !== "undefined" && win && typeof win.tr === "function")
                            return win.tr(key)
                        return "Retry"
                    }
                }

                MouseArea {
                    id: retryMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        mediaPlayer.stop()
                        mediaPlayer.source = ""
                        mediaPlayer.source = root.streamUrl
                        mediaPlayer.play()
                    }
                }
            }
        }
    }

    // ========== Camera Updating Overlay ==========
    Item {
        id: updatingOverlay
        anchors.fill: parent
        visible: root.isReconnecting
        z: 100  // On top of everything

        Rectangle {
            anchors.fill: parent
            color: "#CC1a1a2e"  // Semi-transparent dark background
            radius: root.radius
        }

        Column {
            anchors.centerIn: parent
            spacing: 16 * (typeof win !== "undefined" ? win.uiScale : 1)

            // Animated spinning arc
            Item {
                id: spinnerContainer
                width: 48 * (typeof win !== "undefined" ? win.uiScale : 1)
                height: width
                anchors.horizontalCenter: parent.horizontalCenter

                Canvas {
                    id: spinnerCanvas
                    anchors.fill: parent
                    property real angle: 0

                    onPaint: {
                        var ctx = getContext("2d")
                        ctx.reset()
                        var cx = width / 2
                        var cy = height / 2
                        var r = Math.min(cx, cy) - 4
                        var lineW = 3 * (typeof win !== "undefined" ? win.uiScale : 1)

                        // Background ring
                        ctx.beginPath()
                        ctx.arc(cx, cy, r, 0, 2 * Math.PI)
                        ctx.strokeStyle = "rgba(96, 219, 128, 0.2)"
                        ctx.lineWidth = lineW
                        ctx.stroke()

                        // Spinning arc (covers ~270°)
                        var startAngle = angle * Math.PI / 180 - Math.PI / 2
                        var endAngle = startAngle + 1.5 * Math.PI  // 270°
                        ctx.beginPath()
                        ctx.arc(cx, cy, r, startAngle, endAngle)
                        ctx.strokeStyle = "#60DB80"
                        ctx.lineWidth = lineW
                        ctx.lineCap = "round"
                        ctx.stroke()
                    }

                    Timer {
                        interval: 16  // ~60fps
                        running: updatingOverlay.visible
                        repeat: true
                        onTriggered: {
                            spinnerCanvas.angle = (spinnerCanvas.angle + 5) % 360
                            spinnerCanvas.requestPaint()
                        }
                    }
                }
            }

            Text {
                text: "Đang kết nối với camera..."
                color: "#ffffff"
                font.pixelSize: 16 * (typeof win !== "undefined" ? win.uiScale : 1)
                font.family: "Montserrat"
                font.bold: true
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }

    // ========== No Stream Placeholder ==========
    Item {
        id: noStreamOverlay
        anchors.fill: parent
        visible: root.streamUrl === "" && !root.isPlaying

        Rectangle {
            anchors.fill: parent
            color: root.backgroundColor
            radius: root.radius
        }

        Text {
            anchors.centerIn: parent
            text: "16:9"
            color: Qt.rgba(1, 1, 1, 0.2)
            font.pixelSize: 24 * (typeof win !== "undefined" ? win.uiScale : 1)
            font.family: "Montserrat"
            font.bold: true
        }
    }

    // ========== Public Functions ==========
    function play() {
        if (streamUrl !== "") {
            mediaPlayer.play()
        }
    }

    function stop() {
        mediaPlayer.stop()
    }

    function pause() {
        mediaPlayer.pause()
    }

    function reconnect() {
        root._reconnectAttempts = 0  // Reset attempts on manual reconnect
        root._stalledTicks = 0
        mediaPlayer.stop()
        mediaPlayer.source = ""
        mediaPlayer.source = streamUrl
        mediaPlayer.play()
    }

    Component.onDestruction: {
        reconnectTimer.stop()
        watchdogTimer.stop()
        mediaPlayer.stop()
        mediaPlayer.source = ""
    }
}

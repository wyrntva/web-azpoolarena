// qml/components/VideoZoomDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtMultimedia 6

import "../components"

/**
 * VideoZoomDialog - Live camera zoom dialog using shared MediaPlayer.
 *
 * Instead of creating its own MediaPlayer, this dialog borrows the
 * MediaPlayer from CameraVideo by swapping the videoOutput reference.
 * This eliminates duplicate HLS connections and provides instant open.
 */
DialogShell {
    id: root

    fixedW: Math.round(1200 * uiScale)
    maxHeightRatio: 0.92

    titleText: "Camera trực tiếp"
    confirmText: "Đóng"
    cancelText: ""

    // Reference to the CameraVideo component (set by parent page)
    property var cameraSource: null

    signal replayRequested()

    readonly property real uiScale: (typeof win !== "undefined" && win) ? win.uiScale : 1

    onConfirmed: {
        root.close()
    }

    onOpened: {
        // Steal the videoOutput from CameraVideo → show in dialog
        if (cameraSource && cameraSource.player) {
            cameraSource.player.videoOutput = dialogVideoOut
        }
    }

    onClosed: {
        // Return the videoOutput back to CameraVideo
        if (cameraSource && cameraSource.player && cameraSource.videoOut) {
            cameraSource.player.videoOutput = cameraSource.videoOut
        }
        videoStage.resetZoom()
    }

    body: ColumnLayout {
        width: parent.width
        spacing: Math.round(12 * root.uiScale)

        // ===== Video container =====
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.round(480 * root.uiScale)
            color: "black"
            radius: Math.round(12 * root.uiScale)
            border.color: "#2a2a2a"
            border.width: 1

            Item {
                id: videoStage
                anchors.fill: parent
                anchors.margins: 1
                clip: true

                // Use 16:9 aspect ratio (camera native)
                readonly property real _ar: 16 / 9
                readonly property real _fitW: Math.min(width, height * _ar)
                readonly property real _fitH: Math.min(height, width / _ar)

                // ===== Zoom & Pan =====
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
                    var maxPanX = (_fitW * (zoomScale - 1)) / 2
                    var maxPanY = (_fitH * (zoomScale - 1)) / 2
                    panX = Math.max(-maxPanX, Math.min(maxPanX, panX))
                    panY = Math.max(-maxPanY, Math.min(maxPanY, panY))
                }

                // ===== VideoOutput (receives video from shared player) =====
                VideoOutput {
                    id: dialogVideoOut
                    anchors.centerIn: parent
                    width: videoStage._fitW * videoStage.zoomScale
                    height: videoStage._fitH * videoStage.zoomScale
                    x: parent.width / 2 - width / 2 + videoStage.panX
                    y: parent.height / 2 - height / 2 + videoStage.panY
                    fillMode: VideoOutput.PreserveAspectFit
                }

                // ===== Pinch-to-zoom =====
                PinchArea {
                    anchors.fill: parent

                    property real startScale: 1.0
                    property real startPanX: 0
                    property real startPanY: 0

                    onPinchStarted: {
                        startScale = videoStage.zoomScale
                        startPanX = videoStage.panX
                        startPanY = videoStage.panY
                    }

                    onPinchUpdated: function(pinch) {
                        var newScale = startScale * pinch.scale
                        videoStage.zoomScale = Math.max(videoStage.minZoom, Math.min(videoStage.maxZoom, newScale))
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

                    // Drag-to-pan + double-tap reset
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

                // ===== Zoom indicator =====
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
            }
        }

        // ===== Status bar =====
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: Math.round(40 * root.uiScale)
            color: "#1a1a2e"
            radius: Math.round(8 * root.uiScale)

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: Math.round(16 * root.uiScale)
                anchors.rightMargin: Math.round(16 * root.uiScale)

                // Live indicator dot (pulsing green)
                Rectangle {
                    width: Math.round(10 * root.uiScale)
                    height: width
                    radius: width / 2
                    color: "#60DB80"

                    SequentialAnimation on opacity {
                        loops: Animation.Infinite
                        running: root.opened
                        NumberAnimation { from: 1.0; to: 0.3; duration: 800 }
                        NumberAnimation { from: 0.3; to: 1.0; duration: 800 }
                    }
                }

                AppText {
                    text: "● TRỰC TIẾP"
                    color: "#60DB80"
                    font.pixelSize: Math.round(14 * root.uiScale)
                    font.bold: true
                    renderType: Text.NativeRendering
                }

                Item { Layout.fillWidth: true }

                // Current time
                AppText {
                    id: clockText
                    color: "#aaaaaa"
                    font.pixelSize: Math.round(14 * root.uiScale)
                    renderType: Text.NativeRendering
                    text: formatClock()

                    function formatClock() {
                        var now = new Date()
                        var h = now.getHours()
                        var m = now.getMinutes()
                        var s = now.getSeconds()
                        return (h < 10 ? "0" : "") + h + ":" +
                               (m < 10 ? "0" : "") + m + ":" +
                               (s < 10 ? "0" : "") + s
                    }

                    Timer {
                        interval: 1000
                        repeat: true
                        running: root.opened
                        onTriggered: clockText.text = clockText.formatClock()
                    }
                }
            }
        }
    }

    // Replay button above the "Đóng" button — same style as confirm button
    footer: [
        Button {
            id: replayBtn
            anchors.right: parent ? parent.right : undefined
            width: contentRow.implicitWidth + Math.round(40 * root.uiScale)
            height: Math.round(root.buttonHeight * 0.6)

            background: Rectangle {
                color: replayBtn.down ? root.okDownColor
                     : replayBtn.hovered ? root.okHoverColor
                     : root.okNormalColor
                radius: Math.round(8 * root.uiScale)
            }

            contentItem: Item {
                Row {
                    id: contentRow
                    anchors.centerIn: parent
                    spacing: Math.round(8 * root.uiScale)

                    AppText {
                        text: "⏪"
                        color: root.okTextColor
                        font.pixelSize: Math.round(root.buttonFontSize * 0.6)
                        anchors.verticalCenter: parent.verticalCenter
                        // Emojis typically sit slightly higher than text, push it down 1px
                        anchors.verticalCenterOffset: Math.round(1 * root.uiScale)
                    }
                    AppText {
                        id: replayLabel
                        text: "Xem lại"
                        color: root.okTextColor
                        font.pixelSize: Math.round(root.buttonFontSize * 0.7)
                        font.bold: true
                        renderType: Text.NativeRendering
                        anchors.verticalCenter: parent.verticalCenter
                    }
                }
            }

            onClicked: {
                root.close()
                root.replayRequested()
            }
        }
    ]
}

import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6

Item {
    id: root

    // Range: 6 hours in seconds
    property int secondsInRange: 6 * 60 * 60
    // Current position in seconds (0 = oldest, secondsInRange = newest/now)
    property int seconds: secondsInRange

    // Start time for calculating actual timestamps
    property date rangeStartTime: new Date()

    property bool scrubbing: false

    // Scrub limits (for clip mode)
    property int minSec: 0                // Minimum seconds (cannot go before this)
    property int maxSec: secondsInRange   // Maximum seconds (cannot go past this)

    // Style
    property color topRulerColor: "#163243"
    property color barColor: "#1e88e5"
    property color tickColor: "#ffffff"
    property color labelColor: "#ffffff"
    property color caretColor: "#ff3b30"
    property color timeDisplayBg: "#cc000000"

    // Geometry
    property int rulerH: 44
    property int barH: 16
    property int barRadius: 6
    property int timeDisplayH: 28

    // Ticks - 15 minute intervals
    property int majorTickSec: 3600      // 1h - show label
    property int midTickSec: 1800        // 30m
    property int minorTickSec: 900       // 15m

    // Pixels per second - determines how "zoomed" the timeline is
    // Show ~1h in viewport (wider than before)
    readonly property real pixelsPerSecond: width / 3600

    // Total content width based on range
    readonly property real contentWidth: secondsInRange * pixelsPerSecond

    // Current scroll position (pixels from start)
    property real scrollX: seconds * pixelsPerSecond

    signal scrubStarted()
    signal scrubEnded(int seconds)
    signal secondsChangedByUser(int seconds)
    signal seekBackward(int deltaSec)
    signal seekForward(int deltaSec)
    signal speedChanged(real speed)

    // Playback speed
    property var speedOptions: [0.25, 0.5, 1.0, 1.5, 2.0, 4.0]
    property real currentSpeed: 1.0

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
    function pad2(n) { return (n < 10 ? "0" : "") + n }

    function formatTime(sec) {
        var ts = new Date(rangeStartTime.getTime() + sec * 1000)
        return pad2(ts.getHours()) + ":" + pad2(ts.getMinutes()) + ":" + pad2(ts.getSeconds())
    }

    function formatHourMin(sec) {
        var ts = new Date(rangeStartTime.getTime() + sec * 1000)
        return pad2(ts.getHours()) + ":" + pad2(ts.getMinutes())
    }

    // Sync scroll position from seconds (when not dragging)
    function syncScroll() {
        if (!scrubbing) {
            scrollX = seconds * pixelsPerSecond
        }
    }

    implicitHeight: rulerH + 18 + barH + 14 + timeDisplayH

    // Clipping viewport
    Item {
        id: viewport
        anchors.left: parent.left
        anchors.right: parent.right
        y: 0
        height: root.rulerH + 18 + root.barH
        clip: true

        // Scrollable content - positioned so that current position is at center
        Item {
            id: content
            width: root.contentWidth
            height: parent.height
            // Position content so scrollX appears at viewport center
            x: (viewport.width / 2) - root.scrollX

            // Ruler background
            Rectangle {
                width: parent.width
                height: root.rulerH
                color: root.topRulerColor
                opacity: 0.95
            }

            // Progress bar
            Rectangle {
                width: parent.width
                y: root.rulerH + 18
                height: root.barH
                radius: root.barRadius
                color: root.barColor
                opacity: 0.95
            }

            // Ticks and labels
            Repeater {
                model: Math.floor(root.secondsInRange / root.minorTickSec) + 1
                delegate: Item {
                    property int tickSec: index * root.minorTickSec
                    property bool isMajor: (tickSec % root.majorTickSec) === 0
                    property bool isMid: !isMajor && (tickSec % root.midTickSec) === 0

                    x: tickSec * root.pixelsPerSecond
                    width: 2
                    height: root.rulerH

                    Rectangle {
                        width: 2
                        height: isMajor ? 22 : (isMid ? 16 : 10)
                        y: root.rulerH - height
                        color: root.tickColor
                        opacity: isMajor ? 0.95 : (isMid ? 0.8 : 0.5)
                    }

                    Text {
                        visible: isMajor || isMid
                        text: root.formatHourMin(tickSec)
                        color: root.labelColor
                        font.pixelSize: isMajor ? 15 : 12
                        font.family: "Montserrat"
                        opacity: isMajor ? 1.0 : 0.7
                        y: 5
                        anchors.horizontalCenter: parent.horizontalCenter
                    }
                }
            }
        }

        // Drag handler
        MouseArea {
            anchors.fill: parent
            property real dragStartX: 0
            property real dragStartScrollX: 0

            onPressed: function(mouse) {
                root.scrubbing = true
                root.scrubStarted()
                dragStartX = mouse.x
                dragStartScrollX = root.scrollX
            }

            onPositionChanged: function(mouse) {
                if (!pressed) return
                var dx = mouse.x - dragStartX
                // Drag right = scroll left = go back in time
                var newScrollX = dragStartScrollX - dx

                // Clamp to min/max limits
                var minScrollX = root.minSec * root.pixelsPerSecond
                var maxScrollX = root.maxSec * root.pixelsPerSecond
                newScrollX = root.clamp(newScrollX, minScrollX, maxScrollX)
                root.scrollX = newScrollX

                // Update seconds
                var newSec = Math.round(newScrollX / root.pixelsPerSecond)
                newSec = root.clamp(newSec, root.minSec, root.maxSec)
                if (newSec !== root.seconds) {
                    root.seconds = newSec
                    root.secondsChangedByUser(newSec)
                }
            }

            onReleased: {
                var finalSec = Math.round(root.scrollX / root.pixelsPerSecond)
                finalSec = root.clamp(finalSec, root.minSec, root.maxSec)
                root.seconds = finalSec
                root.secondsChangedByUser(finalSec)
                root.scrubbing = false
                root.scrubEnded(finalSec)
            }
        }
    }

    // Fixed caret at center
    Rectangle {
        id: caret
        width: 4
        height: root.rulerH + 18 + root.barH + 10
        x: (root.width / 2) - (width / 2)
        y: 0
        color: root.caretColor
        radius: 2
        z: 10

        Rectangle {
            width: 12
            height: 12
            radius: 6
            color: root.caretColor
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
            anchors.bottomMargin: -2
        }
    }

    // Controls bar: speed buttons left, seek controls center
    Item {
        id: timeControlRow
        anchors.left: parent.left
        anchors.right: parent.right
        y: root.rulerH + 18 + root.barH + 14
        height: root.timeDisplayH
        z: 10

        // ===== Speed buttons (left-aligned) =====
        Row {
            id: speedRow
            anchors.left: parent.left
            anchors.leftMargin: 8
            anchors.verticalCenter: parent.verticalCenter
            spacing: 4

            Repeater {
                model: root.speedOptions
                delegate: Rectangle {
                    property real speed: modelData
                    property bool isSelected: Math.abs(root.currentSpeed - speed) < 0.001
                    width: 55
                    height: Math.round(root.timeDisplayH * 1.3)
                    color: isSelected ? "#2196F3" : (speedItemMouse.containsMouse ? "#44ffffff" : "#cc000000")
                    radius: 8
                    border.width: isSelected ? 0 : 1
                    border.color: "#44ffffff"

                    Text {
                        anchors.centerIn: parent
                        text: {
                            var s = modelData
                            if (s === Math.floor(s)) return s.toFixed(0) + "x"
                            return s.toFixed(1) + "x"
                        }
                        color: "white"
                        font.pixelSize: 17
                        font.family: "Montserrat"
                        font.bold: true
                    }

                    MouseArea {
                        id: speedItemMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            root.currentSpeed = speed
                            root.speedChanged(speed)
                        }
                    }
                }
            }
        }

        // ===== Seek controls (centered) =====
        Row {
            id: seekRow
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.verticalCenter: parent.verticalCenter
            spacing: 8

            // -10s button
            Rectangle {
                width: 47
                height: Math.round(root.timeDisplayH * 1.3)
                color: backwardMouse.containsMouse ? "#44ffffff" : "#cc000000"
                radius: 8

                Text {
                    anchors.centerIn: parent
                    text: "−10"
                    color: "white"
                    font.pixelSize: 17
                    font.family: "Montserrat"
                    font.bold: true
                }

                MouseArea {
                    id: backwardMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.seekBackward(10)
                }
            }

            // Time display
            Rectangle {
                id: timeDisplay
                width: 130
                height: Math.round(root.timeDisplayH * 1.3)
                color: root.timeDisplayBg
                radius: 8

                Text {
                    anchors.centerIn: parent
                    text: root.formatTime(root.seconds)
                    color: "white"
                    font.pixelSize: 21
                    font.family: "Montserrat"
                    font.bold: true
                }
            }

            // +10s button
            Rectangle {
                width: 47
                height: Math.round(root.timeDisplayH * 1.3)
                color: forwardMouse.containsMouse ? "#44ffffff" : "#cc000000"
                radius: 8

                Text {
                    anchors.centerIn: parent
                    text: "+10"
                    color: "white"
                    font.pixelSize: 17
                    font.family: "Montserrat"
                    font.bold: true
                }

                MouseArea {
                    id: forwardMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.seekForward(10)
                }
            }
        }
    }

    onSecondsChanged: syncScroll()
    onWidthChanged: syncScroll()
    Component.onCompleted: syncScroll()
}

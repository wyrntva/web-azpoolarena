import QtQuick
import QtQuick.Controls

Window {
    id: window
    // Full screen mode
    visibility: Window.FullScreen
    
    // Kiosk mode flags: No frame, stays on top
    flags: Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint

    // Prevent closing the window via standard means
    onClosing: (close) => {
        print("Closing disabled by policy")
        close.accepted = false
    }

    title: "Project Show Image"
    color: "black"

    property var images: imageProvider.banners
    
    // Automatically handle dynamic updates
    onImagesChanged: {
        console.log("Images list updated via API. Count:", images.length)
        if (currentIndex >= images.length) {
            currentIndex = 0
        }
        _initSync()
    }

    property int currentIndex: 0
    property int switchInterval: 15000 // 15 seconds (phải giống scoreboard)
    property int fadeDurationMs: 800   // Tăng lên 800ms cho mượt mà (premium effect)
    property int syncOffsetMs: 500     // Bù trừ 500ms độ rễ tính toán/xử lý của RPi so với Scoreboard

    property bool _flip: false

    Image {
        id: imgA
        anchors.fill: parent
        fillMode: Image.Stretch
        source: images.length > 0 ? images[0] : ""
        sourceSize.width: 1920
        sourceSize.height: 1080
        cache: true
        asynchronous: true
        smooth: true
        mipmap: true
        opacity: 1
        z: 1
        onStatusChanged: {
            if (status === Image.Error) {
                console.log("imgA ERROR loading:", source)
            } else if (status === Image.Ready) {
                console.log("imgA OK:", implicitWidth + "x" + implicitHeight)
            }
        }
    }

    Image {
        id: imgB
        anchors.fill: parent
        fillMode: Image.Stretch
        source: ""
        sourceSize.width: 1920
        sourceSize.height: 1080
        cache: true
        asynchronous: true
        smooth: true
        mipmap: true
        opacity: 0
        onStatusChanged: {
            if (status === Image.Error) {
                console.log("imgB ERROR loading:", source)
            } else if (status === Image.Ready) {
                console.log("imgB OK:", implicitWidth + "x" + implicitHeight)
            }
        }
    }

    NumberAnimation { id: fadeIn;  property: "opacity"; to: 1; duration: window.fadeDurationMs;  easing.type: Easing.OutCubic }
    NumberAnimation { id: fadeOut; property: "opacity"; to: 0; duration: window.fadeDurationMs;  easing.type: Easing.OutCubic }

    // ===== PRECISE TRANSITION TIMER =====
    Timer {
        id: transitionTimer
        interval: 1000
        running: false
        repeat: false
        onTriggered: {
            window._doTransition()
            window._scheduleNextTransition()
        }
    }

    // Timer hoãn preload để tránh giật lag lúc đang animation chuyển cảnh
    Timer {
        id: preloadTimer
        interval: 2000 // Chờ 2 giây sau khi khởi tạo transition mới preload ảnh tiếp theo
        running: false
        repeat: false
        onTriggered: {
            window._doPreloadNext()
        }
    }

    function _scheduleNextTransition() {
        if (images.length <= 1) return
        var now = Date.now() + window.syncOffsetMs
        var intervalMs = switchInterval
        var nextTransitionMs = (Math.floor(now / intervalMs) + 1) * intervalMs
        var delay = nextTransitionMs - now
        
        transitionTimer.interval = Math.max(10, delay)
        transitionTimer.start()

        // Khởi động timer hoãn preload ảnh tiếp theo
        preloadTimer.start()
    }

    function _doPreloadNext() {
        if (images.length <= 1) return
        var now = Date.now() + window.syncOffsetMs
        var intervalMs = switchInterval
        // Tính epoch của lần chuyển CẢNH TIẾP THEO so với now
        var nextTransitionMs = (Math.floor(now / intervalMs) + 1) * intervalMs
        var nextEpochSec = Math.floor(nextTransitionMs / 1000)
        var intervalSec = Math.max(1, Math.round(intervalMs / 1000))
        var nextIndex = Math.floor(nextEpochSec / intervalSec) % images.length

        // Ảnh bị ẩn hiện tại sẽ chứa ảnh tiếp theo
        var hiddenImg = _flip ? imgA : imgB
        if (hiddenImg.source !== images[nextIndex]) {
            hiddenImg.source = images[nextIndex]
        }
    }

    function _doTransition() {
        if (images.length <= 1) return
        var intervalSec = Math.max(1, Math.round(switchInterval / 1000))
        var epochSec = Math.floor((Date.now() + window.syncOffsetMs) / 1000)
        var newIndex = Math.floor(epochSec / intervalSec) % images.length

        if (newIndex !== currentIndex) {
            _crossFadeTo(newIndex)
        }
    }

    function _crossFadeTo(nextIndex) {
        if (images.length === 0) return
        var nextSource = images[nextIndex]

        var incoming = _flip ? imgA : imgB
        var outgoing = _flip ? imgB : imgA

        if (incoming.source !== nextSource) {
            incoming.source = nextSource
        }

        incoming.opacity = 0
        
        fadeIn.target = incoming
        fadeOut.target = outgoing
        
        fadeIn.start()
        fadeOut.start()

        currentIndex = nextIndex
        _flip = !_flip
    }

    function _initSync() {
        _flip = false // reset flip để luôn bắt đầu từ imgA
        if (images.length <= 1) {
            currentIndex = 0
            imgA.source = images.length > 0 ? images[0] : ""
            imgA.opacity = 1
            imgB.opacity = 0
            imgA.z = 1
            imgB.z = 0
            return
        }
        var intervalSec = Math.max(1, Math.round(switchInterval / 1000))
        // Dùng syncOffsetMs để đảm bảo tính thời gian tương đồng scoreboard
        var epochSec = Math.floor((Date.now() + window.syncOffsetMs) / 1000)
        var idx = Math.floor(epochSec / intervalSec) % images.length

        // Set trực tiếp không animation lần đầu
        currentIndex = idx
        imgA.source = images[idx]
        imgA.opacity = 1
        imgB.opacity = 0

        // Bắt đầu schedule transition tiếp theo
        _scheduleNextTransition()
    }

    Component.onCompleted: _initSync()
    
    // Loading indicator (optional, mostly for first load)
    BusyIndicator {
        anchors.centerIn: parent
        running: imgA.status === Image.Loading || imgB.status === Image.Loading
        visible: running
    }
    
    // Error handling
    Text {
        anchors.centerIn: parent
        text: "Could not load image"
        color: "red"
        font.pixelSize: 24
        visible: imgA.status === Image.Error && imgB.status === Image.Error
    }
}


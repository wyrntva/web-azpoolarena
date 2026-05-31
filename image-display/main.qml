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

    // Load Montserrat Font files dynamically
    FontLoader { id: fontMontserratBold; source: "fonts/Montserrat-Bold.otf" }
    FontLoader { id: fontMontserratItalic; source: "fonts/Montserrat-Italic.otf" }
    FontLoader { id: fontMontserratRegular; source: "fonts/Montserrat-Regular.otf" }

    readonly property string baseFontFamily: fontMontserratRegular.status === FontLoader.Ready
                                             ? fontMontserratRegular.name 
                                             : "Montserrat"

    property var images: imageProvider.banners
    
    // Automatically handle dynamic updates
    onImagesChanged: {
        console.log("Images list updated via API. Count:", images.length)
        if (currentIndex >= images.length) {
            currentIndex = 0
        }
        if (!imageProvider.hasActiveMatches) {
            _initSync()
        }
    }

    // Lắng nghe sự kiện thay đổi trạng thái trận đấu hoạt động
    Connections {
        target: imageProvider
        function onActiveMatchesChanged() {
            if (imageProvider.hasActiveMatches) {
                console.log("Đang có giải đấu diễn ra! Tạm dừng slideshow, hiển thị trang Live...")
                transitionTimer.stop()
                preloadTimer.stop()
            } else {
                console.log("Không có giải đấu/trận đấu hoạt động. Kích hoạt lại slideshow banner...")
                _initSync()
            }
        }
    }

    property int currentIndex: 0
    property int switchInterval: 15000 // 15 seconds (phải giống scoreboard)
    property int fadeDurationMs: 800   // Tăng lên 800ms cho mượt mà (premium effect)
    property int syncOffsetMs: 500     // Bù trừ 500ms độ rễ tính toán/xử lý của RPi so với Scoreboard

    property bool _flip: false

    // ==========================================
    // 1. SLIDESHOW CONTAINER (Banners)
    // ==========================================
    Item {
        id: slideshowContainer
        anchors.fill: parent
        visible: !imageProvider.hasActiveMatches
        opacity: visible ? 1 : 0
        Behavior on opacity { NumberAnimation { duration: 500 } }

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

    // ==========================================
    // 2. LIVE MATCHES CONTAINER (Giải đấu trực tiếp)
    // ==========================================
    Rectangle {
        id: liveMatchesContainer
        anchors.fill: parent
        color: "#F4F7FE" // Màu nền sáng của trang live
        border.width: 0  // Đảm bảo không có viền đỏ
        visible: imageProvider.hasActiveMatches
        opacity: visible ? 1 : 0
        Behavior on opacity { NumberAnimation { duration: 500 } }

        // --- Header thanh đầu trang (Đẩy dịch xuống 100px, bỏ viền đỏ ở đỉnh) ---
        Rectangle {
            id: header
            y: 100 // Đẩy dịch xuống 100px
            height: 90
            width: parent.width
            color: "transparent"

            Text {
                text: "LỊCH THI ĐẤU TRỰC TIẾP"
                anchors.centerIn: parent
                font.family: baseFontFamily
                font.bold: true
                font.pixelSize: 28
                color: "#172339"
                font.letterSpacing: 2
            }

            // Đồng hồ thời gian thực
            Text {
                id: timeClock
                anchors.right: parent.right
                anchors.rightMargin: 40
                anchors.verticalCenter: parent.verticalCenter
                font.family: baseFontFamily
                font.bold: true
                font.pixelSize: 18
                color: "#37393E"

                Component.onCompleted: {
                    var d = new Date()
                    text = d.toLocaleTimeString(Qt.locale("vi_VN"), "HH:mm:ss")
                }

                Timer {
                    interval: 1000
                    running: parent.visible
                    repeat: true
                    onTriggered: {
                        var d = new Date()
                        timeClock.text = d.toLocaleTimeString(Qt.locale("vi_VN"), "HH:mm:ss")
                    }
                }
            }
        }

        // --- Lưới hiển thị các thẻ trận đấu (giới hạn tối đa 1360px và căn giữa) ---
        Item {
            id: liveContentArea
            anchors.top: header.bottom
            anchors.bottom: parent.bottom
            width: Math.min(parent.width - 80, 1360)
            anchors.horizontalCenter: parent.horizontalCenter

            GridView {
                id: matchesGrid
                anchors.fill: parent
                anchors.topMargin: 20
                anchors.bottomMargin: 30
                clip: true
                
                cellWidth: width / 4
                cellHeight: 125

                model: imageProvider.activeMatches
                delegate: Item {
                    width: matchesGrid.cellWidth - 24
                    height: 120

                    // Vòng đấu & thời gian / chạm handicap
                    Item {
                        width: parent.width
                        height: 24

                        Text {
                            text: modelData.matchNo ? "Trận " + modelData.matchNo : ""
                            anchors.left: parent.left
                            anchors.leftMargin: 4
                            font.family: baseFontFamily
                            font.bold: false
                            font.pixelSize: 12
                            color: "#37393E"
                        }

                        Text {
                            // Ghép thời gian, ngày và chạm chấp
                            text: {
                                var parts = []
                                if (modelData.time && modelData.date) {
                                    parts.push(modelData.time + ", " + modelData.date)
                                }
                                if (modelData.raceText) {
                                    parts.push(modelData.raceText)
                                }
                                return parts.join(" / ")
                            }
                            anchors.right: parent.right
                            anchors.rightMargin: 4
                            font.family: baseFontFamily
                            font.bold: false
                            font.pixelSize: 12
                            color: "#37393E"
                            horizontalAlignment: Text.AlignRight
                        }
                    }

                    // Card Container (Transparent)
                    Item {
                        width: parent.width
                        height: 80
                        y: 28

                        // Cột số bàn bên trái (Pill dọc - Bo góc trái tuyệt đối)
                        Rectangle {
                            id: tablePill
                            width: 72
                            height: 80
                            color: {
                                if (modelData.tableNumberColor === "green") return "#60DB80"
                                if (modelData.tableNumberColor === "yellow") return "#E5BD4F"
                                return "#464C58"
                            }
                            radius: 12

                            // Che góc bo tròn bên phải để Pill phẳng seamless
                            Rectangle {
                                width: 12
                                height: 80
                                x: 60
                                color: parent.color
                            }

                            Text {
                                text: {
                                    var t = modelData.tableNumber || "-"
                                    if (t === "-") return "-"
                                    var clean = t.trim()
                                    if (/^\d+$/.test(clean)) {
                                        return "BÀN " + clean
                                    }
                                    return clean
                                }
                                anchors.centerIn: parent
                                width: parent.width - 8
                                wrapMode: Text.NoWrap
                                font.family: baseFontFamily
                                font.bold: true
                                font.italic: true
                                font.pixelSize: {
                                    var cleanText = text || ""
                                    return cleanText.length > 8 ? 10.5 : (cleanText.length > 6 ? 11.5 : 13)
                                }
                                color: "white"
                                font.capitalization: Font.AllUppercase
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }

                        // Phần thông tin người chơi bên phải (Nền tối #172339, Bo góc phải tuyệt đối)
                        Rectangle {
                            id: playerInfoCard
                            anchors.left: tablePill.right
                            anchors.right: parent.right
                            height: 80
                            color: "#172339"
                            radius: 12

                            // Che góc bo tròn bên trái để phẳng seamless với tablePill
                            Rectangle {
                                width: 12
                                height: 80
                                x: 0
                                color: parent.color
                            }

                            // --- Player 1 Row ---
                            Item {
                                width: parent.width
                                height: 40
                                y: 0

                                // Avatar hình tròn dùng Rectangle clip
                                Rectangle {
                                    id: p1AvatarBg
                                    width: 26
                                    height: 26
                                    radius: 13
                                    clip: true
                                    anchors.left: parent.left
                                    anchors.leftMargin: 8
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: !modelData.player1IsBye
                                    color: "transparent"

                                    Image {
                                        id: p1AvatarImg
                                        anchors.fill: parent
                                        source: modelData.player1Avatar || (imageProvider.apiBaseUrl + "/images/generic-profile_mini_dcryfs.webp")
                                        fillMode: Image.PreserveAspectCrop
                                        smooth: true
                                        antialiasing: true
                                    }
                                }

                                // Tên & Rank
                                Text {
                                    text: modelData.player1Name + (modelData.player1Rank && !modelData.player1IsBye ? " - " + modelData.player1Rank : "")
                                    anchors.left: p1AvatarBg.visible ? p1AvatarBg.right : parent.left
                                    anchors.leftMargin: 8
                                    anchors.right: p1ScoreText.left
                                    anchors.rightMargin: 8
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: modelData.hasActiveResult ? modelData.player1IsWinner : false
                                    font.italic: modelData.player1IsBye
                                    font.pixelSize: 14
                                    color: {
                                        if (modelData.hasActiveResult) {
                                            if (!modelData.player1IsWinner && modelData.player2IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    elide: Text.ElideRight
                                }

                                // Tỉ số với hiệu ứng đổi số cực nhạy (Score Flash)
                                Text {
                                    id: p1ScoreText
                                    text: modelData.player1Score
                                    anchors.right: parent.right
                                    anchors.rightMargin: 12
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: true
                                    font.italic: true
                                    font.pixelSize: 18
                                    color: {
                                        if (modelData.hasActiveResult) {
                                            if (modelData.player1IsWinner) return "#ED1C1F"
                                            if (modelData.player2IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    horizontalAlignment: Text.AlignRight
                                    transformOrigin: Item.Center

                                    onTextChanged: {
                                        scoreFlashP1.start()
                                    }

                                    SequentialAnimation {
                                        id: scoreFlashP1
                                        NumberAnimation { target: p1ScoreText; property: "scale"; to: 1.35; duration: 200; easing.type: Easing.OutQuad }
                                        NumberAnimation { target: p1ScoreText; property: "scale"; to: 1.0; duration: 250; easing.type: Easing.OutQuad }
                                    }
                                }
                            }

                            // --- Player 2 Row ---
                            Item {
                                width: parent.width
                                height: 40
                                y: 40

                                // Avatar hình tròn dùng Rectangle clip
                                Rectangle {
                                    id: p2AvatarBg
                                    width: 26
                                    height: 26
                                    radius: 13
                                    clip: true
                                    anchors.left: parent.left
                                    anchors.leftMargin: 8
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: !modelData.player2IsBye
                                    color: "transparent"

                                    Image {
                                        id: p2AvatarImg
                                        anchors.fill: parent
                                        source: modelData.player2Avatar || (imageProvider.apiBaseUrl + "/images/generic-profile_mini_dcryfs.webp")
                                        fillMode: Image.PreserveAspectCrop
                                        smooth: true
                                        antialiasing: true
                                    }
                                }

                                // Tên & Rank
                                Text {
                                    text: modelData.player2Name + (modelData.player2Rank && !modelData.player2IsBye ? " - " + modelData.player2Rank : "")
                                    anchors.left: p2AvatarBg.visible ? p2AvatarBg.right : parent.left
                                    anchors.leftMargin: 8
                                    anchors.right: p2ScoreText.left
                                    anchors.rightMargin: 8
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: modelData.hasActiveResult ? modelData.player2IsWinner : false
                                    font.italic: modelData.player2IsBye
                                    font.pixelSize: 14
                                    color: {
                                        if (modelData.hasActiveResult) {
                                            if (!modelData.player2IsWinner && modelData.player1IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    elide: Text.ElideRight
                                }

                                // Tỉ số với hiệu ứng đổi số cực nhạy (Score Flash)
                                Text {
                                    id: p2ScoreText
                                    text: modelData.player2Score
                                    anchors.right: parent.right
                                    anchors.rightMargin: 12
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: true
                                    font.italic: true
                                    font.pixelSize: 18
                                    color: {
                                        if (modelData.hasActiveResult) {
                                            if (modelData.player2IsWinner) return "#ED1C1F"
                                            if (modelData.player1IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    horizontalAlignment: Text.AlignRight
                                    transformOrigin: Item.Center

                                    onTextChanged: {
                                        scoreFlashP2.start()
                                    }

                                    SequentialAnimation {
                                        id: scoreFlashP2
                                        NumberAnimation { target: p2ScoreText; property: "scale"; to: 1.35; duration: 200; easing.type: Easing.OutQuad }
                                        NumberAnimation { target: p2ScoreText; property: "scale"; to: 1.0; duration: 250; easing.type: Easing.OutQuad }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ==========================================
    // 3. TRANSITIONS & TIMERS
    // ==========================================
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
        if (imageProvider.hasActiveMatches) return // Pause slideshow if live matches are shown!
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

    Component.onCompleted: {
        if (!imageProvider.hasActiveMatches) {
            _initSync()
        }
    }
}

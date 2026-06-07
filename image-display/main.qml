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

    readonly property string apiBaseUrl: imageProvider.apiBaseUrl

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

    // Model để giữ kết nối và hiển thị ổn định (không destroy/recreate delegates)
    ListModel {
        id: matchesModel
    }

    function syncMatchesModel() {
        var newMatches = imageProvider.activeMatches
        if (!newMatches) {
            matchesModel.clear()
            return
        }

        // 1. Remove matches that are no longer active
        var newMatchesMap = {}
        for (var i = 0; i < newMatches.length; i++) {
            newMatchesMap[newMatches[i].id] = true
        }
        for (var j = matchesModel.count - 1; j >= 0; j--) {
            var existingId = matchesModel.get(j).id
            if (!newMatchesMap[existingId]) {
                matchesModel.remove(j)
            }
        }

        // 2. Add new matches or update existing ones in-place
        for (var k = 0; k < newMatches.length; k++) {
            var newM = newMatches[k]
            var foundIdx = -1
            for (var l = 0; l < matchesModel.count; l++) {
                if (matchesModel.get(l).id === newM.id) {
                    foundIdx = l
                    break
                }
            }

            if (foundIdx !== -1) {
                // Update properties
                var item = matchesModel.get(foundIdx)
                if (item.player1Score !== newM.player1Score) matchesModel.setProperty(foundIdx, "player1Score", newM.player1Score)
                if (item.player2Score !== newM.player2Score) matchesModel.setProperty(foundIdx, "player2Score", newM.player2Score)
                if (item.player1Name !== newM.player1Name) matchesModel.setProperty(foundIdx, "player1Name", newM.player1Name)
                if (item.player2Name !== newM.player2Name) matchesModel.setProperty(foundIdx, "player2Name", newM.player2Name)
                if (item.player1Avatar !== newM.player1Avatar) matchesModel.setProperty(foundIdx, "player1Avatar", newM.player1Avatar)
                if (item.player2Avatar !== newM.player2Avatar) matchesModel.setProperty(foundIdx, "player2Avatar", newM.player2Avatar)
                if (item.player1Rank !== newM.player1Rank) matchesModel.setProperty(foundIdx, "player1Rank", newM.player1Rank)
                if (item.player2Rank !== newM.player2Rank) matchesModel.setProperty(foundIdx, "player2Rank", newM.player2Rank)
                if (item.player1IsWinner !== newM.player1IsWinner) matchesModel.setProperty(foundIdx, "player1IsWinner", newM.player1IsWinner)
                if (item.player2IsWinner !== newM.player2IsWinner) matchesModel.setProperty(foundIdx, "player2IsWinner", newM.player2IsWinner)
                if (item.hasActiveResult !== newM.hasActiveResult) matchesModel.setProperty(foundIdx, "hasActiveResult", newM.hasActiveResult)
                if (item.tableNumber !== newM.tableNumber) matchesModel.setProperty(foundIdx, "tableNumber", newM.tableNumber)
                if (item.tableNumberColor !== newM.tableNumberColor) matchesModel.setProperty(foundIdx, "tableNumberColor", newM.tableNumberColor)
                if (item.raceText !== newM.raceText) matchesModel.setProperty(foundIdx, "raceText", newM.raceText)
                if (item.time !== newM.time) matchesModel.setProperty(foundIdx, "time", newM.time)
                if (item.date !== newM.date) matchesModel.setProperty(foundIdx, "date", newM.date)
                if (item.matchNo !== newM.matchNo) matchesModel.setProperty(foundIdx, "matchNo", newM.matchNo)
                if (item.player1IsBye !== newM.player1IsBye) matchesModel.setProperty(foundIdx, "player1IsBye", newM.player1IsBye)
                if (item.player2IsBye !== newM.player2IsBye) matchesModel.setProperty(foundIdx, "player2IsBye", newM.player2IsBye)
            } else {
                // Append new item
                matchesModel.append(newM)
            }
        }

        // 3. Re-order items in matchesModel to match the newMatches array order
        for (var mIdx = 0; mIdx < newMatches.length; mIdx++) {
            var targetId = newMatches[mIdx].id
            if (matchesModel.get(mIdx).id !== targetId) {
                // Find where targetId is in matchesModel
                for (var searchIdx = mIdx + 1; searchIdx < matchesModel.count; searchIdx++) {
                    if (matchesModel.get(searchIdx).id === targetId) {
                        matchesModel.move(searchIdx, mIdx, 1)
                        break
                    }
                }
            }
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
            window.syncMatchesModel()
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

        // --- Header thanh đầu trang (Đẩy dịch lên trên sát đỉnh, cỡ chữ cực lớn) ---
        Rectangle {
            id: header
            y: 20 // Đẩy dịch lên trên sát đỉnh hơn nữa (trước là 35)
            height: 100
            width: parent.width
            color: "transparent"

            Text {
                text: "LỊCH THI ĐẤU TRỰC TIẾP"
                anchors.centerIn: parent
                font.family: baseFontFamily
                font.bold: true
                font.pixelSize: 52 // Tăng kích thước chữ tiêu đề cực lớn (trước là 42)
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
                font.pixelSize: 28 // Tăng kích thước chữ đồng hồ (trước là 24)
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

        // --- Lưới hiển thị các thẻ trận đấu (Căn chỉnh khoảng cách vừa khít 12 card 3x4) ---
        Item {
            id: liveContentArea
            anchors.top: header.bottom
            anchors.topMargin: 0 // Loại bỏ margin để đẩy cao hơn nữa
            anchors.bottom: parent.bottom
            width: Math.min(parent.width - 80, 1720)
            anchors.horizontalCenter: parent.horizontalCenter

            GridView {
                id: matchesGrid
                anchors.fill: parent
                anchors.topMargin: 10
                anchors.bottomMargin: 10
                clip: true
                
                cellWidth: width / 4 // 4 cột
                cellHeight: 165     // Chiều cao ô 165px để thon gọn và vừa khít 16 card trên màn hình 1080p

                model: matchesModel
                delegate: Item {
                    width: matchesGrid.cellWidth - 24 
                    height: 155                      

                    property int matchId: model.id
                    property var currentP1Score: model.player1Score
                    property var currentP2Score: model.player2Score

                    property var lastP1Score: undefined
                    property var lastP2Score: undefined

                    onMatchIdChanged: {
                        lastP1Score = currentP1Score
                        lastP2Score = currentP2Score
                    }

                    onCurrentP1ScoreChanged: {
                        if (lastP1Score !== undefined && lastP1Score !== currentP1Score) {
                            scoreFlashP1.start()
                        }
                        lastP1Score = currentP1Score
                    }

                    onCurrentP2ScoreChanged: {
                        if (lastP2Score !== undefined && lastP2Score !== currentP2Score) {
                            scoreFlashP2.start()
                        }
                        lastP2Score = currentP2Score
                    }

                    // Vòng đấu & thời gian / chạm handicap (Cỡ chữ chuẩn 16px)
                    Item {
                        width: parent.width
                        height: 32

                        Text {
                            text: model.matchNo ? "Trận " + model.matchNo : ""
                            anchors.left: parent.left
                            anchors.leftMargin: 4
                            anchors.verticalCenter: parent.verticalCenter
                            font.family: baseFontFamily
                            font.bold: false
                            font.pixelSize: 16
                            color: "#37393E"
                        }

                        Text {
                            // Ghép thời gian, ngày và chạm chấp
                            text: {
                                var parts = []
                                if (model.time && model.date) {
                                    parts.push(model.time + ", " + model.date)
                                }
                                if (model.raceText) {
                                    parts.push(model.raceText)
                                }
                                return parts.join(" / ")
                            }
                            anchors.right: parent.right
                            anchors.rightMargin: 4
                            anchors.verticalCenter: parent.verticalCenter
                            font.family: baseFontFamily
                            font.bold: false
                            font.pixelSize: 16
                            color: "#37393E"
                            horizontalAlignment: Text.AlignRight
                        }
                    }

                    // Card Container (Transparent)
                    Item {
                        width: parent.width
                        height: 120
                        y: 32

                        // Cột số bàn bên trái (Pill dọc - Bo góc trái tuyệt đối)
                        Rectangle {
                            id: tablePill
                            width: 96
                            height: 120
                            color: {
                                if (model.tableNumberColor === "green") return "#60DB80"
                                if (model.tableNumberColor === "yellow") return "#E5BD4F"
                                return "#464C58"
                            }
                            radius: 16

                            // Che góc bo tròn bên phải để Pill phẳng seamless
                            Rectangle {
                                width: 16
                                height: 120
                                x: 80      // 96 - 16
                                color: parent.color
                            }

                            Text {
                                text: {
                                    var t = model.tableNumber || "-"
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
                                    return cleanText.length > 8 ? 13 : (cleanText.length > 6 ? 15 : 17)
                                }
                                color: model.tableNumberColor === "default" || !model.tableNumberColor ? "#7C8FB5" : "#FFFFFF"
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
                            height: 120
                            color: "#172339"
                            radius: 16

                            // Che góc bo tròn bên trái để phẳng seamless với tablePill
                            Rectangle {
                                width: 16
                                height: 120
                                x: 0
                                color: parent.color
                            }

                            // --- Player 1 Row ---
                            Item {
                                width: parent.width
                                height: 60
                                y: 0

                                // Avatar hình tròn dùng Rectangle clip
                                Rectangle {
                                    id: p1AvatarBg
                                    width: 38
                                    height: 38
                                    radius: 19
                                    clip: true
                                    anchors.left: parent.left
                                    anchors.leftMargin: 12
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: !model.player1IsBye
                                    color: "transparent"

                                    Image {
                                        id: p1AvatarImg
                                        anchors.fill: parent
                                        source: model.player1Avatar || (apiBaseUrl + "/images/generic-profile.png")
                                        sourceSize.width: 76
                                        sourceSize.height: 76
                                        cache: true
                                        asynchronous: true
                                        fillMode: Image.PreserveAspectCrop
                                        smooth: true
                                        antialiasing: true
                                    }
                                }

                                // Tên & Rank
                                Text {
                                    text: model.player1Name + (model.player1Rank && !model.player1IsBye ? " - " + model.player1Rank : "")
                                    anchors.left: p1AvatarBg.visible ? p1AvatarBg.right : parent.left
                                    anchors.leftMargin: 10
                                    anchors.right: p1ScoreText.left
                                    anchors.rightMargin: 10
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: model.hasActiveResult ? model.player1IsWinner : false
                                    font.italic: model.player1IsBye
                                    font.pixelSize: {
                                        var len = text.length;
                                        if (len > 24) return 14;
                                        if (len > 20) return 16;
                                        if (len > 16) return 18;
                                        return 20;
                                    }
                                    color: {
                                        if (model.hasActiveResult) {
                                            if (!model.player1IsWinner && model.player2IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    elide: Text.ElideRight
                                }

                                // Tỉ số với hiệu ứng đổi số cực nhạy (Score Flash)
                                Text {
                                    id: p1ScoreText
                                    text: model.player1Score
                                    anchors.right: parent.right
                                    anchors.rightMargin: 16
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: true
                                    font.italic: true
                                    font.pixelSize: 28
                                    property color baseColor: {
                                        if (model.hasActiveResult) {
                                            if (model.player1IsWinner) return "#ED1C1F"
                                            if (model.player2IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    color: baseColor
                                    horizontalAlignment: Text.AlignRight
                                    transformOrigin: Item.Center

                                    SequentialAnimation {
                                        id: scoreFlashP1
                                        ParallelAnimation {
                                            NumberAnimation { target: p1ScoreText; property: "scale"; to: 0.9; duration: 150; easing.type: Easing.OutQuad }
                                            NumberAnimation { target: p1ScoreText; property: "opacity"; to: 0.2; duration: 150; easing.type: Easing.OutQuad }
                                            ColorAnimation { target: p1ScoreText; property: "color"; to: "#ED1C1F"; duration: 150 }
                                        }
                                        ParallelAnimation {
                                            NumberAnimation { target: p1ScoreText; property: "scale"; to: 1.35; duration: 150; easing.type: Easing.OutBack }
                                            NumberAnimation { target: p1ScoreText; property: "opacity"; to: 1.0; duration: 150; easing.type: Easing.OutQuad }
                                        }
                                        ParallelAnimation {
                                            NumberAnimation { target: p1ScoreText; property: "scale"; to: 0.95; duration: 150; easing.type: Easing.InOutQuad }
                                        }
                                        ParallelAnimation {
                                            NumberAnimation { target: p1ScoreText; property: "scale"; to: 1.0; duration: 150; easing.type: Easing.OutQuad }
                                            ColorAnimation { target: p1ScoreText; property: "color"; to: p1ScoreText.baseColor; duration: 150 }
                                        }
                                        onFinished: {
                                            p1ScoreText.color = Qt.binding(function() { return p1ScoreText.baseColor })
                                            p1ScoreText.opacity = 1.0
                                            p1ScoreText.scale = 1.0
                                        }
                                    }
                                }
                            }

                            // --- Player 2 Row ---
                            Item {
                                width: parent.width
                                height: 60
                                y: 60

                                // Avatar hình tròn dùng Rectangle clip
                                Rectangle {
                                    id: p2AvatarBg
                                    width: 38
                                    height: 38
                                    radius: 19
                                    clip: true
                                    anchors.left: parent.left
                                    anchors.leftMargin: 12
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: !model.player2IsBye
                                    color: "transparent"

                                    Image {
                                        id: p2AvatarImg
                                        anchors.fill: parent
                                        source: model.player2Avatar || (apiBaseUrl + "/images/generic-profile.png")
                                        sourceSize.width: 76
                                        sourceSize.height: 76
                                        cache: true
                                        asynchronous: true
                                        fillMode: Image.PreserveAspectCrop
                                        smooth: true
                                        antialiasing: true
                                    }
                                }

                                // Tên & Rank
                                Text {
                                    text: model.player2Name + (model.player2Rank && !model.player2IsBye ? " - " + model.player2Rank : "")
                                    anchors.left: p2AvatarBg.visible ? p2AvatarBg.right : parent.left
                                    anchors.leftMargin: 10
                                    anchors.right: p2ScoreText.left
                                    anchors.rightMargin: 10
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: model.hasActiveResult ? model.player2IsWinner : false
                                    font.italic: model.player2IsBye
                                    font.pixelSize: {
                                        var len = text.length;
                                        if (len > 24) return 14;
                                        if (len > 20) return 16;
                                        if (len > 16) return 18;
                                        return 20;
                                    }
                                    color: {
                                        if (model.hasActiveResult) {
                                            if (!model.player2IsWinner && model.player1IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    elide: Text.ElideRight
                                }

                                // Tỉ số với hiệu ứng đổi số cực nhạy (Score Flash)
                                Text {
                                    id: p2ScoreText
                                    text: model.player2Score
                                    anchors.right: parent.right
                                    anchors.rightMargin: 16
                                    anchors.verticalCenter: parent.verticalCenter
                                    font.family: baseFontFamily
                                    font.bold: true
                                    font.italic: true
                                    font.pixelSize: 28
                                    property color baseColor: {
                                        if (model.hasActiveResult) {
                                            if (model.player2IsWinner) return "#ED1C1F"
                                            if (model.player1IsWinner) return "#ACB3C3"
                                        }
                                        return "#FFFFFF"
                                    }
                                    color: baseColor
                                    horizontalAlignment: Text.AlignRight
                                    transformOrigin: Item.Center

                                    SequentialAnimation {
                                        id: scoreFlashP2
                                        ParallelAnimation {
                                            NumberAnimation { target: p2ScoreText; property: "scale"; to: 0.9; duration: 150; easing.type: Easing.OutQuad }
                                            NumberAnimation { target: p2ScoreText; property: "opacity"; to: 0.2; duration: 150; easing.type: Easing.OutQuad }
                                            ColorAnimation { target: p2ScoreText; property: "color"; to: "#ED1C1F"; duration: 150 }
                                        }
                                        ParallelAnimation {
                                            NumberAnimation { target: p2ScoreText; property: "scale"; to: 1.35; duration: 150; easing.type: Easing.OutBack }
                                            NumberAnimation { target: p2ScoreText; property: "opacity"; to: 1.0; duration: 150; easing.type: Easing.OutQuad }
                                        }
                                        ParallelAnimation {
                                            NumberAnimation { target: p2ScoreText; property: "scale"; to: 0.95; duration: 150; easing.type: Easing.InOutQuad }
                                        }
                                        ParallelAnimation {
                                            NumberAnimation { target: p2ScoreText; property: "scale"; to: 1.0; duration: 150; easing.type: Easing.OutQuad }
                                            ColorAnimation { target: p2ScoreText; property: "color"; to: p2ScoreText.baseColor; duration: 150 }
                                        }
                                        onFinished: {
                                            p2ScoreText.color = Qt.binding(function() { return p2ScoreText.baseColor })
                                            p2ScoreText.opacity = 1.0
                                            p2ScoreText.scale = 1.0
                                        }
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
        syncMatchesModel()
        if (!imageProvider.hasActiveMatches) {
            _initSync()
        }
    }
}

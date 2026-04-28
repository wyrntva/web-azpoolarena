// qml/pages/SplashPage.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6

Item {
    id: splash
    property string routeName: "splash"
    property real uiScale: (typeof win !== "undefined" && win) ? win.uiScale : 1

    // ===== Cấu hình thời gian =====
    property int slideIntervalMs: 15000
    property int fadeDurationMs:  500

    // Fallback banner (dùng khi chưa có dữ liệu từ backend)
    readonly property var fallbackBanners: [
        "../../assets/SplashPage1.png",
        "../../assets/SplashPage2.png",
        "../../assets/SplashPage3.png"
    ]

    // Banner list — sẽ được cập nhật từ backend, fallback nếu chưa có
    property var banners: fallbackBanners

    // Chỉ số hiện tại (đồng bộ theo đồng hồ hệ thống)
    property int currentIndex: 0

    // ===== Kết nối BannerService để lấy banner từ backend =====
    Connections {
        target: (typeof BannerService !== "undefined" && BannerService) ? BannerService : null
        function onBannersLoaded(bannerType, urls) {
            if (bannerType === "scoreboard" && urls && urls.length > 0) {
                console.log("[SplashPage] Loaded", urls.length, "banner(s) from API")
                splash.banners = urls
                splash._initSync()
            }
        }
    }

    // Khi SplashPage được tạo, kiểm tra cache banner trước,
    // nếu chưa có thì fetch mới
    Component.onCompleted: {
        // Kiểm tra cached banners trước
        if (typeof BannerService !== "undefined" && BannerService) {
            var cached = BannerService.get_cached_banners("scoreboard")
            if (cached && cached.length > 0) {
                console.log("[SplashPage] Using cached banners:", cached.length)
                splash.banners = cached
            } else {
                // Trigger fetch nếu chưa có cache
                console.log("[SplashPage] No cached banners, fetching...")
                BannerService.fetch_banners("scoreboard")
            }
        }

        _initSync()
    }

    Rectangle { anchors.fill: parent; color: "#172339" }

    // Hai lớp ảnh để cross-fade lặp mượt
    Image {
        id: imgA
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        cache: true; asynchronous: true; smooth: true
        source: banners.length > 0 ? banners[0] : ""
        opacity: 1
    }
    Image {
        id: imgB
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        cache: true; asynchronous: true; smooth: true
        opacity: 0
    }

    // Indicator
    PageIndicator {
        count: Math.max(0, banners.length)
        currentIndex: splash.currentIndex
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: Math.round(24 * splash.uiScale)
    }

    // ===== PRECISE TRANSITION TIMER =====
    Timer {
        id: transitionTimer
        interval: 1000
        running: false
        repeat: false
        onTriggered: {
            splash._doTransition()
            splash._scheduleNextTransition()
        }
    }

    function _scheduleNextTransition() {
        if (banners.length <= 1) return
        var now = Date.now()
        var nextMs = (Math.floor(now / slideIntervalMs) + 1) * slideIntervalMs
        var delay = nextMs - now
        // Thêm 100ms buffer để đảm bảo epoch second đã đổi khi fire
        transitionTimer.interval = Math.max(50, delay + 100)
        transitionTimer.start()

        // Preload
        var nextEpochSec = Math.floor(nextMs / 1000)
        var intervalSec = Math.max(1, Math.round(slideIntervalMs / 1000))
        var nextIndex = Math.floor(nextEpochSec / intervalSec) % banners.length
        var hiddenImg = _flip ? imgA : imgB
        if (hiddenImg.source !== banners[nextIndex]) {
            hiddenImg.source = banners[nextIndex]
        }
    }

    // Animation cross-fade
    NumberAnimation { id: fadeIn;  property: "opacity"; to: 1; duration: fadeDurationMs;  easing.type: Easing.OutCubic }
    NumberAnimation { id: fadeOut; property: "opacity"; to: 0; duration: fadeDurationMs;  easing.type: Easing.OutCubic }

    // Luân phiên A/B
    property bool _flip: false

    function _doTransition() {
        if (banners.length <= 1) return
        var intervalSec = Math.max(1, Math.round(slideIntervalMs / 1000))
        var epochSec = Math.floor(Date.now() / 1000)
        var newIndex = Math.floor(epochSec / intervalSec) % banners.length

        if (newIndex !== currentIndex) {
            _crossFadeTo(newIndex)
        }
    }

    function _crossFadeTo(next) {
        var incoming = _flip ? imgA : imgB
        var outgoing = _flip ? imgB : imgA

        if (incoming.source !== banners[next]) {
            incoming.source = banners[next]
        }
        incoming.opacity = 0

        fadeIn.target  = incoming
        fadeOut.target = outgoing
        fadeIn.start()
        fadeOut.start()

        currentIndex = next
        _flip = !_flip
    }

    // Khởi tạo đồng bộ ngay khi hiển thị
    onVisibleChanged: {
        if (visible && banners.length > 0) {
            _initSync()
        }
    }

    function _initSync() {
        _flip = false   // reset flip state for consistent sync
        if (banners.length <= 1) {
            currentIndex = 0
            imgA.source = banners.length > 0 ? banners[0] : ""
            imgA.opacity = 1
            imgB.opacity = 0
            return
        }
        var intervalSec = Math.max(1, Math.round(slideIntervalMs / 1000))
        var epochSec = Math.floor(Date.now() / 1000)
        var idx = Math.floor(epochSec / intervalSec) % banners.length

        // Set trực tiếp không animation lần đầu
        currentIndex = idx
        imgA.source = banners[idx]
        imgA.opacity = 1
        imgB.opacity = 0

        // Bắt đầu precise timer
        _scheduleNextTransition()
    }

    // Tap để quay về Home (Splash được push từ Home → pop())
    MouseArea {
        anchors.fill: parent
        onClicked: if (splash.StackView && splash.StackView.view) splash.StackView.view.pop()
    }
}

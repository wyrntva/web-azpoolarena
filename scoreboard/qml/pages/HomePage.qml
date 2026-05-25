// qml/pages/HomePage.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import Qt5Compat.GraphicalEffects
import "../components"

Item {
    id: home
    property string routeName: "home"
    property string registerUrl: "https://poolarena.vn"
    property var promoImages: {
        if (typeof BannerService !== "undefined" && BannerService && typeof BannerService.get_cached_banners === "function") {
            var cached = BannerService.get_cached_banners("scoreboard")
            if (cached && cached.length > 0) return cached
        }
        return []
    }
    function showToast(msg) {
        // Disabled
    }

    function closeAllDialogs() {
        try {
            if (tournamentsDlg && tournamentsDlg.visible) tournamentsDlg.close()
            if (infoDlg && infoDlg.visible) infoDlg.close()
            if (modeDlg && modeDlg.visible) modeDlg.close()
            if (menuDlg && menuDlg.visible) menuDlg.close()
            if (promoDlg && promoDlg.visible) promoDlg.close()
            if (billDlg && billDlg.visible) billDlg.close()
            if (replayLoader && replayLoader.active) {
                if (replayLoader.item && typeof replayLoader.item.close === "function") {
                    replayLoader.item.close()
                }
                replayLoader.active = false
            }
        } catch(e) {
            console.warn("Error closing dialogs:", e)
        }
    }

    readonly property int bannerTop: Math.round(24 * win.uiScale)
    readonly property int bannerH:   Math.round(280 * win.uiScale)
    readonly property int lm:        Math.round(279 * win.uiScale)
    readonly property int rm:        Math.round(281 * win.uiScale)
    readonly property int gapBase:   Math.round(24 * win.uiScale)
    readonly property int cols: 4

    readonly property int dlgW:      Math.round(680 * win.uiScale)
    readonly property int dlgMin:    Math.round(550 * win.uiScale)
    readonly property int dlgSide:   Math.round(20  * win.uiScale)
    readonly property int dlgKb:     Math.round(16  * win.uiScale)
    readonly property int dlgTitle:  Math.round(32  * win.uiScale)
    readonly property int dlgText:   Math.round(24  * win.uiScale)

    readonly property int btnH:      Math.round(72 * win.uiScale)
    readonly property int btnMinW:   Math.round(180 * win.uiScale)
    readonly property int btnFont:   dlgText

    Item {
        id: content
        x: Math.round(home.lm)
        width: Math.round(home.width - home.lm - home.rm)
        anchors.top: parent.top
        anchors.topMargin: home.bannerTop
        height: childrenRect.height
    }

    property var apiBanners: []
    property int currentBannerIndex: 0
    property bool showImageA: true  // Toggle between two images for crossfade
    
    readonly property string currentBannerUrl: {
        if (apiBanners.length > 0) {
            return apiBanners[currentBannerIndex]
        }
        return "../../assets/banner.png"  // Fallback to static banner
    }
    
    readonly property string nextBannerUrl: {
        if (apiBanners.length > 1) {
            const nextIndex = (currentBannerIndex + 1) % apiBanners.length
            return apiBanners[nextIndex]
        }
        return currentBannerUrl
    }

    // Banner slideshow - precise transition timer
    // Tính chính xác ms đến lần chuyển tiếp theo, fire 1 lần thay vì poll mỗi 1s
    property int bannerFadeDurationMs: 500
    property int bannerIntervalMs: 15000

    Timer {
        id: bannerTransitionTimer
        interval: 1000
        running: false
        repeat: false
        onTriggered: {
            home._doBannerTransition()
            home._scheduleBannerTransition()
        }
    }

    function _scheduleBannerTransition() {
        if (apiBanners.length <= 1) return
        var now = Date.now()
        var nextMs = (Math.floor(now / bannerIntervalMs) + 1) * bannerIntervalMs
        var delay = nextMs - now
        bannerTransitionTimer.interval = Math.max(50, delay + 100)
        bannerTransitionTimer.start()

        // Preload ảnh tiếp theo
        _preloadBanner(nextMs)
    }

    function _preloadBanner(nextMs) {
        if (apiBanners.length <= 1) return
        var nextEpochSec = Math.floor(nextMs / 1000)
        var intervalSec = Math.max(1, Math.round(bannerIntervalMs / 1000))
        var nextIndex = Math.floor(nextEpochSec / intervalSec) % apiBanners.length
        var hiddenImg = home.showImageA ? bannerImageB : bannerImageA
        if (hiddenImg.source !== apiBanners[nextIndex]) {
            hiddenImg.source = apiBanners[nextIndex]
        }
    }

    function _doBannerTransition() {
        if (apiBanners.length <= 1) return
        var intervalSec = Math.max(1, Math.round(bannerIntervalMs / 1000))
        var epochSec = Math.floor(Date.now() / 1000)
        var newIndex = Math.floor(epochSec / intervalSec) % apiBanners.length
        if (newIndex !== currentBannerIndex) {
            _crossFadeBannerTo(newIndex)
        }
    }

    // Animation cross-fade (giống ControlPanel và image-display)
    NumberAnimation { id: bannerFadeIn;  property: "opacity"; to: 1; duration: home.bannerFadeDurationMs; easing.type: Easing.OutCubic }
    NumberAnimation { id: bannerFadeOut; property: "opacity"; to: 0; duration: home.bannerFadeDurationMs; easing.type: Easing.OutCubic }

    function _crossFadeBannerTo(nextIndex) {
        if (apiBanners.length === 0) return
        var incoming = home.showImageA ? bannerImageB : bannerImageA
        var outgoing = home.showImageA ? bannerImageA : bannerImageB

        if (incoming.source !== apiBanners[nextIndex]) {
            incoming.source = apiBanners[nextIndex]
        }
        incoming.opacity = 0

        bannerFadeIn.target  = incoming
        bannerFadeOut.target = outgoing
        bannerFadeIn.start()
        bannerFadeOut.start()

        home.currentBannerIndex = nextIndex
        home.showImageA = !home.showImageA
    }

    // Listen to banner updates from BannerService
    Connections {
        target: BannerService
        function onBannersLoaded(bannerType, urls) {
            if (bannerType === "tournament") {
                console.log("HomePage: Loaded", urls.length, "banner(s) from API")
                home.apiBanners = urls
                
                var now = new Date().getTime()
                var period = 15000
                var startIndex = urls.length > 0 ? Math.floor(now / period) % urls.length : 0
                
                home.currentBannerIndex = startIndex
                home.showImageA = true
                
                // Initialize sources explicitly based on globally synced index
                if (urls.length > 0) {
                    bannerImageA.source = urls[startIndex]
                } else {
                    bannerImageA.source = "../../assets/banner.png"
                }
                
                if (urls.length > 1) {
                    var nextIndex = (startIndex + 1) % urls.length
                    bannerImageB.source = urls[nextIndex]
                } else if (urls.length > 0) {
                    bannerImageB.source = urls[startIndex]
                }

                // Bắt đầu precise transition timer
                if (urls.length > 1) {
                    home._scheduleBannerTransition()
                }
            }
        }
        function onRequestFailed(bannerType, errorMsg) {
            if (bannerType === "tournament") {
                console.warn("HomePage: Failed to load banners:", errorMsg)
                // Fallback to static is automatic if apiBanners is empty?
                // Or set explicit source
                if (home.apiBanners.length === 0) {
                     bannerImageA.source = "../../assets/banner.png"
                }
            }
        }
    }

    Item {
        id: bannerSource
        parent: content
        width: content.width
        height: home.bannerH

        // Rounded rectangle mask for images
        Rectangle {
            id: bannerMask
            anchors.fill: parent
            radius: Math.round(16 * win.uiScale)
            visible: false  // Hidden, used only as mask
        }

        // Container for images
        Item {
            id: bannerContainer
            anchors.fill: parent

            // Image Layer A
            Image {
                id: bannerImageA
                anchors.fill: parent
                source: "../../assets/banner.png"
                fillMode: Image.PreserveAspectCrop
                smooth: true
                antialiasing: true
                asynchronous: true
                cache: false
                opacity: 1
            }

            // Image Layer B
            Image {
                id: bannerImageB
                anchors.fill: parent
                source: ""
                fillMode: Image.PreserveAspectCrop
                smooth: true
                antialiasing: true
                asynchronous: true
                cache: false
                opacity: 0
            }

            // Apply rounded corner mask
            layer.enabled: true
            layer.effect: OpacityMask {
                maskSource: bannerMask
            }
        }
    }

    ShaderEffectSource {
        id: bannerShadowSource
        sourceItem: bannerSource
        live: false
        hideSource: false
        smooth: true
        mipmap: true
        recursive: true
        Component.onCompleted: scheduleUpdate()
    }

    Connections {
        target: bannerSource
        function onWidthChanged()  { bannerShadowSource.scheduleUpdate() }
        function onHeightChanged() { bannerShadowSource.scheduleUpdate() }
    }

    // ===== Bóng/Shadow của banner =====
    RealShadow {
        parent: content
        anchors.left: parent.left
        anchors.right: parent.right
        height: home.bannerH
        sourceItem: bannerShadowSource
        horizontalOffset: 0
        verticalOffset: Math.round(4 * win.uiScale)
        blurRadius: Math.round(6 * win.uiScale)
        autoPad: false
        shadowVisible: bannerSource.visible
    }

    Label {
        id: homeTitle
        parent: content                     
        z: 10                                 
        anchors.top: bannerSource.bottom
        anchors.topMargin: 50                 
        anchors.horizontalCenter: content.horizontalCenter
        text: (typeof win !== "undefined" && win) ? win.tr("home_title") : "TRANG CHỦ"
        font.pixelSize: Math.round(36 * win.uiScale)
        font.bold: true
        color: "#172339"
    }

    Grid {
        id: grid
        parent: content
        anchors.top: bannerSource.bottom
        anchors.topMargin: home.gapBase + 100
        width: content.width

        rows: 2
        columns: home.cols

        readonly property int cardW: Math.round(
            (width - home.gapBase * (home.cols - 1)) / home.cols
        )
        readonly property real spacingFit: (home.cols > 1)
            ? Math.max(0, (width - cardW * home.cols) / (home.cols - 1))
            : 0

        rowSpacing: home.gapBase
        columnSpacing: spacingFit

        function cardH(w) { return Math.round(275 * (w / 435)) }

        NavCard {
            title: win.tr("nav_scoreboard")
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/scoreboard-svgrepo-com.svg"
            onClicked: modeDlg.open()
        }
        NavCard {
            title: win.tr("nav_replay")
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/replay-camera.svg"
            onClicked: openReplay()
        }
        NavCard {
            title: win.tr("nav_register")
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/registry-svgrepo-com.svg"
            onClicked: tournamentsDlg.openWithUrl(home.registerUrl)
        }
        NavCard {
            title: win.tr("nav_rank")
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/rankingg.svg"
            onClicked: {
                const winRef = home.Window.window
                if (winRef && typeof winRef.pushPage === "function") {
                    winRef.pushPage("pages/RankingsPage.qml", {})
                }
            }
        }

        NavCard {
            title: win.tr("nav_promo")
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/price-ticket-svgrepo-com.svg"
            onClicked: promoDlg.open()
        }
        NavCard {
            title: win.tr("nav_menu")
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/alarming-bell-svgrepo-com.svg"
            onClicked: menuDlg.openWith()
        }
        NavCard {
            title: "XEM HOÁ ĐƠN"
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/view_bill_icon.svg"
            onClicked: {
                if (typeof OrdersService !== "undefined" && OrdersService && typeof OrdersService.fetchOrders === "function")
                    OrdersService.fetchOrders()
                billDlg.open()
            }
        }
        NavCard {
            title: "TẬP LUYỆN"
            width:  grid.cardW
            height: grid.cardH(width)
            iconSource: "../../assets/icon/practice_icon.svg"
            onClicked: showInfo("TẬP LUYỆN", win.tr("info_default_message"))
        }
    }

    TournamentsDialog {
        id: tournamentsDlg
        titleText: win.tr("tournament_title")
        url: home.registerUrl 
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        }

    InfoDialog {
        id: infoDlg
        titleText: win.tr("info_title")
        messageText: win.tr("info_default_message") 
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        }

    function showInfo(title, msg) {
        infoDlg.titleText = title || win.tr("info_title")
        infoDlg.messageText = msg || win.tr("info_default_message")
        infoDlg.open()
    }

    ModeSelectDialog {
        id: modeDlg
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont

        onSelectTwo: {
            home.StackView.view.push(
                Qt.resolvedUrl("ScorePage.qml"),
                { routeName: "score2p", backTo: "home", mode: "two" }
            )
        }
        onSelectMulti: {
            home.StackView.view.push(
                Qt.resolvedUrl("MultiScorePage.qml"),
                { routeName: "multiScore", backTo: "home", mode: "multi" }
            )
        }
        onSelectCards: {
            home.StackView.view.push(
                Qt.resolvedUrl("MultiCardScorePage.qml"),
                { routeName: "multiCardScore", backTo: "home", mode: "cards" }
            )
        }
        onSelectMultiQuick: {
            home.StackView.view.push(
                Qt.resolvedUrl("MultiQuickAddPage.qml"),
                { routeName: "QuickScore", backTo: "home", mode: "multiQuick" }
            )
        }
    }

    MenuDialog { id: menuDlg }

    // ==== PROMO DIALOG ====
    PromoDialog {
        id: promoDlg
        fixedW: Math.round(900 * win.uiScale); minW: Math.round(750 * win.uiScale); sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
        promoImages: home.promoImages
    }

    // Lắng nghe promo banners từ backend
    Connections {
        target: BannerService
        function onBannersLoaded(bannerType, urls) {
            if (bannerType === "scoreboard") {
                console.log("HomePage: Loaded", urls.length, "promo image(s) from scoreboard banners")
                home.promoImages = urls
            }
        }
    }

    // ==== REPLAY ====
    Loader {
        id: replayLoader
        active: false
        source: "../components/ReplayDialog.qml"
        visible: false
    }

    Connections {
        target: replayLoader.item
        ignoreUnknownSignals: true
        function onClosed() {
            replayLoader.active = false
        }
    }

    function openReplay() {
        replayLoader.active = true
        if (replayLoader.item && typeof replayLoader.item.openNow === "function") {
            replayLoader.item.openNow()
        }
    }
    // ==== BILL DIALOG ====
    BillDialog {
        id: billDlg
        orders: (typeof OrdersService !== "undefined" && OrdersService) ? OrdersService.orders : []
        loading: (typeof OrdersService !== "undefined" && OrdersService) ? OrdersService.loading : false
        errorText: (typeof OrdersService !== "undefined" && OrdersService) ? OrdersService.error : ""
        tableId: (typeof DeviceSettings !== "undefined" && DeviceSettings) ? DeviceSettings.tableId : 0
        areaId: (typeof DeviceSettings !== "undefined" && DeviceSettings) ? DeviceSettings.areaId : 0
        tableName: (typeof DeviceSettings !== "undefined" && DeviceSettings) ? DeviceSettings.tableName : ""
        fixedW: dlgW; minW: dlgMin; sideMargin: dlgSide; keyboardMargin: dlgKb
        titleFontSize: dlgTitle; contentFontSize: dlgText
        buttonHeight: btnH; buttonMinWidth: btnMinW; buttonFontSize: btnFont
    }
}

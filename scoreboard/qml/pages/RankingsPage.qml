// qml/pages/RankingsPage.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import Qt5Compat.GraphicalEffects
import "../components"

Item {
    id: page
    property string routeName: "rankings"

    implicitWidth: Math.round(1360 * uiScale)
    implicitHeight: Math.round(900 * uiScale)
    width: parent ? parent.width : implicitWidth
    height: parent ? parent.height : implicitHeight

    readonly property real uiScale: (typeof win !== "undefined" && win) ? win.uiScale : 1
    function px(v) { return Math.round(v * uiScale) }

    function trLocal(key) {
        return (typeof win !== "undefined" && win && typeof win.tr === "function") ? win.tr(key) : key
    }

    function trArgsLocal(key, args, fallback) {
        if (typeof win !== "undefined" && win && typeof win.trArgs === "function")
            return win.trArgs(key, args, fallback)
        return (fallback !== undefined) ? fallback : key
    }

    function filterLabel(value) {
        switch (value) {
        case "gplus": return trLocal("rankings_filter_gplus")
        case "g":     return trLocal("rankings_filter_g")
        default:       return trLocal("rankings_filter_all")
        }
    }

    function displayPlayerName(entry) {
        if (entry && entry.player && entry.player.name && entry.player.name.length)
            return entry.player.name
        return trLocal("rankings_unknown")
    }

    function displayRankLabel(entry) {
        const rankName = (entry && entry.rank_name) ? entry.rank_name : "N/A"
        return trArgsLocal("rankings_rank_label", [rankName], "Hạng " + rankName)
    }

    property int currentPage: 1
    property string filter: "all"
    property int pageSize: 20
    property bool isLoadingMore: false
    property bool initialLoadDone: false
    property bool hasError: false
    property string errorMessage: ""
    property bool hasMore: false

    function handleLoadMore() {
        if (!hasMore || isLoadingMore)
            return

        if (!(RankingsService && typeof RankingsService.fetchRankings === "function")) {
            console.warn("RankingsService unavailable for load more")
            return
        }

        const nextPage = currentPage + 1
        isLoadingMore = true
        RankingsService.fetchRankings(filter, nextPage, pageSize)
    }

    readonly property var filterOptions: [
        ({ textKey: "rankings_filter_all", value: "all" }),
        ({ textKey: "rankings_filter_gplus", value: "gplus" }),
        ({ textKey: "rankings_filter_g", value: "g" })
    ]

    readonly property url defaultAvatar: Qt.resolvedUrl("../../assets/avatar_placeholder.png")

    readonly property int topDeckCount: 5
    readonly property int topContainerWidth: Math.round(1360 * uiScale)
    readonly property int topCardWidth: Math.round(1312 * uiScale)
    readonly property int topCardHeight: Math.round(124 * uiScale)
    readonly property int topCardMargin: Math.round(24 * uiScale)
    readonly property int topCardSpacing: Math.round(12 * uiScale)
    readonly property int topHeaderWidth: Math.round(648 * uiScale)
    readonly property int topHeaderHeight: Math.round(56 * uiScale)
    readonly property int topHeaderRadius: Math.round(32 * uiScale)
    readonly property int topContainerHeight: Math.round(
        topHeaderHeight +
        topCardSpacing +
        topDeckCount * topCardHeight +
        Math.max(0, topDeckCount - 1) * topCardSpacing +
        topCardMargin
    )

    property var rankingsData: []
    property var pagination: ({ current_page: 0, total_pages: 0, total: 0, per_page: pageSize })

    property int totalPages: pagination.total_pages > 0
                              ? pagination.total_pages
                              : Math.max(1, Math.ceil((pagination.total || 0) / pageSize))

    onFilterChanged: refreshRankings()

    Rectangle {
        anchors.fill: parent
        color: "#F0F2F4"
    }

    Flickable {
        id: rankingsFlick
        anchors.top: parent.top
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        flickableDirection: Flickable.VerticalFlick
        contentWidth: width
        contentHeight: Math.max(flickContent.implicitHeight, height)
        clip: true

        ScrollBar.vertical: ScrollBar {
            policy: ScrollBar.AsNeeded
        }

        ColumnLayout {
            id: flickContent
            width: parent.width
            x: 0
            spacing: 0
            height: Math.max(implicitHeight, rankingsFlick.height)

            Item {
                id: leaderboardBanner
                Layout.fillWidth: true
                height: Math.round(400 * page.uiScale)

                property var apiBanners: []
                property int currentBannerIndex: 0
                property bool showImageA: true

                readonly property string fallbackBanner: "../../assets/banner 1920x400.png"

                Timer {
                    id: leaderboardBannerTimer
                    interval: 15000
                    repeat: true
                    running: leaderboardBanner.apiBanners.length > 1
                    onTriggered: {
                        leaderboardBanner.showImageA = !leaderboardBanner.showImageA
                        leaderboardBanner.currentBannerIndex = (leaderboardBanner.currentBannerIndex + 1) % leaderboardBanner.apiBanners.length
                    }
                }

                Connections {
                    target: BannerService

                    function onBannersLoaded(bannerType, urls) {
                        if (bannerType !== "ranking")
                            return

                        console.log("RankingsPage: Loaded", urls.length, "ranking banner(s)")

                        leaderboardBanner.apiBanners = urls
                        leaderboardBanner.currentBannerIndex = 0
                        leaderboardBanner.showImageA = true

                        if (urls.length > 0) {
                            bannerImageA.source = urls[0]
                        } else {
                            bannerImageA.source = leaderboardBanner.fallbackBanner
                        }

                        if (urls.length > 1) {
                            bannerImageB.source = urls[1]
                        } else if (urls.length > 0) {
                            bannerImageB.source = urls[0]
                        } else {
                            bannerImageB.source = ""
                        }
                    }

                    function onRequestFailed(bannerType, errorMsg) {
                        if (bannerType !== "ranking")
                            return

                        console.warn("RankingsPage: Failed to load ranking banners:", errorMsg)
                        if (leaderboardBanner.apiBanners.length === 0)
                            bannerImageA.source = leaderboardBanner.fallbackBanner
                    }
                }

                Rectangle {
                    id: bannerMask
                    anchors.fill: parent
                    radius: 0
                    visible: false
                }

                Item {
                    id: bannerContainer
                    anchors.fill: parent

                    Image {
                        id: bannerImageA
                        anchors.fill: parent
                        source: leaderboardBanner.fallbackBanner
                        fillMode: Image.PreserveAspectCrop
                        smooth: true
                        antialiasing: true
                        asynchronous: true
                        cache: false
                        opacity: leaderboardBanner.showImageA ? 1.0 : 0.0

                        Behavior on opacity {
                            NumberAnimation { duration: 2000; easing.type: Easing.InOutSine }
                        }

                        onOpacityChanged: {
                            if (opacity === 0.0 && leaderboardBanner.apiBanners.length > 1) {
                                var nextIndex = (leaderboardBanner.currentBannerIndex + 1) % leaderboardBanner.apiBanners.length
                                source = leaderboardBanner.apiBanners[nextIndex]
                            }
                        }
                    }

                    Image {
                        id: bannerImageB
                        anchors.fill: parent
                        source: ""
                        fillMode: Image.PreserveAspectCrop
                        smooth: true
                        antialiasing: true
                        asynchronous: true
                        cache: false
                        opacity: leaderboardBanner.showImageA ? 0.0 : 1.0

                        Behavior on opacity {
                            NumberAnimation { duration: 2000; easing.type: Easing.InOutSine }
                        }

                        onOpacityChanged: {
                            if (opacity === 0.0 && leaderboardBanner.apiBanners.length > 1) {
                                var nextIndex = (leaderboardBanner.currentBannerIndex + 1) % leaderboardBanner.apiBanners.length
                                source = leaderboardBanner.apiBanners[nextIndex]
                            }
                        }
                    }

                    layer.enabled: true
                    layer.effect: OpacityMask { maskSource: bannerMask }
                }

                Component.onCompleted: {
                    if (BannerService && typeof BannerService.fetch_banners === "function")
                        BannerService.fetch_banners("ranking")
                }
            }

            Item {
                Layout.fillWidth: true
                Layout.preferredHeight: px(20)
            }

            Item {
                visible: page.rankingsData.length > 0
                width: page.topContainerWidth
                Layout.alignment: Qt.AlignHCenter
                Layout.topMargin: px(246) - leaderboardBanner.height - px(20)
                Layout.preferredHeight: page.topContainerHeight
                implicitHeight: page.topContainerHeight
                z: 1

                Item {
                    id: topDeckContent
                    anchors.fill: parent

                    Rectangle {
                        id: topDeckBackground
                        anchors.fill: parent
                        radius: px(12)
                        color: "#ffffff"
                        border.width: 0
                    }

                    Item {
                        id: topDeckHeader
                        anchors.top: parent.top
                        anchors.horizontalCenter: parent.horizontalCenter
                        width: page.topHeaderWidth
                        height: page.topHeaderHeight

                        Rectangle {
                            id: headerBase
                            anchors.fill: parent
                            radius: page.topHeaderRadius
                            color: "#172339"
                        }

                        Rectangle {
                            anchors.left: headerBase.left
                            anchors.right: headerBase.right
                            anchors.top: headerBase.top
                            height: Math.max(0, headerBase.height - page.topHeaderRadius)
                            color: headerBase.color
                        }

                        AppText {
                            anchors.fill: parent
                            text: trLocal("rankings_title")
                            color: "white"
                            font.pixelSize: Math.round(24 * page.uiScale)
                            font.bold: true
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }

                    Column {
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.bottom: parent.bottom
                        anchors.top: topDeckHeader.bottom
                        anchors.leftMargin: page.topCardMargin
                        anchors.rightMargin: page.topCardMargin
                        anchors.bottomMargin: page.topCardMargin
                        anchors.topMargin: page.topCardSpacing
                        spacing: page.topCardSpacing

                        Repeater {
                            model: Math.min(5, page.rankingsData.length)
                            delegate: Item {
                                width: page.topCardWidth
                                height: page.topCardHeight
                                property var entry: page.rankingsData[index]

                                Rectangle {
                                    anchors.fill: parent
                                    radius: px(12)
                                    color: "#ffffff"
                                    border.width: 0

                                    RowLayout {
                                        anchors.fill: parent
                                        anchors.margins: Math.round(24 * page.uiScale)
                                        spacing: Math.round(24 * page.uiScale)
                                        Layout.alignment: Qt.AlignVCenter

                                        AppText {
                                            width: Math.round(72 * page.uiScale)
                                            height: Math.round(72 * page.uiScale)
                                            text: "#" + (index + 1)
                                            font.pixelSize: Math.round(30 * page.uiScale)
                                            font.bold: true
                                            font.weight: Font.Bold
                                            font.italic: true
                                            color: "#575E70"
                                            Layout.alignment: Qt.AlignVCenter
                                            horizontalAlignment: Text.AlignHCenter
                                            verticalAlignment: Text.AlignVCenter
                                        }

                                        Rectangle {
                                            width: Math.round(60 * page.uiScale)
                                            height: Math.round(75 * page.uiScale)
                                            radius: Math.round(10 * page.uiScale)
                                            color: "transparent"
                                            clip: true
                                            Layout.alignment: Qt.AlignVCenter
                                            Image {
                                                id: topAvatar
                                                anchors.fill: parent

                                                property string rawUrl: (entry && entry.player && entry.player.avatar_url) ? String(entry.player.avatar_url) : ""
                                                property string normalizedUrl: {
                                                    if (!rawUrl || rawUrl.length === 0)
                                                        return ""
                                                    if (rawUrl.indexOf("http") === 0 || rawUrl.indexOf("file:") === 0)
                                                        return rawUrl
                                                    var base = (typeof ApiBaseUrl !== "undefined" && ApiBaseUrl)
                                                        ? String(ApiBaseUrl).replace(/\/$/, "")
                                                        : "http://localhost:8000"
                                                    if (rawUrl.indexOf("/") === 0)
                                                        return base + rawUrl
                                                    return base + "/" + rawUrl
                                                }

                                                // Try local cache first, fall back to remote
                                                property string cachedUrl: {
                                                    if (!normalizedUrl || normalizedUrl.length === 0) return ""
                                                    if (typeof ImageCache !== "undefined" && ImageCache && typeof ImageCache.resolve === "function") {
                                                        var local = ImageCache.resolve(normalizedUrl)
                                                        if (local && local.length > 0) return local
                                                    }
                                                    return ""
                                                }

                                                source: {
                                                    if (cachedUrl.length > 0) return cachedUrl
                                                    if (normalizedUrl.length > 0) return normalizedUrl
                                                    return page.defaultAvatar
                                                }
                                                fillMode: Image.PreserveAspectCrop
                                                smooth: true
                                                asynchronous: true

                                                Component.onCompleted: {
                                                    // Trigger download to cache if not cached yet
                                                    if (normalizedUrl.length > 0 && cachedUrl.length === 0) {
                                                        if (typeof ImageCache !== "undefined" && ImageCache && typeof ImageCache.ensureCached === "function")
                                                            ImageCache.ensureCached(normalizedUrl, "avatars")
                                                    }
                                                }

                                                onStatusChanged: {
                                                    if (status === Image.Error) {
                                                        console.warn("Avatar load failed:", source, "raw:", rawUrl, "error:", errorString)
                                                        source = page.defaultAvatar
                                                    }
                                                }
                                            }
                                        }

                                        Column {
                                            Layout.fillWidth: true
                                            spacing: Math.round(6 * page.uiScale)
                                            Layout.alignment: Qt.AlignVCenter
                                            AppText {
                                                text: displayPlayerName(entry)
                                                font.pixelSize: Math.round(24 * page.uiScale)
                                                font.bold: true
                                                font.weight: Font.Bold
                                                color: "#37393E"
                                                horizontalAlignment: Text.AlignLeft
                                            }
                                            AppText {
                                                text: displayRankLabel(entry)
                                                font.pixelSize: Math.round(16 * page.uiScale)
                                                color: "#575E70"
                                                horizontalAlignment: Text.AlignLeft
                                            }
                                        }

                                        AppText {
                                            width: Math.round(120 * page.uiScale)
                                            height: Math.round(48 * page.uiScale)
                                            text: (entry && entry.points) ? entry.points : 0
                                            font.pixelSize: Math.round(24 * page.uiScale)
                                            font.bold: true
                                            font.weight: Font.Bold
                                            font.italic: true
                                            color: "#575E70"
                                            Layout.alignment: Qt.AlignVCenter
                                            horizontalAlignment: Text.AlignHCenter
                                            verticalAlignment: Text.AlignVCenter
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                RealShadow {
                    id: topDeckShadow
                    anchors.fill: parent
                    sourceItem: topDeckContent
                    horizontalOffset: 0
                    verticalOffset: Math.round(4 * page.uiScale)
                    blurRadius: Math.round(6 * page.uiScale)
                    autoPad: true
                    shadowVisible: page.visible
                    z: -1
                }
            }

            Item { width: 1; height: px(20) }

            Item {
                visible: page.rankingsData.length > 5
                width: page.topContainerWidth
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredHeight: lowerListContent.implicitHeight
                implicitHeight: lowerListContent.implicitHeight

                Column {
                    id: lowerListContent
                    width: parent.width
                    spacing: px(12)

                    Repeater {
                        model: Math.max(page.rankingsData.length - 5, 0)
                        delegate: Column {
                            width: parent.width
                            spacing: px(4)
                            property var entry: page.rankingsData[index + 5]

                            Item {
                                id: lowerCardWrapper
                                width: parent.width
                                height: px(72)

                                Rectangle {
                                    id: lowerCard
                                    anchors.fill: parent
                                    radius: px(12)
                                    color: "#ffffff"
                                    border.width: 0

                                    RowLayout {
                                        anchors.fill: parent
                                        anchors.margins: px(12)
                                        anchors.leftMargin: px(12) + px(40)
                                        spacing: px(12)
                                        Layout.alignment: Qt.AlignVCenter

                                        AppText {
                                            width: px(54)
                                            height: px(54)
                                            text: "#" + (index + 6)
                                            font.pixelSize: px(18)
                                            font.bold: true
                                            font.weight: Font.Bold
                                            font.italic: true
                                            color: "#575E70"
                                            Layout.alignment: Qt.AlignVCenter
                                            horizontalAlignment: Text.AlignHCenter
                                            verticalAlignment: Text.AlignVCenter
                                        }

                                        Item { width: px(20); height: px(48) }

                                        Column {
                                            Layout.fillWidth: true
                                            spacing: px(4)
                                            Layout.alignment: Qt.AlignVCenter
                                            AppText {
                                                text: displayPlayerName(entry)
                                                font.pixelSize: px(18)
                                                font.bold: true
                                                font.weight: Font.Bold
                                                color: "#37393E"
                                                horizontalAlignment: Text.AlignLeft
                                            }
                                            AppText {
                                                text: displayRankLabel(entry)
                                                font.pixelSize: px(16)
                                                color: "#575E70"
                                                horizontalAlignment: Text.AlignLeft
                                            }
                                        }

                                        AppText {
                                            width: px(90)
                                            height: px(36)
                                            text: (entry && entry.points) ? entry.points : 0
                                            font.pixelSize: px(18)
                                            font.bold: true
                                            font.weight: Font.Bold
                                            font.italic: true
                                            color: "#575E70"
                                            Layout.alignment: Qt.AlignVCenter
                                            Layout.rightMargin: px(40)
                                            horizontalAlignment: Text.AlignHCenter
                                            verticalAlignment: Text.AlignVCenter
                                        }
                                    }
                                }

                                RealShadow {
                                    anchors.fill: parent
                                    sourceItem: lowerCard
                                    horizontalOffset: 0
                                    verticalOffset: Math.round(4 * page.uiScale)
                                    blurRadius: Math.round(6 * page.uiScale)
                                    autoPad: true
                                    shadowVisible: page.visible
                                    z: -1
                                }
                            }
                        }
                    }

                    Button {
                        id: loadMoreBtn
                        visible: page.hasMore
                        width: px(220)
                        height: px(54)
                        text: page.isLoadingMore ? trLocal("rankings_loading") : trLocal("rankings_load_more")
                        enabled: !page.isLoadingMore
                        anchors.horizontalCenter: parent.horizontalCenter
                        anchors.topMargin: px(12)
                        onClicked: page.handleLoadMore()
                        background: Rectangle {
                            radius: px(12)
                            color: loadMoreBtn.down ? "#1e3a8a" : "#254cac"
                        }
                        contentItem: AppText {
                            text: loadMoreBtn.text
                            color: "white"
                            font.pixelSize: px(18)
                            font.bold: true
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }
                }
            }

            Item { Layout.fillWidth: true; Layout.preferredHeight: px(40) }
        }
    }

    function refreshRankings() {
        rankingsData = []
        pagination = ({ current_page: 0, total_pages: 0, total: 0, per_page: pageSize })
        currentPage = 1
        hasError = false
        errorMessage = ""
        hasMore = false
        isLoadingMore = true
        if (RankingsService && typeof RankingsService.fetchRankings === "function")
            RankingsService.fetchRankings(filter, currentPage, pageSize)
    }

    Component.onCompleted: refreshRankings()

    Connections {
        target: RankingsService

        function onRankingsLoaded(rankFilter, pageNumber, items, meta) {
            if (rankFilter !== filter)
                return

            const normalizedMeta = {
                current_page: Number(meta.current_page || pageNumber),
                total_pages: Number(meta.total_pages || 0),
                total: Number(meta.total || (items ? items.length : 0)),
                per_page: Number(meta.per_page || pageSize)
            }

            var incoming = []
            if (items && items.length) {
                for (var i = 0; i < items.length; ++i)
                    incoming.push(items[i])
            }

            console.log("Rankings loaded page", pageNumber, "items", incoming.length)

            if (pageNumber <= 1)
                rankingsData = incoming
            else
                rankingsData = rankingsData.concat(incoming)

            pagination = normalizedMeta
            currentPage = normalizedMeta.current_page
            const pageLength = incoming.length
            if (normalizedMeta.total_pages > 0)
                hasMore = normalizedMeta.current_page < normalizedMeta.total_pages
            else
                hasMore = pageLength >= pageSize

            isLoadingMore = false
            initialLoadDone = true
            hasError = false
            errorMessage = ""
        }

        function onRequestFailed(rankFilter, pageNumber, message) {
            if (rankFilter !== filter)
                return
            console.warn("Rankings fetch failed", message)
            isLoadingMore = false
            initialLoadDone = true
            hasError = true
            errorMessage = message || trLocal("rankings_error_generic")
            hasMore = false
        }
    }
}

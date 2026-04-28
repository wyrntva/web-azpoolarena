// qml/components/BillDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import "../components"

DialogShell {
    id: root

    titleText: trLocal("menu_view_bill", "Xem hóa đơn")
    confirmText: trLocal("menu_request_payment", "Yêu cầu thanh toán")
    cancelText: trLocal("common_close", "Đóng")
    showScrollbar: false
    maxHeightRatio: 0.72

    signal paymentRequested()

    property var orders: []
    property var mergedItems: []
    onOrdersChanged: {
        mergedItems = computeMergedItems()
    }
    property bool loading: false
    property string errorText: ""
    property int tableId: 0
    property int areaId: 0
    property string tableName: ""
    property var _now: new Date()

    function trLocal(key, fallback) {
        if (typeof win !== "undefined" && win && typeof win.tr === "function") {
            const v = win.tr(key)
            if (v !== key) return v
        }
        return (fallback !== undefined) ? fallback : key
    }

    function fmtMoney(value) {
        if (value === null || value === undefined) return ""
        const n = Number(value)
        if (!isFinite(n)) return String(value)
        const sign = n < 0 ? "-" : ""
        const abs = Math.abs(n)
        const rounded = Math.round(abs * 100) / 100
        const intPart = Math.floor(rounded)
        let frac = Math.round((rounded - intPart) * 100)
        if (frac < 0) frac = 0
        const intStr = String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        if (frac === 0) return sign + intStr + "đ"
        let fracStr = String(frac).padStart(2, "0")
        fracStr = fracStr.replace(/0+$/, "")
        return sign + intStr + "," + fracStr + "đ"
    }

    function _pad2(n) {
        return (n < 10 ? "0" : "") + n
    }

    function parseDate(value) {
        if (!value) return null
        if (value instanceof Date) return value
        let s = String(value).trim()
        if (s.indexOf("T") < 0 && s.indexOf(" ") < 0) {
            const d0 = new Date(s)
            return isNaN(d0.getTime()) ? null : d0
        }
        s = s.replace(" ", "T")
        if (s.indexOf(".") >= 0) s = s.split(".")[0]
        const hasTz = /([zZ]|[+\-]\d\d:?\d\d)$/.test(s)
        if (!hasTz) s = s + "Z"
        const d = new Date(s)
        if (!isNaN(d.getTime())) return d
        const d2 = new Date(value)
        return isNaN(d2.getTime()) ? null : d2
    }

    function fmtDateTimeShort(value) {
        const d = parseDate(value)
        if (!d) return ""
        const hh = _pad2(d.getHours())
        const mm = _pad2(d.getMinutes())
        const dd = _pad2(d.getDate())
        const MM = _pad2(d.getMonth() + 1)
        const yyyy = d.getFullYear()
        return hh + ":" + mm + " " + dd + "/" + MM + "/" + yyyy
    }

    function fmtDuration(startValue, endValue) {
        const nowTick = root._now
        const start = parseDate(startValue)
        const end = parseDate(endValue) || nowTick
        if (!start) return ""
        let sec = Math.floor((end.getTime() - start.getTime()) / 1000)
        if (!isFinite(sec) || sec < 0) sec = 0
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        const parts = []
        if (h > 0) parts.push(h + " giờ")
        if (m > 0 || h > 0) parts.push(m + " phút")
        parts.push(s + " giây")
        return parts.join(" ")
    }

    function isTimeBased(item) {
        return !!(item && (item.isTimeBased || item.is_time_based))
    }

    function itemQty(item) {
        const q = Number(item && (item.qty || item.quantity || 0))
        return isFinite(q) ? q : 0
    }

    function itemName(item) {
        if (item && item.product && item.product.name) return item.product.name
        if (item && item.name) return item.name
        return "Item"
    }

    function itemStart(item) {
        return item && (item.startTime || item.start_time) || ""
    }

    function itemEnd(item) {
        return item && (item.endTime || item.end_time) || ""
    }

    function itemUnitPrice(item) {
        const p = Number(item && item.price)
        return isFinite(p) ? p : 0
    }

    function itemTotalPrice(item) {
        const nowTick = root._now
        const qty = itemQty(item)
        const unit = itemUnitPrice(item)
        if (!isTimeBased(item)) return unit * qty

        const start = itemStart(item)
        const end = itemEnd(item)
        const d = parseDate(start)
        const e = parseDate(end) || nowTick
        const product = item && item.product ? item.product : {}
        const intervalValue = Number(product.timeIntervalValue || product.time_interval_value || 1)
        const pricePerBlock = Number(product.hourlyPrice || product.hourly_price || 0)
        if (d && isFinite(intervalValue) && intervalValue > 0 && isFinite(pricePerBlock) && pricePerBlock > 0) {
            const elapsedSeconds = Math.max(0, Math.floor((e.getTime() - d.getTime()) / 1000))
            const blockDuration = intervalValue * 60
            const blocks = Math.max(1, Math.ceil(elapsedSeconds / blockDuration))
            return Math.round(blocks * pricePerBlock * Math.max(1, qty || 1))
        }

        if (unit > 0) return unit * Math.max(1, qty || 1)
        return 0
    }

    function fmtIndex(idx) {
        const n = Number(idx) + 1
        return (n < 10 ? "0" + n : "" + n) + "."
    }

    function ordersTotal() {
        if (!orders || orders.length === 0) return 0
        let sum = 0
        for (let i = 0; i < orders.length; i++) {
            const v = orderTotal(orders[i])
            if (isFinite(v)) sum += v
        }
        return sum
    }

    function orderTotal(order) {
        if (order && order.items && order.items.length) {
            let total = 0
            for (let i = 0; i < order.items.length; i++) {
                total += itemTotalPrice(order.items[i])
            }
            return total
        }
        const v = Number(order && (order.totalAmount || order.total_amount || 0))
        return isFinite(v) ? v : 0
    }

    function computeMergedItems() {
        if (!orders || orders.length === 0) return []
        var mergedMap = {}
        var result = []
        for (var i = orders.length - 1; i >= 0; i--) {
            var ord = orders[i]
            if (!ord || !ord.items) continue
            // API usually sends oldest items first within the same order
            for (var j = 0; j < ord.items.length; j++) {
                var item = ord.items[j]
                if (!item) continue
                if (isTimeBased(item)) {
                    result.push(item)
                } else {
                    var prodId = item.product_id || (item.product ? item.product.id : "") || ""
                    var price = itemUnitPrice(item)
                    var key = prodId + "_" + price
                    if (mergedMap[key]) {
                        mergedMap[key].qty = (mergedMap[key].qty || 0) + itemQty(item)
                        mergedMap[key].quantity = mergedMap[key].qty
                    } else {
                        var newItem = {}
                        for (var k in item) { newItem[k] = item[k] }
                        newItem.qty = itemQty(item)
                        newItem.quantity = newItem.qty
                        mergedMap[key] = newItem
                        result.push(newItem)
                    }
                }
            }
        }
        return result
    }

    Timer {
        id: liveTimer
        interval: 1000
        repeat: true
        running: false
        onTriggered: root._now = new Date()
    }

    Connections {
        target: root
        function onOpened() {
            if (typeof OrdersService !== "undefined" && OrdersService) {
                if (typeof OrdersService.startAutoRefresh === "function") {
                    OrdersService.startAutoRefresh()
                }
                OrdersService.fetchOrders()
            }
            liveTimer.start()
        }
        function onClosed() {
            if (typeof OrdersService !== "undefined" && OrdersService) {
                if (typeof OrdersService.stopAutoRefresh === "function") {
                    OrdersService.stopAutoRefresh()
                }
            }
            liveTimer.stop()
        }
        function onConfirmed() {
            root.paymentRequested()
        }
    }

    body: Column {
        spacing: Math.round(12 * root.uiScale)
        width: parent.width

        AppText {
            visible: (root.loading && (!root.orders || root.orders.length === 0))
            text: trLocal("bill_loading", "Đang tải hóa đơn...")
            color: "#475569"
            font.pixelSize: Math.round(18 * root.uiScale)
        }

        AppText {
            visible: (!root.loading && root.errorText && root.errorText.length > 0)
            text: root.errorText
            color: "#E53935"
            font.pixelSize: Math.round(18 * root.uiScale)
            wrapMode: Text.WordWrap
        }

        AppText {
            visible: (!root.loading && (!root.errorText || root.errorText.length === 0) && (!root.orders || root.orders.length === 0))
            text: trLocal("bill_empty", "Chưa có hóa đơn cho bàn này.")
            color: "#475569"
            font.pixelSize: Math.round(18 * root.uiScale)
        }

        Column {
            spacing: Math.round(14 * root.uiScale)
            width: parent.width
            visible: (root.orders && root.orders.length > 0)

            Repeater {
                model: root.mergedItems || []
                delegate: Column {
                    width: parent.width
                    spacing: Math.round(6 * root.uiScale)
                    readonly property int priceColW: Math.min(Math.round(width * 0.23), Math.round(170 * root.uiScale))
                    readonly property int qtyColW: Math.round(42 * root.uiScale)
                    readonly property int indexW: Math.round(44 * root.uiScale)

                    Row {
                        id: lineRow
                        readonly property int _pad: Math.round(8 * root.uiScale)
                        readonly property int nameColW: Math.max(0, width - indexW - qtyColW - priceText.width - spacing * 3)
                        x: _pad
                        width: Math.max(0, parent.width - _pad * 2)
                        spacing: Math.round(12 * root.uiScale)

                        AppText {
                            width: indexW
                            text: root.fmtIndex(index)
                            color: "#172339"
                            font.pixelSize: Math.round(18 * root.uiScale)
                            font.bold: true
                            horizontalAlignment: Text.AlignLeft
                        }

                        AppText {
                            id: nameText
                            width: lineRow.nameColW
                            text: root.itemName(modelData)
                            color: "#172339"
                            font.pixelSize: Math.round(18 * root.uiScale)
                            font.bold: true
                            wrapMode: Text.NoWrap
                            elide: Text.ElideRight
                        }

                        AppText {
                            id: qtyText
                            width: qtyColW
                            text: root.isTimeBased(modelData) ? "" : String(root.itemQty(modelData))
                            color: "#172339"
                            font.pixelSize: Math.round(18 * root.uiScale)
                            horizontalAlignment: Text.AlignHCenter
                        }
                        AppText {
                            id: priceText
                            width: priceColW
                            text: root.fmtMoney(root.itemTotalPrice(modelData))
                            color: "#0F172A"
                            font.pixelSize: Math.round(18 * root.uiScale)
                            horizontalAlignment: Text.AlignRight
                            elide: Text.ElideRight
                        }
                    }

                    Column {
                        id: detailBlock
                        readonly property int _indent: lineRow.x + indexW + lineRow.spacing
                        readonly property int _rightPad: Math.round(8 * root.uiScale)
                        x: _indent
                        width: Math.max(0, parent.width - _indent - _rightPad)
                        spacing: Math.round(4 * root.uiScale)

                        AppText {
                            visible: root.isTimeBased(modelData) && root.itemStart(modelData)
                            text: trLocal("bill_start_label", "Giờ vào") + ": " + root.fmtDateTimeShort(root.itemStart(modelData))
                            color: "#475569"
                            font.pixelSize: Math.round(16 * root.uiScale)
                        }
                        AppText {
                            visible: root.isTimeBased(modelData) && root.itemStart(modelData)
                            text: trLocal("bill_estimate_label", "Tạm tính đến") + ": " +
                                  root.fmtDateTimeShort(root.itemEnd(modelData) || root._now)
                            color: "#F59E0B"
                            font.pixelSize: Math.round(16 * root.uiScale)
                        }
                        AppText {
                            visible: root.isTimeBased(modelData) && root.itemStart(modelData)
                            text: trLocal("bill_duration_label", "Đã sử dụng") + ": " +
                                  root.fmtDuration(root.itemStart(modelData), root.itemEnd(modelData))
                            color: "#475569"
                            font.pixelSize: Math.round(16 * root.uiScale)
                        }

                        Row {
                            visible: !root.isTimeBased(modelData)
                            spacing: Math.round(8 * root.uiScale)
                            AppText {
                                width: lineRow.nameColW
                                text: trLocal("bill_unit_price_label", "Giá thường")
                                color: "#475569"
                                font.pixelSize: Math.round(16 * root.uiScale)
                                wrapMode: Text.NoWrap
                                elide: Text.ElideRight
                            }
                            Item { width: qtyColW; height: 1 }
                            Item { width: priceColW; height: 1 }
                        }
                    }

                    Rectangle {
                        width: parent.width
                        height: 1
                        color: "#E2E8F0"
                        opacity: 0.9
                    }

                    Item { width: 1; height: Math.round(4 * root.uiScale) }
                }
            }
        }

    }

    footer: Item {
        visible: (root.orders && root.orders.length > 0)
        width: parent.width
        height: Math.max(totalLabel.implicitHeight, totalValue.implicitHeight)

        Row {
            id: totalRow
            readonly property int _pad: Math.round(8 * root.uiScale)
            x: _pad
            width: Math.max(0, parent.width - _pad * 2)
            spacing: Math.round(12 * root.uiScale)

            AppText {
                id: totalLabel
                width: Math.max(0, totalRow.width - totalValue.width - totalRow.spacing)
                text: trLocal("bill_total_label", "Tổng")
                color: "#0F172A"
                font.pixelSize: Math.round(18 * root.uiScale)
                font.bold: true
                wrapMode: Text.NoWrap
                elide: Text.ElideRight
            }
            AppText {
                id: totalValue
                width: Math.min(Math.round(totalRow.width * 0.23), Math.round(170 * root.uiScale))
                text: root.fmtMoney(root.ordersTotal())
                color: "#0F172A"
                font.pixelSize: Math.round(18 * root.uiScale)
                font.bold: true
                horizontalAlignment: Text.AlignRight
                elide: Text.ElideRight
            }
        }
    }
}

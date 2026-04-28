// qml/components/OrderHistoryDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6

DialogShell {
    id: root
    
    titleText: "LỊCH SỬ ORDER"
    confirmText: "ĐÓNG"
    cancelText: ""
    showScrollbar: false
    maxHeightRatio: 0.72

    fixedW: Math.round(700 * (typeof win !== "undefined" && win ? win.uiScale : 1))
    minW:   Math.round(500 * (typeof win !== "undefined" && win ? win.uiScale : 1))

    onConfirmed: close()
    onCancelled: close()

    property int tableId: typeof DeviceSettings !== "undefined" ? DeviceSettings.tableId : 0
    property int areaId: typeof DeviceSettings !== "undefined" ? DeviceSettings.areaId : 0

    onOpened: {
        if (typeof OrdersService !== "undefined" && OrdersService) {
            OrdersService.fetchOrders()
        }
    }

    Column {
        width: parent ? parent.width : root.dialogW
        spacing: Math.round(16 * win.uiScale)

        AppText {
            visible: typeof OrdersService !== "undefined" && OrdersService.loading && (!OrdersService.orders || OrdersService.orders.length === 0)
            text: "Đang tải lịch sử order..."
            color: "#475569"
            font.pixelSize: Math.round(18 * root.uiScale)
        }

        AppText {
            visible: typeof OrdersService !== "undefined" && !OrdersService.loading && (!OrdersService.orders || OrdersService.orders.length === 0)
            text: "Chưa có món nào được order cho bàn này."
            color: "#475569"
            font.pixelSize: Math.round(18 * root.uiScale)
        }

        Rectangle {
            width: parent.width
            height: Math.round(500 * win.uiScale)
            radius: Math.round(12 * win.uiScale)
            color: "#F6F8FA"
            border.color: "#E1E4E8"
            visible: typeof OrdersService !== "undefined" && OrdersService.orders && OrdersService.orders.length > 0

            ListView {
                id: orderList
                anchors.fill: parent
                clip: true
                spacing: Math.round(14 * root.uiScale)
                topMargin: Math.round(16 * root.uiScale)
                bottomMargin: Math.round(16 * root.uiScale)
                leftMargin: Math.round(16 * root.uiScale)
                rightMargin: Math.round(16 * root.uiScale)

                model: (typeof OrdersService !== "undefined" && OrdersService.orders) ? OrdersService.orders : []
                
                delegate: Column {
                    id: orderDelegate
                    property var orderData: modelData
                    width: orderList.width - orderList.leftMargin - orderList.rightMargin
                    spacing: Math.round(6 * root.uiScale)
                    
                    AppText {
                        text: "Mã Order: " + (modelData.id || "")
                        color: "#64748B"
                        font.bold: true
                        font.pixelSize: Math.round(14 * root.uiScale)
                    }

                    Column {
                        spacing: Math.round(4 * root.uiScale)
                        width: parent.width

                        Repeater {
                            model: (modelData.items || [])
                            delegate: Item {
                                width: parent.width
                                height: Math.max(nameCol.height, statusLabel.height) + Math.round(16 * root.uiScale)
                                
                                Rectangle {
                                    anchors.fill: parent
                                    color: "transparent"
                                    radius: 8
                                }

                                Row {
                                    id: rowLayout
                                    anchors.fill: parent
                                    anchors.margins: Math.round(8 * root.uiScale)
                                    spacing: Math.round(12 * root.uiScale)

                                    Column {
                                        id: nameCol
                                        width: parent.width - Math.round(140 * root.uiScale)
                                        
                                        AppText {
                                            text: (modelData.product && modelData.product.name) ? modelData.product.name : (modelData.name || "Không rõ món")
                                            color: "#1E293B"
                                            font.bold: true
                                            font.pixelSize: Math.round(16 * root.uiScale)
                                            wrapMode: Text.WordWrap
                                            width: parent.width
                                        }
                                        AppText {
                                            text: "Số lượng: " + (modelData.qty || modelData.quantity || 1)
                                            color: "#475569"
                                            font.pixelSize: Math.round(14 * root.uiScale)
                                        }
                                    }

                                    Rectangle {
                                        id: statusLabel
                                        width: Math.round(110 * root.uiScale)
                                        height: Math.round(28 * root.uiScale)
                                        anchors.verticalCenter: parent.verticalCenter
                                        radius: 14
                                        color: {
                                            var st = (orderDelegate.orderData.status || "").toLowerCase()
                                            if (st === "pending" || st === "pending-confirm" || st === "unconfirmed" || st === "chưa xác nhận") return "#FEF08A" // Vàng cho chưa xác nhận
                                            if (st === "cancelled" || st === "hủy") return "#FECACA" // Đỏ nhạt
                                            return "#BBF7D0" // Xanh lá mạ cho Xác nhận/Hoàn thành
                                        }
                                        
                                        AppText {
                                            anchors.centerIn: parent
                                            text: {
                                                var st = (orderDelegate.orderData.status || "").toLowerCase()
                                                if (st === "pending" || st === "pending-confirm" || st === "unconfirmed" || st === "chưa xác nhận") return "Chờ xử lý"
                                                if (st === "cancelled" || st === "hủy") return "Đã hủy"
                                                return "Đã xác nhận"
                                            }
                                            color: {
                                                var st = (orderDelegate.orderData.status || "").toLowerCase()
                                                if (st === "pending" || st === "pending-confirm" || st === "unconfirmed" || st === "chưa xác nhận") return "#A16207"
                                                if (st === "cancelled" || st === "hủy") return "#B91C1C"
                                                return "#15803D"
                                            }
                                            font.bold: true
                                            font.pixelSize: Math.round(12 * root.uiScale)
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
}

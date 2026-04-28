import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Window 6
import Qt5Compat.GraphicalEffects
import "../utils/Telex.js" as Telex

Item {
    id: wrapper
    visible: false 

    // Forward open function
    function openWith() {
        if (typeof appToast !== "undefined" && appToast) {
        }
        return; // BLOCK TẠM THỜI
        
        dialog.open()
        dialog.loadMenusAndProducts()
        dialog.cart = []
        dialog.selectedCategory = null
        dialog.searchQuery = ""
    }

    // Forward signals
    signal closed()

    DialogShell {
        id: dialog
        
        x: Math.max(0, Math.round((parent.width - dialog.width) / 2))
        y: Math.max(0, Math.round((parent.height - dialog.height) / 2))
        
        // --- Configuration ---
        titleText: "THỰC ĐƠN / GỌI MÓN"
        
        // Make it large
        fixedW: 1400
        minW: 1024
        
        // Buttons
        confirmText: "ORDER"
        cancelText: "ĐÓNG"
        confirmEnabled: cart.length > 0
        
        // Remove destructive style
        destructive: false

        // --- Data & Logic ---
        property var menus: []
        property string selectedLineId: ""
        property var products: []
        property var cart: [] 
        property var selectedCategory: null
        property string searchQuery: ""
        property int customerCount: 1
        property bool loadingMenus: false
        property bool loadingProducts: false
        readonly property string apiBaseUrl: typeof ApiBaseUrl !== "undefined" ? ApiBaseUrl : "http://localhost:8000" // Lấy từ biến môi trường của Python (hoặc rơi về fallback)
        // Logic Functions
        function loadMenusAndProducts() {
            loadingMenus = true
            loadingProducts = true

            // Fetch Menus
            var xhrMenus = new XMLHttpRequest()
            xhrMenus.onreadystatechange = function() {
                if (xhrMenus.readyState === XMLHttpRequest.DONE) {
                    loadingMenus = false
                    if (xhrMenus.status === 200) {
                        try {
                            var data = JSON.parse(xhrMenus.responseText)
                            dialog.menus = data
                            var found = false;
                            if (dialog.selectedCategory) {
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i].id === dialog.selectedCategory.id) {
                                        dialog.selectedCategory = data[i];
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            if (!found && data.length > 0) dialog.selectedCategory = data[0]
                        } catch(e) { console.error("Error parsing menus:", e) }
                    }
                }
            }
            xhrMenus.open("GET", apiBaseUrl + "/api/menus")
            xhrMenus.send()

            // Fetch Products
            var xhrProducts = new XMLHttpRequest()
            xhrProducts.onreadystatechange = function() {
                if (xhrProducts.readyState === XMLHttpRequest.DONE) {
                    loadingProducts = false
                    if (xhrProducts.status === 200) {
                        try {
                            var pData = JSON.parse(xhrProducts.responseText);
                            var filteredData = pData.filter(function(p) {
                                return p.showOnScoreboard !== false;
                            });
                            dialog.products = filteredData.map(function(p) {
                                return {
                                    id: p.id,
                                    name: p.name,
                                    price: p.price,
                                    hourlyPrice: p.hourlyPrice || p.hourly_price,
                                    type: p.type,
                                    categoryId: p.categoryId || p.category_id,
                                    image: p.image,
                                    color: p.color
                                }
                            })
                        } catch(e) { console.error("Error parsing products:", e) }
                    }
                }
            }
            xhrProducts.open("GET", apiBaseUrl + "/api/products")
            xhrProducts.send()
        }

        function getFilteredProducts() {
            var source = dialog.products
            if (dialog.selectedCategory) {
                source = source.filter(function(p) {
                     if (dialog.selectedCategory.productIds) {
                         return dialog.selectedCategory.productIds.indexOf(p.id) !== -1
                     }
                     return false
                })
            }
            var q = dialog.searchQuery.trim().toLowerCase()
            if (q.length > 0) {
                 source = source.filter(function(p) {
                     return (p.name + "").toLowerCase().indexOf(q) !== -1
                 })
            }
            return source
        }

        function addToCart(p) {
            var isTime = (p.type === 'Tính tiền theo thời gian')
            var newId = Date.now() + "-" + Math.random()
            var currentCart = dialog.cart.slice()

            if (isTime) {
                currentCart.push({ id: newId, product: p, qty: 1, isTimeBased: true })
            } else {
                var existedIndex = -1
                for (var i = 0; i < currentCart.length; i++) {
                    if (currentCart[i].product.id === p.id && !currentCart[i].isTimeBased) {
                        existedIndex = i; break
                    }
                }
                if (existedIndex !== -1) {
                    var item = currentCart[existedIndex]
                    currentCart[existedIndex] = {
                        id: item.id, product: item.product, qty: item.qty + 1, isTimeBased: false
                    }
                    dialog.selectedLineId = item.id
                } else {
                    currentCart.push({ id: newId, product: p, qty: 1, isTimeBased: false })
                    dialog.selectedLineId = newId
                }
            }
            dialog.cart = currentCart
        }

        function updateQty(lineId, delta) {
            var currentCart = dialog.cart.slice()
            var newCart = []
            for (var i = 0; i < currentCart.length; i++) {
                var item = currentCart[i]
                if (item.id === lineId) {
                    var newQty = item.qty + delta
                    if (newQty > 0) {
                        newCart.push({
                            id: item.id, product: item.product, qty: newQty, isTimeBased: item.isTimeBased
                        })
                    }
                } else {
                    newCart.push(item)
                }
            }
            dialog.cart = newCart
        }

        function calculateTotal() {
            var sum = 0
            for (var i = 0; i < dialog.cart.length; i++) {
                var line = dialog.cart[i]
                if (!line.isTimeBased) sum += (line.product.price || 0) * line.qty
            }
            return sum
        }
        
        function formatMoney(n) {
            return Number(n).toLocaleString(Qt.locale("vi_VN"), 'f', 0) + " đ"
        }
        
        function getImageUrl(url) {
            if (!url) return ""
            // Build full remote URL
            var fullUrl = url
            if (url.indexOf("http") !== 0 && url.indexOf("data:") !== 0 && url.indexOf("file:") !== 0) {
                if (url.indexOf("/") === 0) fullUrl = apiBaseUrl + url
                else fullUrl = apiBaseUrl + "/" + url
            }
            // Check local cache first
            if (typeof ImageCache !== "undefined" && ImageCache && typeof ImageCache.resolve === "function") {
                var local = ImageCache.resolve(fullUrl)
                if (local && local.length > 0) return local
                // Trigger download for next time
                if (typeof ImageCache.ensureCached === "function")
                    ImageCache.ensureCached(fullUrl, "products")
            }
            return fullUrl
        }
        onConfirmed: {
            console.log("Submit order clicked")
            var payloadItems = []
            for (var i = 0; i < dialog.cart.length; i++) {
                var item = dialog.cart[i]
                payloadItems.push({
                    "product_id": item.product.id,
                    "qty": item.qty,
                    "price": item.product.price || 0,
                    "is_time_based": item.isTimeBased === true
                })
            }
            
            var payload = {
                "table_id": typeof DeviceSettings !== "undefined" ? DeviceSettings.tableId : null,
                "area_id": typeof DeviceSettings !== "undefined" ? DeviceSettings.areaId : null,
                "table_name": typeof DeviceSettings !== "undefined" ? DeviceSettings.tableName : "",
                "items": payloadItems,
                "order_type": "scoreboard",
                "status": "pending-confirm"
            }
            
            var xhr = new XMLHttpRequest()
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200 || xhr.status === 201) {
                        console.log("Gửi order thành công:", xhr.responseText)
                        dialog.cart = []
                        dialog.selectedLineId = ""
                        wrapper.closed()
                        dialog.close()
                        
                        if (typeof OrdersService !== "undefined" && OrdersService) {
                            OrdersService.fetchOrders()
                        }
                        
                        // Show success message
                        if (typeof appToast !== "undefined" && appToast) {
                        }
                    } else {
                        console.error("Lỗi gửi order:", xhr.responseText)
                        // Show error message
                        if (typeof appToast !== "undefined" && appToast) {
                        }
                    }
                }
            }
            xhr.open("POST", apiBaseUrl + "/api/pos/orders")
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
            xhr.send(JSON.stringify(payload))
        }
        
        onCancelled: wrapper.closed()

        // --- Custom Content ---
        Item {
            id: contentContainer
            width: parent.width
            height: Math.round(650 * dialog.uiScale)
            
            RowLayout {
                anchors.fill: parent
                spacing: Math.round(8 * dialog.uiScale)

                // 1 + 2. Khu vực Danh sách Thực đơn + Sản phẩm (gộp chung nền)
                Rectangle {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    color: "#172339"
                    radius: 16
                    border.width: 1
                    border.color: "#E2E8F0"

                    RowLayout {
                        anchors.fill: parent
                        spacing: 0

                        // 1. Danh sách Thực đơn
                        Item {
                            Layout.preferredWidth: Math.round(230 * dialog.uiScale)
                            Layout.fillHeight: true

                            ListView {
                                anchors.fill: parent
                                anchors.margins: Math.round(12 * dialog.uiScale)
                                clip: true
                                model: dialog.menus
                                spacing: Math.round(12 * dialog.uiScale)
                                
                                delegate: Rectangle {
                                    width: parent.width
                                    height: Math.round(76 * dialog.uiScale)
                                    radius: 12
                                    border.width: (dialog.selectedCategory && dialog.selectedCategory.id === modelData.id) ? 0 : 1
                                    border.color: "#E2E8F0"
                                    
                                    color: {
                                        if (dialog.selectedCategory && dialog.selectedCategory.id === modelData.id) return "#2563EB"
                                        if (catMouse.containsMouse) return "#E2E8F0"
                                        return "white"
                                    }
                                    Behavior on color { ColorAnimation { duration: 150 } }
                                    
                                    AppText {
                                        anchors.centerIn: parent
                                        text: modelData.name
                                        color: (dialog.selectedCategory && dialog.selectedCategory.id === modelData.id) ? "white" : "#1E293B"
                                        font.bold: true
                                        font.pixelSize: Math.round(16 * dialog.uiScale)
                                    }
                                    
                                    MouseArea {
                                        id: catMouse
                                        anchors.fill: parent
                                        hoverEnabled: true
                                        onClicked: dialog.selectedCategory = modelData
                                    }
                                }
                            }
                        }

                        // Đường kẻ phân cách dọc
                        Rectangle {
                            Layout.fillHeight: true
                            Layout.preferredWidth: 1
                            Layout.topMargin: Math.round(12 * dialog.uiScale)
                            Layout.bottomMargin: Math.round(12 * dialog.uiScale)
                            color: "#E2E8F0"
                        }

                        // 2. Khu vực Chứa Sản phẩm
                        Item {
                            Layout.fillWidth: true
                            Layout.fillHeight: true

                            GridView {
                                id: productGrid
                                anchors.fill: parent
                                anchors.margins: Math.round(8 * dialog.uiScale)
                                clip: true
                                cellWidth: Math.floor(width / 3)
                                cellHeight: Math.floor(height / 3)
                                model: dialog.getFilteredProducts()
                                
                                delegate: Item {
                                    width: productGrid.cellWidth
                                    height: productGrid.cellHeight
                                    
                                    Rectangle {
                                        anchors.fill: parent
                                        anchors.margins: Math.round(6 * dialog.uiScale)
                                        color: "transparent"
                                        radius: 16
                                        border.width: prodMouse.containsMouse ? 2 : 1
                                        border.color: prodMouse.containsMouse ? "#3B82F6" : "transparent"
                                        
                                        scale: prodMouse.pressed ? 0.96 : (prodMouse.containsMouse ? 1.02 : 1.0)
                                        Behavior on scale { NumberAnimation { duration: 150; easing.type: Easing.OutBack } }
                                        Behavior on border.color { ColorAnimation { duration: 150 } }
                                        
                                        // Nội dung thẻ sản phẩm (ẩn, dùng làm source cho OpacityMask)
                                        Item {
                                            id: cardContent
                                            anchors.fill: parent
                                            visible: false
                                            layer.enabled: true
                                            layer.smooth: true
                                            layer.format: ShaderEffectSource.RGBA
                                            
                                            Rectangle {
                                                anchors.fill: parent
                                                color: modelData.image ? "white" : (modelData.color || "#9CA3AF")
                                                
                                                Image {
                                                    anchors.fill: parent
                                                    source: dialog.getImageUrl(modelData.image)
                                                    fillMode: Image.PreserveAspectCrop
                                                    visible: modelData.image ? true : false
                                                }
                                                
                                                Text {
                                                    anchors.centerIn: parent
                                                    text: modelData.name ? modelData.name.substring(0,1).toUpperCase() : "?"
                                                    font.pixelSize: 90
                                                    font.bold: true
                                                    color: "white"
                                                    visible: !modelData.image
                                                }

                                                Rectangle {
                                                    anchors.top: parent.top
                                                    anchors.left: parent.left
                                                    anchors.margins: Math.round(8 * dialog.uiScale)
                                                    color: "#2563EB"
                                                    radius: 8
                                                    width: priceText.contentWidth + Math.round(16 * dialog.uiScale)
                                                    height: priceText.contentHeight + Math.round(8 * dialog.uiScale)
                                                    opacity: 0.95
                                                    
                                                    AppText {
                                                        id: priceText
                                                        anchors.centerIn: parent
                                                        text: modelData.type === 'Tính tiền theo thời gian' ? 
                                                              dialog.formatMoney(modelData.hourlyPrice||0) + " / h" : 
                                                              dialog.formatMoney(modelData.price||0)
                                                        color: "white"
                                                        font.bold: true
                                                        font.pixelSize: Math.round(16 * dialog.uiScale)
                                                    }
                                                }

                                                Item {
                                                    anchors.bottom: parent.bottom
                                                    anchors.left: parent.left
                                                    anchors.right: parent.right
                                                    height: nameText.contentHeight + Math.round(20 * dialog.uiScale)
                                                    clip: true

                                                    Rectangle {
                                                        anchors.bottom: parent.bottom
                                                        anchors.left: parent.left
                                                        anchors.right: parent.right
                                                        height: parent.height + 16
                                                        color: "#40000000"
                                                        radius: 16
                                                    }

                                                    AppText {
                                                        id: nameText
                                                        anchors.centerIn: parent
                                                        width: parent.width - Math.round(16 * dialog.uiScale)
                                                        text: modelData.name
                                                        font.bold: true
                                                        font.pixelSize: Math.round(14 * dialog.uiScale)
                                                        color: "white"
                                                        elide: Text.ElideRight
                                                        horizontalAlignment: Text.AlignHCenter
                                                        verticalAlignment: Text.AlignVCenter
                                                        wrapMode: Text.WordWrap
                                                    }
                                                }
                                            }
                                        }

                                        // Mask bo góc
                                        Rectangle {
                                            id: cardMask
                                            anchors.fill: parent
                                            radius: 16
                                            visible: false
                                            antialiasing: true
                                            layer.enabled: true
                                            layer.smooth: true
                                            layer.format: ShaderEffectSource.Alpha
                                        }

                                        // Áp dụng OpacityMask để bo góc ảnh
                                        OpacityMask {
                                            anchors.fill: parent
                                            source: cardContent
                                            maskSource: cardMask
                                            antialiasing: true
                                            smooth: true
                                        }
                                        
                                        MouseArea {
                                            id: prodMouse
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            onClicked: dialog.addToCart(modelData)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 3. Khu vực Giỏ hàng
                Rectangle {
                    Layout.preferredWidth: Math.round(380 * dialog.uiScale)
                    Layout.fillHeight: true
                    color: "#F1F5F9" // Nền nền xám nhạt tương tự cột trái
                    radius: 16
                    border.width: 1
                    border.color: "#E2E8F0"

                    ColumnLayout {
                        anchors.fill: parent
                        spacing: 0
                        
                        // Header
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: Math.round(60 * dialog.uiScale)
                            color: "transparent"
                            radius: 16
                            
                            Rectangle {
                                anchors.bottom: parent.bottom; width: parent.width; height: 1; color: "#CBD5E1"
                            }
                            
                            AppText {
                                anchors.verticalCenter: parent.verticalCenter
                                anchors.left: parent.left
                                anchors.leftMargin: Math.round(20 * dialog.uiScale)
                                text: "ĐƠN HÀNG CỦA BẠN"
                                color: "#0F172A"
                                font.bold: true
                                font.pixelSize: Math.round(18 * dialog.uiScale)
                            }
                            
                            Rectangle {
                                anchors.verticalCenter: parent.verticalCenter
                                anchors.right: parent.right
                                anchors.rightMargin: Math.round(20 * dialog.uiScale)
                                width: Math.round(90 * dialog.uiScale)
                                height: Math.round(32 * dialog.uiScale)
                                radius: 16
                                color: mHis.pressed ? "#CBD5E1" : "white"
                                border.width: 1
                                border.color: "#CBD5E1"
                                
                                AppText {
                                    anchors.centerIn: parent
                                    text: "Lịch sử"
                                    color: "#1E293B"
                                    font.bold: true
                                    font.pixelSize: Math.round(13 * dialog.uiScale)
                                }
                                MouseArea {
                                    id: mHis
                                    anchors.fill: parent
                                    onClicked: orderHistoryDialog.open()
                                }
                            }
                        }
                        
                        ListView {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            clip: true
                            model: dialog.cart
                            spacing: 0
                                                        delegate: Item {
                                    property bool isSelected: modelData.id === dialog.selectedLineId
                                    width: parent.width
                                    height: isSelected ? Math.round(112 * dialog.uiScale) : Math.round(66 * dialog.uiScale)
                                    
                                    Rectangle {
                                        anchors.fill: parent
                                        color: isSelected ? "#1E9AFF" : "transparent" // mờ nhạt hơn chút xíu so với #0091ff
                                        
                                        Rectangle { anchors.bottom: parent.bottom; width: parent.width; height: 1; color: "#E2E8F0"; opacity: isSelected ? 0.3 : 1.0 }
                                        
                                        MouseArea {
                                            anchors.fill: parent
                                            onClicked: dialog.selectedLineId = modelData.id
                                        }
                                        
                                        ColumnLayout {
                                            anchors.fill: parent
                                            anchors.margins: Math.round(12 * dialog.uiScale)
                                            spacing: Math.round(4 * dialog.uiScale)
                                            
                                            RowLayout {
                                                Layout.fillWidth: true
                                                
                                                AppText {
                                                    text: (index + 1 < 10 ? "0" + (index + 1) : (index + 1)) + ". " + modelData.product.name
                                                    font.bold: true
                                                    color: isSelected ? "white" : "black"
                                                    font.pixelSize: isSelected ? Math.round(15 * dialog.uiScale) : Math.round(14 * dialog.uiScale)
                                                    Layout.fillWidth: true
                                                    elide: Text.ElideRight
                                                }
                                                
                                                Text {
                                                    text: modelData.isTimeBased ? "" : modelData.qty
                                                    font.bold: true
                                                    color: isSelected ? "white" : "black"
                                                    font.pixelSize: isSelected ? Math.round(15 * dialog.uiScale) : Math.round(14 * dialog.uiScale)
                                                    Layout.preferredWidth: Math.round(40 * dialog.uiScale)
                                                    horizontalAlignment: Text.AlignHCenter
                                                }
                                                
                                                Text {
                                                    text: modelData.isTimeBased ? "--" : dialog.formatMoney(modelData.product.price * modelData.qty)
                                                    font.bold: true
                                                    color: isSelected ? "white" : "black"
                                                    font.pixelSize: isSelected ? Math.round(15 * dialog.uiScale) : Math.round(14 * dialog.uiScale)
                                                    Layout.preferredWidth: Math.round(80 * dialog.uiScale)
                                                    horizontalAlignment: Text.AlignRight
                                                }
                                            }
                                            
                                            AppText {
                                                text: "Giá thường    " + (modelData.isTimeBased ? "--" : dialog.formatMoney(modelData.product.price))
                                                color: isSelected ? "white" : "#475569"
                                                font.pixelSize: Math.round(12 * dialog.uiScale)
                                                Layout.leftMargin: Math.round(18 * dialog.uiScale)
                                                Layout.fillWidth: true
                                            }
                                            
                                            Row {
                                                visible: isSelected
                                                spacing: Math.round(6 * dialog.uiScale)
                                                Layout.topMargin: Math.round(6 * dialog.uiScale)
                                                
                                                Rectangle {
                                                    width: Math.round(52 * dialog.uiScale); height: Math.round(36 * dialog.uiScale)
                                                    color: mMinus.pressed ? "#f0f0f0" : "white"; radius: 4; border.width: 1; border.color: "#d9d9d9"
                                                    Text { anchors.centerIn: parent; text: "−"; font.bold: true; font.pixelSize: Math.round(22 * dialog.uiScale); color: "#333" }
                                                    MouseArea { id: mMinus; anchors.fill: parent; onClicked: { dialog.updateQty(modelData.id, -1); dialog.selectedLineId = modelData.id } }
                                                }

                                                Rectangle {
                                                    width: Math.round(52 * dialog.uiScale); height: Math.round(36 * dialog.uiScale)
                                                    color: mPlus.pressed ? "#f0f0f0" : "white"; radius: 4; border.width: 1; border.color: "#d9d9d9"
                                                    Text { anchors.centerIn: parent; text: "+"; font.bold: true; font.pixelSize: Math.round(22 * dialog.uiScale); color: "#333" }
                                                    MouseArea { id: mPlus; anchors.fill: parent; onClicked: { dialog.updateQty(modelData.id, 1); dialog.selectedLineId = modelData.id } }
                                                }

                                                Rectangle {
                                                    width: Math.round(64 * dialog.uiScale); height: Math.round(36 * dialog.uiScale)
                                                    color: mRemove.pressed ? "#f0f0f0" : "white"; radius: 4; border.width: 1; border.color: "#d9d9d9"
                                                    AppText { anchors.centerIn: parent; text: "Xoá"; font.pixelSize: Math.round(13 * dialog.uiScale); color: "#e11d48" }
                                                    MouseArea {
                                                        id: mRemove
                                                        anchors.fill: parent
                                                        onClicked: {
                                                            var newCart = dialog.cart.slice();
                                                            newCart.splice(index, 1);
                                                            dialog.cart = newCart;
                                                            dialog.selectedLineId = "";
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        
                        // Tổng cộng Background
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: Math.round(65 * dialog.uiScale)
                            color: "transparent"
                            
                            // Không cần bo tròn riêng biệt nữa vì nền trong suốt sẽ ăn theo nền chung
                            radius: 16
                            
                            Rectangle {
                                anchors.top: parent.top; width: parent.width; height: 1; color: "#E2E8F0"
                            }
                            
                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: Math.round(20 * dialog.uiScale)
                                AppText { text: "TỔNG CỘNG"; color: "#172339"; font.bold: true; font.pixelSize: Math.round(16 * dialog.uiScale) }
                                Item { Layout.fillWidth: true }
                                AppText { 
                                    text: dialog.formatMoney(dialog.calculateTotal())
                                    color: "#172339" 
                                    font.bold: true
                                    font.pixelSize: Math.round(20 * dialog.uiScale)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    OrderHistoryDialog {
        id: orderHistoryDialog
    }
}

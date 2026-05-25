import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import QtQuick.Controls.Material 2.15
import QtQuick.Window 6
import "../components"

Item {
    id: page
    property string routeName: "activation"

    readonly property int lm: Math.round(279 * win.uiScale)
    readonly property int rm: Math.round(281 * win.uiScale)

    readonly property int titleFont: Math.round(72 * win.uiScale)
    readonly property int subTitleFont: Math.round(36 * win.uiScale)
    readonly property int descFont: Math.round(30 * win.uiScale)

    readonly property int btnW: Math.round(760 * win.uiScale)
    readonly property int btnH: Math.round(88 * win.uiScale)
    readonly property int btnFont: Math.round(30 * win.uiScale)

    readonly property int footerFont: Math.round(26 * win.uiScale)

    Connections {
        target: DeviceActivationService

        function onActivationFinished(success, deviceCode, tableId, areaId, message, tableName) {
            content.activating = false
            content.activationError = ""

            console.log("[Activation] Success! Code:", deviceCode, "Table:", tableId, "Area:", areaId, "TableName:", tableName)

            // Save activation with device_id and table_name
            try {
                var deviceId = DeviceActivationService.getDeviceId()
                DeviceSettings.saveActivation(deviceCode, tableId, areaId, deviceId, tableName || "")
                console.log("[Activation] Saved activation data with tableName:", tableName)
            } catch(e) {
                console.log("[Activation] Error saving activation:", e)
            }

            try { activateDialog.close() } catch(_) {}

            // Get window reference
            const winRef = page.Window.window

            // Reset disconnected flag so status checks work again
            if (winRef) {
                winRef._deviceDisconnected = false
                console.log("[Activation] Reset _deviceDisconnected flag")
            }

            // Navigate to HomePage - replace stack since it was cleared on startup
            const stackView = page.StackView.view
            if (stackView) {
                stackView.clear()
                stackView.push(Qt.resolvedUrl("HomePage.qml"), {})
                console.log("[Activation] Navigated to HomePage")
            }

            // Start periodic status check - use 'win' directly (root ApplicationWindow id)
            console.log("[Activation] Attempting to start timer...")
            console.log("[Activation] winRef:", winRef, "win:", typeof win !== 'undefined' ? win : 'undefined')

            // Try using 'win' directly (the ApplicationWindow id)
            if (typeof win !== 'undefined' && win.deviceStatusTimer) {
                win.deviceStatusTimer.start()
                console.log("[Activation] Timer started via 'win', running:", win.deviceStatusTimer.running)
            } else if (winRef && winRef.deviceStatusTimer) {
                winRef.deviceStatusTimer.start()
                console.log("[Activation] Timer started via winRef, running:", winRef.deviceStatusTimer.running)
            } else {
                console.log("[Activation] WARNING: Could not find deviceStatusTimer!")
                console.log("[Activation] winRef.deviceStatusTimer:", winRef ? winRef.deviceStatusTimer : 'winRef is null')
            }
        }

        function onActivationFailed(errorMessage) {
            content.activating = false
            content.activationError = errorMessage || "Kích hoạt thất bại"
        }
    }

    Rectangle {
        anchors.fill: parent
        color: "#FFFFFF"
    }

    Item {
        id: content
        anchors.fill: parent

        property bool activating: false
        property string activationError: ""

        Column {
            id: col
            anchors.centerIn: parent
            anchors.verticalCenterOffset: -Math.round(30 * win.uiScale)
            spacing: Math.round(22 * win.uiScale)

            Item {
                width: Math.round(820 * win.uiScale)
                height: Math.round(120 * win.uiScale)
                anchors.horizontalCenter: parent.horizontalCenter

                Image {
                    anchors.centerIn: parent
                    source: "../../assets/logo.png"
                    fillMode: Image.PreserveAspectFit
                    smooth: true
                    antialiasing: true
                    height: parent.height
                    sourceSize.height: Math.max(1, Math.round(height * Screen.devicePixelRatio))
                }

                AppText {
                    anchors.centerIn: parent
                    visible: false
                    text: "POOLARENA.VN"
                    color: "#111111"
                    font.pixelSize: Math.round(56 * win.uiScale)
                    font.bold: true
                }
            }

            AppText {
                text: "DIGITAL SCOREBOARD"
                color: "#111111"
                font.pixelSize: page.titleFont
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                width: Math.round(1200 * win.uiScale)
                wrapMode: Text.NoWrap
            }

            AppText {
                text: "Dễ sử dụng - Tính năng vượt trội - Vận hành ổn định"
                color: "#111111"
                font.pixelSize: page.descFont
                font.weight: Font.Medium
                horizontalAlignment: Text.AlignHCenter
                width: Math.round(1200 * win.uiScale)
                wrapMode: Text.WordWrap
            }

            Item { width: 1; height: Math.round(90 * win.uiScale) }

            Button {
                id: activateBtn
                width: page.btnW
                height: page.btnH
                anchors.horizontalCenter: parent.horizontalCenter
                text: "Kích hoạt bằng mã thiết bị"
                font.pixelSize: page.btnFont
                font.bold: true

                background: Rectangle {
                    radius: Math.round(8 * win.uiScale)
                    color: activateBtn.down ? "#E6ECFF" : "#FFFFFF"
                    border.width: Math.max(1, Math.round(2 * win.uiScale))
                    border.color: "#2F6BFF"
                }

                contentItem: Text {
                    text: activateBtn.text
                    color: "#2F6BFF"
                    font.pixelSize: activateBtn.font.pixelSize
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    elide: Text.ElideRight
                }

                onClicked: activateDialog.open()
            }
        }

        DialogShell {
            id: activateDialog
            modal: true
            dim: true
            closePolicy: Popup.CloseOnEscape
            width: Math.min(Math.round(820 * win.uiScale), Math.round(content.width * 0.92))

            property string deviceCode: ""

            titleText: "Nhập mã thiết bị"
            cancelText: "Hủy"
            confirmText: content.activating ? "Đang xử lý..." : "Kích hoạt"
            confirmEnabled: !content.activating && deviceCode.length === 6
            avoidKeyboard: true
            keyboardMargin: Math.round(16 * win.uiScale)
            x: Math.round((win.width - width) / 2)

            onConfirmed: {
                content.activating = true
                content.activationError = ""
                try {
                    DeviceActivationService.verifyDeviceCode(deviceCode)
                } catch(err) {
                    content.activating = false
                    content.activationError = "Lỗi: " + String(err)
                }
            }
            onCancelled: { /*nothing*/ }

            onOpened: {
                deviceCode = ""
                content.activating = false
                content.activationError = ""
                Qt.callLater(function() {
                    try { code0.forceActiveFocus() } catch(_) {}
                })
            }

            background: Rectangle {
                radius: Math.round(14 * win.uiScale)
                color: "#FFFFFF"
                border.width: Math.max(1, Math.round(1 * win.uiScale))
                border.color: "#E5E7EB"
            }

            body: Column {
                width: parent.width
                spacing: Math.round(18 * win.uiScale)
                padding: Math.round(24 * win.uiScale)

                AppText {
                    text: "Nhập mã thiết bị"
                    color: "#111111"
                    font.pixelSize: Math.round(34 * win.uiScale)
                    font.bold: true
                }

                AppText {
                    text: "Vui lòng nhập mã 6 ký tự hiển thị trong Thiết lập khu vực (bàn)."
                    color: "#4B5563"
                    font.pixelSize: Math.round(22 * win.uiScale)
                    wrapMode: Text.WordWrap
                    width: parent.width
                }

                Row {
                    id: codeRow
                    anchors.horizontalCenter: parent.horizontalCenter
                    spacing: Math.round(12 * win.uiScale)

                    function applyChar(tf, s) {
                        if (!tf) return
                        var c = sanitizeChar(s)
                        if (c !== tf.text) tf.text = c
                        updateCode()
                        if (c && c.length) focusNext(tf)
                    }

                    function handleKey(tf, ev) {
                        if (!tf || !ev) return
                        if (ev.key === Qt.Key_Backspace) {
                            if (!tf.text || tf.text.length === 0) {
                                focusPrev(tf)
                                ev.accepted = true
                            }
                            return
                        }
                        if (ev.text && ev.text.length > 0) {
                            applyChar(tf, ev.text)
                            ev.accepted = true
                        }
                    }

                    function makeField(bg) {
                        return {
                            width: Math.round(70 * win.uiScale),
                            height: Math.round(86 * win.uiScale),
                            horizontalAlignment: TextInput.AlignHCenter,
                            verticalAlignment: TextInput.AlignVCenter,
                            font: Qt.font({ pixelSize: Math.round(34 * win.uiScale), bold: true }),
                            inputMethodHints: Qt.ImhUppercaseOnly | Qt.ImhNoPredictiveText | Qt.ImhPreferUppercase,
                            maximumLength: 1,
                            background: bg
                        }
                    }

                    function sanitizeChar(s) {
                        if (!s || s.length === 0) return ""
                        var c = String(s).toUpperCase()
                        c = c.replace(/[^A-Z0-9]/g, "")
                        return c.length ? c[0] : ""
                    }

                    function updateCode() {
                        activateDialog.deviceCode =
                            (code0.text + code1.text + code2.text + code3.text + code4.text + code5.text)
                                .toUpperCase()
                    }

                    function focusPrev(tf) {
                        if (!tf) return
                        if (tf === code1) code0.forceActiveFocus()
                        else if (tf === code2) code1.forceActiveFocus()
                        else if (tf === code3) code2.forceActiveFocus()
                        else if (tf === code4) code3.forceActiveFocus()
                        else if (tf === code5) code4.forceActiveFocus()
                    }

                    function focusNext(tf) {
                        if (!tf) return
                        if (tf === code0) code1.forceActiveFocus()
                        else if (tf === code1) code2.forceActiveFocus()
                        else if (tf === code2) code3.forceActiveFocus()
                        else if (tf === code3) code4.forceActiveFocus()
                        else if (tf === code4) code5.forceActiveFocus()
                    }

                    // ========== 6 TextField cố định cho mã thiết bị ==========
                    TextField {
                        id: code0
                        color: "#111111"
                        selectionColor: "#D1FAE5"
                        selectedTextColor: "#111111"
                        width: Math.round(70 * win.uiScale)
                        height: Math.round(86 * win.uiScale)
                        horizontalAlignment: TextInput.AlignHCenter
                        verticalAlignment: TextInput.AlignVCenter
                        font.family: (typeof win !== "undefined" && win) ? win.appFontFamily : "Montserrat"
                        font.pixelSize: Math.round(34 * win.uiScale)
                        font.bold: true
                        inputMethodHints: Qt.ImhUppercaseOnly | Qt.ImhNoPredictiveText | Qt.ImhPreferUppercase
                        maximumLength: 1
                        background: Rectangle {
                            radius: Math.round(10 * win.uiScale)
                            color: "#FFFFFF"
                            border.width: Math.max(1, Math.round(1 * win.uiScale))
                            border.color: parent.activeFocus ? "#10B981" : "#D1D5DB"
                        }
                        onTextChanged: codeRow.applyChar(this, text)
                        Keys.onPressed: function(ev) { codeRow.handleKey(this, ev) }
                    }
                    TextField { id: code1; color: "#111111"; selectionColor: "#D1FAE5"; selectedTextColor: "#111111"; onTextChanged: codeRow.applyChar(this, text); Keys.onPressed: function(ev){codeRow.handleKey(this, ev)}
                        width: code0.width; height: code0.height; horizontalAlignment: code0.horizontalAlignment; verticalAlignment: code0.verticalAlignment;
                        font.family: code0.font.family; font.pixelSize: code0.font.pixelSize; font.bold: true; inputMethodHints: code0.inputMethodHints; maximumLength: 1;
                        background: Rectangle { radius: Math.round(10 * win.uiScale); color: "#FFFFFF"; border.width: Math.max(1, Math.round(1 * win.uiScale)); border.color: parent.activeFocus ? "#10B981" : "#D1D5DB" }
                    }
                    TextField { id: code2; color: "#111111"; selectionColor: "#D1FAE5"; selectedTextColor: "#111111"; onTextChanged: codeRow.applyChar(this, text); Keys.onPressed: function(ev){codeRow.handleKey(this, ev)}
                        width: code0.width; height: code0.height; horizontalAlignment: code0.horizontalAlignment; verticalAlignment: code0.verticalAlignment;
                        font.family: code0.font.family; font.pixelSize: code0.font.pixelSize; font.bold: true; inputMethodHints: code0.inputMethodHints; maximumLength: 1;
                        background: Rectangle { radius: Math.round(10 * win.uiScale); color: "#FFFFFF"; border.width: Math.max(1, Math.round(1 * win.uiScale)); border.color: parent.activeFocus ? "#10B981" : "#D1D5DB" }
                    }
                    TextField { id: code3; color: "#111111"; selectionColor: "#D1FAE5"; selectedTextColor: "#111111"; onTextChanged: codeRow.applyChar(this, text); Keys.onPressed: function(ev){codeRow.handleKey(this, ev)}
                        width: code0.width; height: code0.height; horizontalAlignment: code0.horizontalAlignment; verticalAlignment: code0.verticalAlignment;
                        font.family: code0.font.family; font.pixelSize: code0.font.pixelSize; font.bold: true; inputMethodHints: code0.inputMethodHints; maximumLength: 1;
                        background: Rectangle { radius: Math.round(10 * win.uiScale); color: "#FFFFFF"; border.width: Math.max(1, Math.round(1 * win.uiScale)); border.color: parent.activeFocus ? "#10B981" : "#D1D5DB" }
                    }
                    TextField { id: code4; color: "#111111"; selectionColor: "#D1FAE5"; selectedTextColor: "#111111"; onTextChanged: codeRow.applyChar(this, text); Keys.onPressed: function(ev){codeRow.handleKey(this, ev)}
                        width: code0.width; height: code0.height; horizontalAlignment: code0.horizontalAlignment; verticalAlignment: code0.verticalAlignment;
                        font.family: code0.font.family; font.pixelSize: code0.font.pixelSize; font.bold: true; inputMethodHints: code0.inputMethodHints; maximumLength: 1;
                        background: Rectangle { radius: Math.round(10 * win.uiScale); color: "#FFFFFF"; border.width: Math.max(1, Math.round(1 * win.uiScale)); border.color: parent.activeFocus ? "#10B981" : "#D1D5DB" }
                    }
                    TextField { id: code5; color: "#111111"; selectionColor: "#D1FAE5"; selectedTextColor: "#111111"; onTextChanged: codeRow.applyChar(this, text); Keys.onPressed: function(ev){codeRow.handleKey(this, ev)}
                        width: code0.width; height: code0.height; horizontalAlignment: code0.horizontalAlignment; verticalAlignment: code0.verticalAlignment;
                        font.pixelSize: code0.font.pixelSize; font.bold: true; inputMethodHints: code0.inputMethodHints; maximumLength: 1;
                        background: Rectangle { radius: Math.round(10 * win.uiScale); color: "#FFFFFF"; border.width: Math.max(1, Math.round(1 * win.uiScale)); border.color: parent.activeFocus ? "#10B981" : "#D1D5DB" }
                    }
                }

                AppText {
                    visible: activateDialog.deviceCode.length > 0 && activateDialog.deviceCode.length < 6
                    text: "Mã phải đủ 6 ký tự"
                    color: "#DC2626"
                    font.pixelSize: Math.round(20 * win.uiScale)
                }

                AppText {
                    visible: content.activationError && content.activationError.length > 0
                    text: content.activationError
                    color: "#DC2626"
                    font.pixelSize: Math.round(20 * win.uiScale)
                    wrapMode: Text.WordWrap
                    width: parent.width
                }

                            }
        }

        Row {
            id: footer
            spacing: Math.round(180 * win.uiScale)
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
            anchors.bottomMargin: Math.round(54 * win.uiScale)

            AppText {
                text: "Website: www.poolarena.vn"
                color: "#111111"
                font.pixelSize: page.footerFont
                font.weight: Font.Medium
                verticalAlignment: Text.AlignVCenter
            }

            AppText {
                text: "Hotline: 0364756638"
                color: "#111111"
                font.pixelSize: page.footerFont
                font.weight: Font.Medium
                verticalAlignment: Text.AlignVCenter
            }
        }
    }
}

// qml/components/TableFeePaymentDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import "."

DialogShell {
    id: root

    titleText: "Thanh toán tiền bàn"
    showCloseButton: false
    confirmText: ""
    cancelText: "Hủy"
    contentMargins: 30

    property string qrUrl: ""
    property int amount: 0
    property string paymentCode: ""
    property int matchId: 0
    property string startTime: ""
    property string endTime: ""
    property int elapsedSec: 0

    function fmtElapsed(sec) {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        function pad(n) { return (n < 10 ? "0" : "") + n }
        return pad(h) + ":" + pad(m) + ":" + pad(s)
    }

    signal paymentConfirmed()

    onCancelled: {
        if (typeof TournamentService !== "undefined" && root.paymentCode !== "" && root.matchId > 0)
            TournamentService.cancelTableFeePayment(root.matchId, root.paymentCode)
        root.close()
    }

    // Poll backend mỗi 3 giây khi dialog đang mở
    Timer {
        id: pollTimer
        interval: 3000
        repeat: true
        running: root.visible && root.paymentCode !== ""
        onTriggered: {
            if (typeof TournamentService !== "undefined" && root.paymentCode !== "")
                TournamentService.checkTableFeePayment(root.matchId, root.paymentCode)
        }
    }

    Connections {
        target: typeof TournamentService !== "undefined" ? TournamentService : null
        ignoreUnknownSignals: true
        function onTableFeePaymentStatus(paid) {
            if (paid) {
                pollTimer.stop()
                root.paymentConfirmed()
                root.close()
            }
        }
    }

    ColumnLayout {
        width: parent ? parent.width : 560
        spacing: Math.round(20 * root.uiScale)

        AppText {
            text: "Số tiền thanh toán"
            font.pixelSize: Math.round(18 * root.uiScale)
            color: "#555"
            Layout.alignment: Qt.AlignHCenter
        }

        AppText {
            text: root.amount > 0
                ? root.amount.toLocaleString("vi-VN") + " đ"
                : "---"
            font.pixelSize: Math.round(48 * root.uiScale)
            font.bold: true
            color: "#172339"
            Layout.alignment: Qt.AlignHCenter
        }

        // Time info row
        Rectangle {
            Layout.fillWidth: true
            height: timeRow.implicitHeight + Math.round(24 * root.uiScale)
            color: "#f7f8fa"
            radius: Math.round(10 * root.uiScale)
            visible: root.startTime !== "" || root.endTime !== "" || root.elapsedSec > 0

            Row {
                id: timeRow
                anchors.centerIn: parent
                spacing: Math.round(32 * root.uiScale)

                Column {
                    spacing: Math.round(4 * root.uiScale)
                    AppText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "Giờ vào"
                        font.pixelSize: Math.round(14 * root.uiScale)
                        color: "#888"
                    }
                    AppText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: root.startTime || "---"
                        font.pixelSize: Math.round(22 * root.uiScale)
                        font.bold: true
                        color: "#172339"
                    }
                }

                AppText {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "→"
                    font.pixelSize: Math.round(20 * root.uiScale)
                    color: "#aaa"
                }

                Column {
                    spacing: Math.round(4 * root.uiScale)
                    AppText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "Giờ ra"
                        font.pixelSize: Math.round(14 * root.uiScale)
                        color: "#888"
                    }
                    AppText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: root.endTime || "---"
                        font.pixelSize: Math.round(22 * root.uiScale)
                        font.bold: true
                        color: "#172339"
                    }
                }

                AppText {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "|"
                    font.pixelSize: Math.round(20 * root.uiScale)
                    color: "#ddd"
                }

                Column {
                    spacing: Math.round(4 * root.uiScale)
                    AppText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "Thời gian"
                        font.pixelSize: Math.round(14 * root.uiScale)
                        color: "#888"
                    }
                    AppText {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: root.elapsedSec > 0 ? root.fmtElapsed(root.elapsedSec) : "---"
                        font.pixelSize: Math.round(22 * root.uiScale)
                        font.bold: true
                        color: "#172339"
                    }
                }
            }
        }

        // VietQR image (URL đã là ảnh PNG trực tiếp)
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: Math.round(260 * root.uiScale)
            height: Math.round(260 * root.uiScale)
            color: "white"
            radius: 8
            border.color: "#e0e0e0"
            border.width: 1

            Image {
                id: qrImage
                anchors.fill: parent
                anchors.margins: 6
                source: root.qrUrl
                fillMode: Image.PreserveAspectFit
                cache: false
                asynchronous: true
            }

            // Loading indicator
            Rectangle {
                anchors.fill: parent
                color: "#f5f5f5"
                radius: 8
                visible: qrImage.status === Image.Loading

                BusyIndicator {
                    anchors.centerIn: parent
                    running: true
                    width: Math.round(36 * root.uiScale)
                    height: Math.round(36 * root.uiScale)
                }
            }
        }

        // Waiting indicator
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: Math.round(8 * root.uiScale)

            BusyIndicator {
                running: root.visible
                width: Math.round(20 * root.uiScale)
                height: Math.round(20 * root.uiScale)
            }

            AppText {
                text: "Đang chờ xác nhận thanh toán..."
                font.pixelSize: Math.round(16 * root.uiScale)
                color: "#888"
            }
        }
    }
}

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

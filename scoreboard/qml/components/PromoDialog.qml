// components/PromoDialog.qml
// Dialog khuyến mãi - hiển thị ảnh carousel cuộn
import QtQuick 6
import QtQuick.Controls 6
import Qt5Compat.GraphicalEffects
import "."

DialogShell {
    id: dlg

    titleText:   (typeof win !== "undefined" && win) ? win.tr("promo_dialog_title") : "KHUYẾN MÃI"
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_close")       : "Đóng"
    confirmText: ""

    // Danh sách URL ảnh
    property var promoImages: []

    // Kích thước ảnh
    readonly property int imgW: Math.round((dlg.dialogW - 2 * dlg.contentMargins) * 1)
    readonly property int imgH: Math.round(imgW * 1080 / 1920)  // tỉ lệ 16:9 (1920x1080)
    readonly property int imgGap: Math.round(10 * dlg.uiScale)
    readonly property int imgRadius: Math.round(12 * dlg.uiScale)

    // Indicator
    property int currentIndex: 0

    onCancelled: close()
    onOpened: {
        currentIndex = 0
        flickable.contentY = 0
    }

    body: Column {
        width: parent ? parent.width : dlg.imgW
        spacing: 0

        // Nếu không có ảnh
        Item {
            visible: dlg.promoImages.length === 0
            width: parent.width
            height: Math.round(200 * dlg.uiScale)

            Column {
                anchors.centerIn: parent
                spacing: Math.round(12 * dlg.uiScale)

                AppText {
                    text: "🎉"
                    font.pixelSize: Math.round(48 * dlg.uiScale)
                    horizontalAlignment: Text.AlignHCenter
                    anchors.horizontalCenter: parent.horizontalCenter
                }
                AppText {
                    text: (typeof win !== "undefined" && win) ? win.tr("promo_empty") : "Chưa có khuyến mãi nào"
                    color: "#65708a"
                    font.pixelSize: Math.round(22 * dlg.uiScale)
                    horizontalAlignment: Text.AlignHCenter
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }
        }

        // === Flickable ảnh cuộn dọc ===
        Flickable {
            id: flickable
            visible: dlg.promoImages.length > 0
            width: parent.width
            height: Math.min(
                dlg.imgH,   // hiển thị đúng 1 banner
                imgCol.implicitHeight
            )
            contentWidth: width
            contentHeight: imgCol.implicitHeight
            clip: true
            boundsBehavior: Flickable.StopAtBounds
            flickDeceleration: 3000

            Column {
                id: imgCol
                width: parent.width
                spacing: dlg.imgGap

                Repeater {
                    model: dlg.promoImages

                    Item {
                        width: imgCol.width
                        height: dlg.imgH

                        // Ảnh gốc
                        Image {
                            id: promoImg
                            anchors.fill: parent
                            source: modelData
                            fillMode: Image.PreserveAspectCrop
                            smooth: true
                            antialiasing: true
                            asynchronous: true
                            cache: true

                            // Bo góc bằng layer + OpacityMask
                            layer.enabled: true
                            layer.effect: OpacityMask {
                                maskSource: Rectangle {
                                    width: promoImg.width
                                    height: promoImg.height
                                    radius: dlg.imgRadius
                                }
                            }
                        }
                    }
                }
            }
        }

        // === Page indicator dots ===
        Row {
            visible: dlg.promoImages.length > 1
            anchors.horizontalCenter: parent.horizontalCenter
            topPadding: Math.round(12 * dlg.uiScale)
            bottomPadding: Math.round(4 * dlg.uiScale)
            spacing: Math.round(8 * dlg.uiScale)

            Repeater {
                model: dlg.promoImages.length

                Rectangle {
                    width: Math.round(8 * dlg.uiScale)
                    height: width
                    radius: width / 2
                    color: {
                        // Tính index hiện tại dựa trên vị trí scroll
                        var itemH = dlg.imgH + dlg.imgGap
                        var idx = Math.round(flickable.contentY / itemH)
                        return index === idx ? "#1976D2" : "#D0D0D0"
                    }

                    Behavior on color { ColorAnimation { duration: 150 } }
                }
            }
        }

        // Số lượng ảnh
        AppText {
            visible: dlg.promoImages.length > 1
            anchors.horizontalCenter: parent.horizontalCenter
            text: {
                var itemH = dlg.imgH + dlg.imgGap
                var idx = Math.min(Math.round(flickable.contentY / itemH) + 1, dlg.promoImages.length)
                return idx + " / " + dlg.promoImages.length
            }
            color: "#9E9E9E"
            font.pixelSize: Math.round(14 * dlg.uiScale)
        }

        // Hướng dẫn vuốt
        AppText {
            visible: dlg.promoImages.length > 1
            anchors.horizontalCenter: parent.horizontalCenter
            topPadding: Math.round(6 * dlg.uiScale)
            text: "↑ Vuốt lên để xem thêm khuyến mãi"
            color: "#AAAAAA"
            font.pixelSize: Math.round(16 * dlg.uiScale)
            font.italic: true
        }
    }
}

// qml/components/TournamentsDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import "."
import "../components"

DialogShell {
    id: root

    // ===== Tiêu đề =====
    titleText: (typeof win !== "undefined" && win) ? win.tr("tournament_title") : "ĐĂNG KÍ GIẢI ĐẤU"

    // ===== API riêng =====
    property string url: ""
    property url    qrSource: ""
    property int    size: 320

    confirmText: (typeof win !== "undefined" && win) ? win.tr("common_close") : "Đóng"
    cancelText:  ""

    // ==== BODY ====
    body: Column {
        id: bodyCol
        spacing: Math.round(16 * root.uiScale)
        width: parent.width

        // QR box
        Rectangle {
            id: qrBox
            width:  Math.round(root.size)
            height: Math.round(root.size)
            radius: Math.round(16 * root.uiScale)
            color: "#FFFFFF"
            border.color: "#E5E7EB"; border.width: 1
            anchors.horizontalCenter: parent.horizontalCenter
            clip: true

            RealShadow {
                anchors.fill: qrBox
                sourceItem: qrBox
                autoPad: true
                z: -1
            }

            Image {
                id: qrImg
                anchors.centerIn: parent
                width:  Math.round(root.size)
                height: Math.round(root.size)
                fillMode: Image.PreserveAspectFit
                asynchronous: true
                cache: false

                onStatusChanged: {
                    if (status === Image.Error && source.startsWith("https://") && root.url) {
                        qrImg.source = _makeHttpQr(root.url)
                    }
                }

                Rectangle {
                    visible: parent.source === ""
                    anchors.fill: parent
                    color: "#F9FAFB"
                    AppText {
                        anchors.centerIn: parent
                        text: (typeof win !== "undefined" && win) ? win.tr("tournament_no_qr") : "Chưa có URL / QR"
                        color: "#6B7280"
                        font.pixelSize: Math.round(18 * root.uiScale)
                        font.hintingPreference: Font.PreferFullHinting
                        renderType: Text.NativeRendering
                    }
                }
            }
        }

        // Caption 1
        AppText {
            anchors.horizontalCenter: parent.horizontalCenter
            text: (typeof win !== "undefined" && win) ? win.tr("tournament_caption") : "Quét mã QR để truy cập trang giải đấu"
            color: "#172339"
            font.pixelSize: Math.round(24 * root.uiScale)
            font.hintingPreference: Font.PreferFullHinting
            renderType: Text.NativeRendering
            horizontalAlignment: Text.AlignHCenter
            wrapMode: Text.WordWrap
        }

        // Caption 2
        AppText {
            anchors.horizontalCenter: parent.horizontalCenter
            text: (typeof win !== "undefined" && win) ? win.tr("tournament_caption_hint") : "(Hoặc truy cập theo đường link: Poolarena.vn)"
            color: "#172339"
            font.pixelSize: Math.round(18 * root.uiScale)
            font.italic: true
            font.hintingPreference: Font.PreferFullHinting
            renderType: Text.NativeRendering
            horizontalAlignment: Text.AlignHCenter
            wrapMode: Text.WordWrap
        }
    }

    // ==== Helper QR ====
    function _enc(s)        { try { return encodeURIComponent(s) } catch(e) { return s } }
    function _makeHttpsQr(u){ return "https://api.qrserver.com/v1/create-qr-code/?size=" + root.size + "x" + root.size + "&qzone=2&data=" + _enc(u) }
    function _makeHttpQr(u) { return "http://api.qrserver.com/v1/create-qr-code/?size="  + root.size + "x" + root.size + "&qzone=2&data=" + _enc(u) }
    function refreshQr() {
        if (root.qrSource && String(root.qrSource).length > 0)      qrImg.source = root.qrSource
        else if (root.url && root.url.length > 0)                    qrImg.source = _makeHttpsQr(root.url)
        else                                                         qrImg.source = ""
    }

    onConfirmed: root.close()
    function openWithUrl(u) { url = u || ""; open(); refreshQr() }
    onUrlChanged: refreshQr()
    Component.onCompleted: refreshQr()
}

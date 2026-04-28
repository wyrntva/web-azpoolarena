// qml/components/Poolarena.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import "../components"

DialogShell {
    id: root

    // ===== Tiêu đề (giống TournamentsDialog) =====
    titleText: (typeof win !== "undefined" && win) ? win.tr("info_title") : "THÔNG BÁO"

    // ===== API =====
    property string messageText: (typeof win !== "undefined" && win) ? win.tr("info_default_message") : "Coming soon"

    // Chỉ có 1 nút Đóng (như TournamentsDialog)
    confirmText: (typeof win !== "undefined" && win) ? win.tr("common_close") : "Đóng"
    cancelText:  ""

    // ===== BODY =====
    body: Column {
        spacing: Math.round(16 * root.uiScale)
        width: parent.width

        // Spacer nhỏ
        Item { width: 1; height: Math.round(8 * root.uiScale) }

        AppText {
            anchors.horizontalCenter: parent.horizontalCenter
            text: root.messageText
            color: "#172339"
            font.pixelSize: Math.round(24 * root.uiScale)
            font.hintingPreference: Font.PreferFullHinting
            renderType: Text.NativeRendering
            horizontalAlignment: Text.AlignHCenter
            wrapMode: Text.WordWrap
        }
    }

    // ===== Hành vi =====
    onConfirmed: root.close()

    // ===== Helper mở nhanh (giống phong cách openWithUrl(...) bên TournamentsDialog) =====
    function openWithMessage(msg) {
        root.messageText = msg || ""
        root.open()
    }
    function openWith(title, msg) {
        root.titleText   = title || root.titleText
        root.messageText = msg   || ""
        root.open()
    }
}

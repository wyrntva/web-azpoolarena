import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import QtQuick.Controls.Material
import "."

DialogShell {
    id: root

    property string message: (typeof win !== "undefined" && win) ? win.tr("confirm_generic_message") : "Bạn có chắc không?"
    signal accepted()
    signal rejected()

    onConfirmed: accepted()
    onCancelled: rejected() 

    function openWith(msg, ttl, okText, cancelTxt) {
        if (msg !== undefined)        root.message = msg
        if (ttl !== undefined)        root.titleText = ttl
        if (okText !== undefined)     root.confirmText = okText
        if (cancelTxt !== undefined)  root.cancelText = cancelTxt
        root.open()
    }

    AppText {
        width: parent ? parent.width : Math.round(root.dialogW - 2*root.contentMargins)
        text: root.message
        wrapMode: Text.WordWrap
        color: "#172339"
        font.pixelSize: root.contentFontSize
        font.hintingPreference: Font.PreferFullHinting
        renderType: Text.NativeRendering
        lineHeightMode: Text.ProportionalHeight
        lineHeight: 1.15
    }
}

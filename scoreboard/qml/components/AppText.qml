import QtQuick 6

Text {
    id: root

    property var windowRef: root.Window.window

    font.family: (windowRef && windowRef.appFontFamily)
                 ? windowRef.appFontFamily
                 : ""
    renderType: Text.NativeRendering
    horizontalAlignment: Text.AlignLeft
    verticalAlignment: Text.AlignVCenter
    wrapMode: Text.WordWrap
}

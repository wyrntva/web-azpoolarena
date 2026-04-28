import QtQuick 6
import QtQuick.Controls 6
import "."

DialogShell {
    id: root
    property alias model: list.model

    signal resetRequested()

    property string resetButtonText: {
        var label = (typeof win !== "undefined" && win) ? win.tr("history_reset") : ""
        if (!label || label === "history_reset")
            label = "Reset lịch sử"
        return label
    }

    titleText: (typeof win !== "undefined" && win) ? win.tr("history_title") : "LỊCH SỬ THAO TÁC"
    confirmText: (typeof win !== "undefined" && win) ? win.tr("history_close") : "Đóng"
    cancelText: ""

    fixedW: Math.round(700 * win.uiScale)
    minW:   Math.round(500 * win.uiScale)

    onConfirmed: close()
    onCancelled: close()

    Column {
        width: parent ? parent.width : root.dialogW
        spacing: Math.round(16 * win.uiScale)

        Rectangle {
            width: parent.width
            height: Math.round(420 * win.uiScale)
            radius: Math.round(12 * win.uiScale)
            color: "#F6F8FA"
            border.color: "#E1E4E8"

            ListView {
                id: list
                anchors.fill: parent
                clip: true

                delegate: Column {
                    width: list.width
                    spacing: 2
                    padding: Math.round(12 * win.uiScale)
                    Text { text: model.text; wrapMode: Text.WordWrap; font.pixelSize: Math.round(16 * win.uiScale); color: "#172339" }
                    Text { text: model.ts;   font.pixelSize: Math.round(13 * win.uiScale); color: "#6B7280" }
                }
            }
        }

        Item {
            width: parent.width
            height: Math.round(56 * win.uiScale)

            Button {
                id: resetBtn
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter
                text: root.resetButtonText
                font.pixelSize: Math.round(18 * win.uiScale)
                padding: Math.round(14 * win.uiScale)
                onClicked: root.resetRequested()
            }
        }
    }
}

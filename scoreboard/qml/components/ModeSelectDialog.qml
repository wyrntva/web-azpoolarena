// qml/components/ModeSelectDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Layouts 6
import "../components"

DialogShell {
    id: dlg

    fixedW: Math.round(830 * uiScale)
    minW:   Math.round(690 * uiScale)

    // Gán trực tiếp cho DialogShell
    titleText: (typeof win !== "undefined" && win) ? win.tr("mode_select_title") : "Chọn chế độ thi đấu"

    // API tiêu đề mỗi lựa chọn
    property string twoTitle:       (typeof win !== "undefined" && win) ? win.tr("mode_select_two") : "Hai cơ thủ"
    property string twoHint:        (typeof win !== "undefined" && win) ? win.tr("mode_select_two_desc") : "Thi đấu 1 vs 1"
    property string multiTitle:     (typeof win !== "undefined" && win) ? win.tr("mode_select_multi") : "Nhiều cơ thủ"
    property string multiHint:      (typeof win !== "undefined" && win) ? win.tr("mode_select_multi_desc") : "Theo dõi tối đa 5 cơ thủ"
    property string cardsTitle:     (typeof win !== "undefined" && win) ? win.tr("mode_select_cards") : "Bài lá"
    property string cardsHint:      (typeof win !== "undefined" && win) ? win.tr("mode_select_cards_desc") : "Quản lý điểm bằng bộ bài"
    property string quickTitle:     (typeof win !== "undefined" && win) ? win.tr("mode_select_quick") : "Nhiều cơ thủ"
    property string quickHint:      (typeof win !== "undefined" && win) ? win.tr("mode_select_quick_desc") : "Cộng điểm nhanh"

    property string descriptionText: (typeof win !== "undefined" && win) ? win.tr("mode_select_description") : "Chọn một chế độ, sau đó bấm Bắt đầu."

    // Hiển/ẩn
    property bool showTwo:         true
    property bool showMulti:       true
    property bool showCards:       true
    property bool showMultiQuick:  true

    // Footer
    confirmText: (typeof win !== "undefined" && win) ? win.tr("common_start") : "Bắt đầu"
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_cancel") : "Hủy"

    // Trạng thái & signal
    // "two" | "multi" | "cards" | "multiQuick" | ""
    property string selectedMode: ""
    signal modeSelected(string mode)
    signal selectTwo()
    signal selectMulti()
    signal selectCards()
    signal selectMultiQuick()

    // Style
    readonly property color _brand:        "#172339"
    readonly property int   _cardH:        Math.round(96 * uiScale)
    readonly property int   _cardR:        Math.round(32  * uiScale)
    readonly property int   _cardPad:      Math.round(16  * uiScale)
    readonly property int   _gap:          Math.round(16  * uiScale)
    readonly property int   _titlePx:      Math.round(32  * uiScale)

    // ===== BODY =====
    body: Column {
        id: bodyCol
        width: parent.width
        spacing: dlg._gap

        AppText {
            text: dlg.descriptionText
            color: "#172339"
            font.italic: true
            font.pixelSize: Math.round(18 * dlg.uiScale)
            wrapMode: Text.WordWrap
        }

        Flow {
            id: cardFlow
            width: parent.width
            spacing: dlg._gap
            flow: Flow.LeftToRight

            readonly property real cellW: Math.max(0, (width - spacing) / 2)
            readonly property int buttonCount: (dlg.showTwo ? 1 : 0)
                                             + (dlg.showMulti ? 1 : 0)
                                             + (dlg.showCards ? 1 : 0)
                                             + (dlg.showMultiQuick ? 1 : 0)

            // ---- Card: Song đấu ----
            Rectangle {
                id: cardTwo
                visible: dlg.showTwo
                width: cardFlow.cellW
                height: dlg._cardH
                radius: dlg._cardR
                color:  (dlg.selectedMode === "two") ? dlg._brand : "transparent"
                border.color: dlg._brand
                border.width: 1
                antialiasing: true

                Behavior on color        { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }
                Behavior on border.color { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.selectedMode = "two"
                    onPressed:  cardTwo.scale = 0.995
                    onReleased: cardTwo.scale = 1.0
                    onCanceled: cardTwo.scale = 1.0
                }

                Column {
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.verticalCenter: parent.verticalCenter
                    width: Math.max(0, parent.width - dlg._cardPad * 2)
                    spacing: Math.round(6 * dlg.uiScale)

                    AppText {
                        text: dlg.twoTitle
                        font.pixelSize: dlg._titlePx
                        color: (dlg.selectedMode === "two") ? "#FFFFFF" : dlg._brand
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        width: parent.width
                    }
                    AppText {
                        text: "(" + dlg.twoHint + ")"
                        font.pixelSize: Math.max(12, Math.round(dlg._titlePx * 0.7))
                        font.italic: true
                        color: (dlg.selectedMode === "two") ? "#F0F4FF" : "#4A5368"
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        visible: text.length > 2
                        width: parent.width
                    }
                }
            }

            // ---- Card: Nhiều cơ thủ ----
            Rectangle {
                id: cardMulti
                visible: dlg.showMulti
                width: cardFlow.cellW
                height: dlg._cardH
                radius: dlg._cardR
                color:  (dlg.selectedMode === "multi") ? dlg._brand : "transparent"
                border.color: dlg._brand
                border.width: 1
                antialiasing: true

                Behavior on color        { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }
                Behavior on border.color { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.selectedMode = "multi"
                    onPressed:  cardMulti.scale = 0.995
                    onReleased: cardMulti.scale = 1.0
                    onCanceled: cardMulti.scale = 1.0
                }

                Column {
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.verticalCenter: parent.verticalCenter
                    width: Math.max(0, parent.width - dlg._cardPad * 2)
                    spacing: Math.round(6 * dlg.uiScale)

                    AppText {
                        text: dlg.multiTitle
                        font.pixelSize: dlg._titlePx
                        color: (dlg.selectedMode === "multi") ? "#FFFFFF" : dlg._brand
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        width: parent.width
                    }
                    AppText {
                        text: "(" + dlg.multiHint + ")"
                        font.pixelSize: Math.max(12, Math.round(dlg._titlePx * 0.7))
                        font.italic: true
                        color: (dlg.selectedMode === "multi") ? "#F0F4FF" : "#4A5368"
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        visible: text.length > 2
                        width: parent.width
                    }
                }
            }

            // ---- Card: Bài lá ----
            Rectangle {
                id: cardCards
                visible: dlg.showCards
                width: cardFlow.cellW
                height: dlg._cardH
                radius: dlg._cardR
                color:  (dlg.selectedMode === "cards") ? dlg._brand : "transparent"
                border.color: dlg._brand
                border.width: 1
                antialiasing: true

                Behavior on color        { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }
                Behavior on border.color { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.selectedMode = "cards"
                    onPressed:  cardCards.scale = 0.995
                    onReleased: cardCards.scale = 1.0
                    onCanceled: cardCards.scale = 1.0
                }

                Column {
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.verticalCenter: parent.verticalCenter
                    width: Math.max(0, parent.width - dlg._cardPad * 2)
                    spacing: Math.round(6 * dlg.uiScale)

                    AppText {
                        text: dlg.cardsTitle
                        font.pixelSize: dlg._titlePx
                        color: (dlg.selectedMode === "cards") ? "#FFFFFF" : dlg._brand
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        width: parent.width
                    }
                    AppText {
                        text: "(" + dlg.cardsHint + ")"
                        font.pixelSize: Math.max(12, Math.round(dlg._titlePx * 0.7))
                        font.italic: true
                        color: (dlg.selectedMode === "cards") ? "#F0F4FF" : "#4A5368"
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        visible: text.length > 2
                        width: parent.width
                    }
                }
            }

            // ---- Card: Nhiều cơ thủ (quick add) ----
            Rectangle {
                id: cardMultiQuick
                visible: dlg.showMultiQuick
                width: cardFlow.cellW
                height: dlg._cardH
                radius: dlg._cardR
                color:  (dlg.selectedMode === "multiQuick") ? dlg._brand : "transparent"
                border.color: dlg._brand
                border.width: 1
                antialiasing: true

                Behavior on color        { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }
                Behavior on border.color { ColorAnimation { duration: 120; easing.type: Easing.OutCubic } }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: dlg.selectedMode = "multiQuick"
                    onPressed:  cardMultiQuick.scale = 0.995
                    onReleased: cardMultiQuick.scale = 1.0
                    onCanceled: cardMultiQuick.scale = 1.0
                }

                Column {
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.verticalCenter: parent.verticalCenter
                    width: Math.max(0, parent.width - dlg._cardPad * 2)
                    spacing: Math.round(6 * dlg.uiScale)

                    AppText {
                        text: dlg.quickTitle
                        font.pixelSize: dlg._titlePx
                        color: (dlg.selectedMode === "multiQuick") ? "#FFFFFF" : dlg._brand
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        width: parent.width
                    }
                    AppText {
                        text: "(" + dlg.quickHint + ")"
                        font.pixelSize: Math.max(12, Math.round(dlg._titlePx * 0.7))
                        font.italic: true
                        color: (dlg.selectedMode === "multiQuick") ? "#F0F4FF" : "#4A5368"
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                        visible: text.length > 2
                        width: parent.width
                    }
                }
            }

            // Placeholder để căn đều khi số button lẻ
            Item {
                visible: cardFlow.buttonCount % 2 === 1
                width: cardFlow.cellW
                height: dlg._cardH
            }
        }
    }

    // ===== Footer actions =====
    onConfirmed: {
        if (dlg.selectedMode === "two") {
            selectTwo();         modeSelected("two");         close()
        } else if (dlg.selectedMode === "multi") {
            selectMulti();       modeSelected("multi");       close()
        } else if (dlg.selectedMode === "cards") {
            selectCards();       modeSelected("cards");       close()
        } else if (dlg.selectedMode === "multiQuick") {
            selectMultiQuick();  modeSelected("multiQuick");  close()
        } else {
            console.log("[ModeSelectDialog] Chưa chọn chế độ.")
        }
    }
    onCancelled: close()

    function openWith(defaultMode) {
        switch (defaultMode) {
        case "two":
        case "multi":
        case "cards":
        case "multiQuick":
            dlg.selectedMode = defaultMode
            break
        default:
            dlg.selectedMode = ""
        }
        dlg.open()
    }
}

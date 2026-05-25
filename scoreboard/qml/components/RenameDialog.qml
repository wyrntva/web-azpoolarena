// qml/components/RenameDialog.qml
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Window 6
import "../utils/Telex.js" as Telex
import "."

DialogShell {
    id: dlg

    avoidKeyboard: true
    keyboardMargin: Math.round(20 * dlg.uiScale)

    initialFocusItem: nameInput

    // ===== API =====
    property string oldName: ""
    property string target:  ""                 // "left"/"right" (optional)
    signal accepted(string newName)

    // ===== Font & Input size =====
    property int  labelFontSize:        0
    property int  inputFontSize:        0
    property int  placeholderFontSize:  0
    property int  inputHeight:          Math.round(56 * dlg.uiScale)
    property real contentSpacing:       Math.round(20 * dlg.uiScale)
    property int  maxLen:               15

    // ===== Tiêu đề / nút =====
    titleText:   (typeof win !== "undefined" && win) ? win.tr("rename_title") : "ĐỔI TÊN NGƯỜI CHƠI"
    confirmText: (typeof win !== "undefined" && win) ? win.tr("rename_apply") : "Áp dụng"
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("rename_cancel") : "Huỷ"

    // ===== Helpers =====
    function capFirstOnlyStr(s) {
        if (!s) return s
        if (s.normalize) s = s.normalize("NFC")
        var i = 0; while (i < s.length && /\s/.test(s[i])) i++
        if (i >= s.length) return s
        var first = s[i]
        var firstUpper = first.toLocaleUpperCase ? first.toLocaleUpperCase("vi") : first.toUpperCase()
        return s.slice(0, i) + firstUpper + s.slice(i + 1)
    }

    function doConfirm() {
        var newName = (nameInput.text || "").trim()
        if (newName.length === 0) {
            nameInput.forceActiveFocus()
            nameInput.selectAll()
            Qt.inputMethod.show()
            return
        }
        newName = capFirstOnlyStr(newName)
        accepted(newName)
        close()
    }
    function doCancel() { close() }

    // ===== API mở dialog =====
    // openFor("left", currentName) hoặc openFor(currentName)
    function openFor(a, b) {
        if (arguments.length >= 2) { target = (a || ""); oldName = (b || "") }
        else { target = ""; oldName = (a || "") }
        nameInput.text = oldName
        open()
        Qt.callLater(function() {
            nameInput.forceActiveFocus()
            nameInput.selectAll()
            Qt.inputMethod.show()
        })
    }

    // Map nút của DialogShell
    onConfirmed: doConfirm()
    onCancelled: doCancel()

    // ===== Shortcuts (Enter/Esc ở phạm vi cửa sổ) =====
    Shortcut { sequences: ["Enter", "Return"]; context: Qt.WindowShortcut; onActivated: dlg.doConfirm() }
    Shortcut { sequences: ["Escape"];          context: Qt.WindowShortcut; onActivated: dlg.doCancel() }

    // ===== Nội dung =====
    Column {
        width: parent ? parent.width : Math.round(dlg.dialogW - 2*dlg.contentMargins)
        spacing: dlg.contentSpacing

        AppText {
            text: (typeof win !== "undefined" && win) ? win.tr("rename_prompt") : "Nhập tên mới:"
            color: "#172339"
            font.pixelSize: (dlg.labelFontSize > 0 ? dlg.labelFontSize : dlg.contentFontSize)
            font.hintingPreference: Font.PreferFullHinting
            renderType: Text.NativeRendering
            wrapMode: Text.WordWrap
            width: parent.width
        }

        Rectangle {
            id: nameInputBox
            width: parent.width
            height: dlg.inputHeight
            radius: Math.round(10 * dlg.uiScale)
            color: "#2b3242"
            border.color: "#3c4456"; border.width: 1

            AppText {
                text: (typeof win !== "undefined" && win) ? win.tr("rename_placeholder") : "Tên người chơi…"
                color: "#8891a7"
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.leftMargin: Math.round(14 * dlg.uiScale)
                visible: nameInput.text.length === 0 && !nameInput.activeFocus
                font.pixelSize: (dlg.placeholderFontSize > 0 ? dlg.placeholderFontSize : dlg.contentFontSize)
                font.hintingPreference: Font.PreferFullHinting
                renderType: Text.NativeRendering
                wrapMode: Text.NoWrap
                z: 1
                MouseArea { anchors.fill: parent; onClicked: nameInput.forceActiveFocus() }
            }

            TextInput {
                id: nameInput
                anchors.fill: parent
                anchors.leftMargin:  Math.round(14 * dlg.uiScale)
                anchors.rightMargin: Math.round(14 * dlg.uiScale)
                verticalAlignment: Text.AlignVCenter
                clip: true

                font.family: (typeof win !== "undefined" && win) ? win.appFontFamily : "Montserrat"
                font.pixelSize: (dlg.inputFontSize > 0 ? dlg.inputFontSize : dlg.contentFontSize)
                font.hintingPreference: Font.PreferFullHinting
                renderType: Text.NativeRendering
                color: "#EDEFF3"
                cursorVisible: true
                selectByMouse: true
                wrapMode: Text.NoWrap
                echoMode: TextInput.Normal
                inputMethodHints: Qt.ImhNone
                maximumLength: dlg.maxLen

                Keys.onReturnPressed: dlg.doConfirm()
                Keys.onEnterPressed:  dlg.doConfirm()
                Keys.onEscapePressed: dlg.doCancel()

                onActiveFocusChanged: if (activeFocus) Qt.inputMethod.show()

                onTextEdited: {
                    const res = Telex.process(text, cursorPosition)
                    if (res.text !== text) {
                        text = res.text
                        cursorPosition = Math.min(text.length, res.cursor)
                    } else if (res.cursor !== cursorPosition) {
                        cursorPosition = Math.min(text.length, res.cursor)
                    }

                    const t = dlg.capFirstOnlyStr(text)
                    if (t !== text) {
                        const cur = cursorPosition
                        text = t
                        cursorPosition = Math.min(text.length, cur)
                    }
                }
            }
        }
    }
}

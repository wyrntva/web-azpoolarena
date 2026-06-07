// Card điểm trong bảng tỉ số
import QtQuick 6
import QtQuick.Controls 6
import QtQuick.Shapes
import "."

Item {
    id: wrapper

    property string title: (typeof win !== "undefined" && win) ? win.tr("score_tile_default_title") : "Người chơi"
    property int    score: 0
    property int    raceTo: 9
    property color  bgColor: "#ffcd00"
    property string buttonPosition: "right"

    property int _prevScore: score
    signal clicked()
    signal rightClicked()
    signal editTitleRequested()

    // Debounce: chặn ghost touch / double-tap trên màn hình cảm ứng
    property bool _clickReady: true
    property int  clickCooldownMs: 400
    Timer {
        id: clickCooldown
        interval: wrapper.clickCooldownMs
        repeat: false
        onTriggered: wrapper._clickReady = true
    }

    property color titleStripColor: "#172339"
    property color titleStripTextColor: "white"
    property int   titleStripHeight: 48
    property real  titleStripRadius: 16
    property int   titleStripWidth: 0

    property int titleFontSize: 0
    property int editButtonSize: 20
    property bool showEditButton: true
    property real scoreFontSizeMultiplier: 0.50

    readonly property real _shadowScale: (typeof win !== "undefined" && win && win.uiScale) ? win.uiScale : 1
    readonly property real _shadowOffset: Math.max(4, Math.round(4 * _shadowScale))
    readonly property real _shadowBlur:   Math.max(6, Math.round(6 * _shadowScale))

    width: 300
    height: 200

    Rectangle {
        id: card
        anchors.fill: parent
        radius: 24
        color: bgColor
        clip: false

        property real shakeX: 0
        x: shakeX

        Item {
            id: titleStrip
            z: 10
            anchors.top: parent.top
            anchors.horizontalCenter: parent.horizontalCenter
            width: (wrapper.titleStripWidth > 0 ? wrapper.titleStripWidth : parent.width) + 50
            height: wrapper.titleStripHeight + 18

            Rectangle {
                id: baseRounded
                z: 1
                x: -wrapper.titleStripRadius
                y: 0
                width: titleStrip.width + wrapper.titleStripRadius * 2
                height: titleStrip.height
                radius: wrapper.titleStripRadius
                color: wrapper.titleStripColor
                antialiasing: true
            }

            Rectangle {
                id: topCover
                z: 2
                x: -wrapper.titleStripRadius
                y: 0
                width: titleStrip.width + wrapper.titleStripRadius * 2
                height: Math.max(0, titleStrip.height - wrapper.titleStripRadius)
                radius: 0
                color: wrapper.titleStripColor
                antialiasing: true
            }

            AppText {
                id: titleText
                z: 3
                text: wrapper.title
                color: wrapper.titleStripTextColor
                elide: Text.ElideRight
                wrapMode: Text.NoWrap
                fontSizeMode: Text.Fit
                minimumPixelSize: 12
                font.pixelSize: Math.max(20, titleStrip.width * 0.1)
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.leftMargin: 12
                anchors.rightMargin: wrapper.showEditButton ? wrapper.editButtonSize + 20 : 12
                horizontalAlignment: Text.AlignHCenter
            }

            ToolButton {
                id: editBtn
                visible: wrapper.showEditButton
                z: 3
                text: "✎"
                hoverEnabled: true
                focusPolicy: Qt.NoFocus
                activeFocusOnTab: false
                anchors.verticalCenter: parent.verticalCenter
                anchors.right: parent.right
                anchors.rightMargin: 12
                width: titleStrip.height * 0.8
                height: titleStrip.height * 0.8

                contentItem: Text {
                    text: editBtn.text
                    font.pixelSize: titleStrip.height * 0.5
                    color: editBtn.down ? "red" : (editBtn.hovered ? "yellow" : "white")
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    anchors.fill: parent
                }
                background: Rectangle { color: "transparent"; border.width: 0 }
                onClicked: wrapper.editTitleRequested()
            }
        }

        Label {
            id: scoreLabel
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.verticalCenter: parent.verticalCenter
            text: score.toString()
            color: "white"
            font.pixelSize: Math.round(Math.min(card.width, card.height) * wrapper.scoreFontSizeMultiplier)
            font.bold: true
            transform: Scale {
                id: scaleTf
                origin.x: scoreLabel.width/2
                origin.y: scoreLabel.height/2
                xScale: 1; yScale: 1
            }
        }

        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            acceptedButtons: Qt.LeftButton
            cursorShape: Qt.PointingHandCursor
            onClicked: {
                if (!wrapper._clickReady) return
                wrapper._clickReady = false
                clickCooldown.restart()
                wrapper.clicked()
            }
        }

        Shape {
            id: minusBtn
            z: 2
            width: 100; height: 100
            anchors.bottom: parent.bottom
            anchors.left:  buttonPosition === "left"  ? parent.left  : undefined
            anchors.right: buttonPosition === "right" ? parent.right : undefined
            antialiasing: true

            property real r: 24
            property bool hovered: false

            ShapePath {
                fillColor: minusBtn.hovered ? "#f2f2f2" : "#ffffff"

                PathSvg {
                    path: buttonPosition === "right"
                          ? ("M0,0 H" + minusBtn.width +
                             " V" + (minusBtn.height - minusBtn.r) +
                             " A" + minusBtn.r + "," + minusBtn.r + " 0 0 1 " +
                             (minusBtn.width - minusBtn.r) + "," + minusBtn.height +
                             " H0 V0 Z")
                          : ("M0,0 H" + minusBtn.width +
                             " V" + minusBtn.height +
                             " H" + minusBtn.r +
                             " A" + minusBtn.r + "," + minusBtn.r + " 0 0 1 0," +
                             (minusBtn.height - minusBtn.r) +
                             " V 0 Z")
                }
            }

            AppText {
                anchors.centerIn: parent
                text: "-1"
                font.pixelSize: 28
                color: "#172339"
            }

            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onEntered:  minusBtn.hovered = true
                onExited:   minusBtn.hovered = false
                onClicked: {
                    if (!wrapper._clickReady) return
                    wrapper._clickReady = false
                    clickCooldown.restart()
                    wrapper.rightClicked()
                }
            }
        }

        SequentialAnimation {
            id: pulseUp
            PropertyAnimation { target: scaleTf; property: "xScale"; to: 1.12; duration: 110; easing.type: Easing.OutCubic }
            PropertyAnimation { target: scaleTf; property: "yScale"; to: 1.12; duration: 0 }
            PauseAnimation { duration: 50 }
            PropertyAnimation { target: scaleTf; property: "xScale"; to: 1.0; duration: 140; easing.type: Easing.InOutCubic }
            PropertyAnimation { target: scaleTf; property: "yScale"; to: 1.0; duration: 0 }
        }

        SequentialAnimation {
            id: shake
            PropertyAnimation { target: card; property: "shakeX"; to: -8; duration: 50 }
            PropertyAnimation { target: card; property: "shakeX"; to:  8; duration: 80 }
            PropertyAnimation { target: card; property: "shakeX"; to: -5; duration: 60 }
            PropertyAnimation { target: card; property: "shakeX"; to:  0; duration: 70 }
        }
    }
    RealShadow {
        z: -1
        anchors.fill: wrapper
        sourceItem: card
        horizontalOffset: 0
        verticalOffset: _shadowOffset
        blurRadius: _shadowBlur
        autoPad: true
        shadowVisible: wrapper.visible
    }

    onScoreChanged: {
        if (score > _prevScore)      pulseUp.restart()
        else if (score < _prevScore) shake.restart()
        _prevScore = score
    }
}

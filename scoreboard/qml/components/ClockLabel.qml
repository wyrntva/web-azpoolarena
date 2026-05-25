// components/ClockLabel.qml
import QtQuick 6
import "."

Column {
    id: root

    property real uiScale: (typeof win !== "undefined" && win) ? win.uiScale : 1

    z: 999
    spacing: Math.round(2 * uiScale)

    property string _time: ""
    property string _date: ""

    function _update() {
        var now = new Date()
        var h = now.getHours()
        var m = now.getMinutes()
        var ampm = h >= 12 ? "PM" : "AM"
        h = h % 12
        if (h === 0) h = 12
        var mm = m < 10 ? "0" + m : String(m)
        _time = h + ":" + mm + " " + ampm
        _date = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear()
    }

    Component.onCompleted: _update()

    Timer {
        interval: 10000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: root._update()
    }

    AppText {
        text: root._time
        color: "#172339"
        opacity: 0.7
        font.pixelSize: Math.round(22 * root.uiScale)
        font.bold: false
        anchors.right: parent.right
    }

    AppText {
        text: root._date
        color: "#172339"
        opacity: 0.7
        font.pixelSize: Math.round(22 * root.uiScale)
        font.bold: false
        anchors.right: parent.right
    }
}

import QtQuick 6
import QtQuick.Effects 6

MultiEffect {
    id: effect

    // Public API
    property Item  sourceItem: null
    property bool  shadowVisible: true
    property color dropColor: "#0F000000"
    property real  blurRadius: 10    // px, will be normalised for MultiEffect
    property real  horizontalOffset: 0
    property real  verticalOffset: 6
    property bool  autoPad: true

    readonly property real _blurNorm: Math.max(0, Math.min(1, blurRadius / 40))

    source: sourceItem
    visible: shadowVisible && sourceItem !== null

    shadowEnabled: shadowVisible
    shadowColor: dropColor
    shadowBlur: _blurNorm
    shadowHorizontalOffset: horizontalOffset
    shadowVerticalOffset: verticalOffset
    autoPaddingEnabled: autoPad
}

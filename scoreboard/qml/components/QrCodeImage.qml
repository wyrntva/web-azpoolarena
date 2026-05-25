import QtQuick 6

Item {
    id: root

    property string targetUrl: ""
    property int qrSize: 150
    property color backgroundColor: "white"
    property bool loading: image.status === Image.Loading
    property bool error: image.status === Image.Error

    implicitWidth: qrSize
    implicitHeight: qrSize

    Rectangle {
        anchors.fill: parent
        color: root.backgroundColor
        radius: 8
        visible: root.targetUrl.length > 0

        Image {
            id: image
            anchors.fill: parent
            anchors.margins: 4
            fillMode: Image.PreserveAspectFit
            cache: false
            asynchronous: true

            source: root.targetUrl.length > 0
                ? ClipController.getQrUrl(root.targetUrl)
                : ""

            onStatusChanged: {
                if (status === Image.Error) {
                    console.log("QR code load error for:", root.targetUrl)
                }
            }
        }

        // Loading indicator
        Rectangle {
            anchors.fill: parent
            color: "#f0f0f0"
            radius: 8
            visible: root.loading

            AppText {
                anchors.centerIn: parent
                text: "..."
                color: "#666"
                font.pixelSize: 16
            }
        }

        // Error indicator
        Rectangle {
            anchors.fill: parent
            color: "#ffe0e0"
            radius: 8
            visible: root.error

            AppText {
                anchors.centerIn: parent
                text: "!"
                color: "#c00"
                font.pixelSize: 20
                font.bold: true
            }
        }
    }

    // Placeholder when no URL
    Rectangle {
        anchors.fill: parent
        color: "#f0f0f0"
        radius: 8
        visible: root.targetUrl.length === 0

        AppText {
            anchors.centerIn: parent
            text: "QR"
            color: "#999"
            font.pixelSize: 14
        }
    }
}

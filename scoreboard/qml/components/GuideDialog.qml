// components/GuideDialog.qml
// Hướng dẫn sử dụng bảng tỉ số cho nhiều trang (độc lập)
import QtQuick 6
import QtQuick.Controls 6
import "."

DialogShell {
    id: dlg

    // properties pageType: "score" | "multi" | "cards" | "quick" | "tournament"
    property string pageType: "score"

    property var guideData: {
        switch(pageType) {
            case "score": return [
                { title: "Đổi tên người chơi", text: "Nhấn vào <img src=\"../../assets/icon/pen-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> để đổi tên." },
                { title: "Tăng giảm điểm tỉ số", text: "Nhấn vào con số điểm trên thẻ để cộng 1 điểm, nhấn vào -1 để giảm 1 điểm." },
                { title: "Sử dụng bảng điều khiển ở giữa", text: "• Reset tỉ số: Đưa tất cả điểm về 0<br>• Reset trận đấu: Bắt đầu lại từ đầu<br>• Đổi chế độ: Chuyển đổi giữa các chế độ chơi<br>• Lịch sử: Xem lại các thao tác đã thực hiện<br>• Xem lại: Xem video quay lại trận đấu" },
                { title: "Dịch vụ hỗ trợ", text: "• Thực đơn: Xem menu đồ uống<br>• Xem hóa đơn: Kiểm tra chi tiết hóa đơn<br>• Khuyến mãi: Xem các chương trình ưu đãi" }
            ];
            case "multi": return [
                { title: "Quản lý người chơi", text: "Nhấn vào biểu tượng <img src=\"../../assets/icon/pen-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> ở góc thẻ để đổi tên. Nhấn vào biểu tượng <img src=\"../../assets/icon/user-delete-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> để xóa thẻ điểm. Nhấn vào Thêm người chơi để thêm người chơi mới." },
                { title: "Thay đổi điểm", text: "Nhấn vào Thay đổi điểm để thay đổi điểm người chơi, nhập số điểm cần cộng hoặc trừ (nhấn giữ để cộng hoặc trừ điểm nhanh), tổng điểm của người chơi phải bằng 0 thì mới có thể nhấn xác nhận" },
                { title: "Cài đặt", text: "Nhấn vào Cài đặt để thiết lập chấp nửa số, mỗi lần thay đổi điểm thì ở cạnh nút thay đổi điểm sẽ tự động thay đổi từ chấp sang không chấp và ngược lại" },
                { title: "Sử dụng bảng điều khiển bên phải", text: "• Reset tỉ số: Đưa tất cả điểm về 0<br>• Reset trận đấu: Bắt đầu lại từ đầu<br>• Đổi chế độ: Chuyển đổi giữa các chế độ chơi<br>• Lịch sử: Xem lại các thao tác đã thực hiện<br>• Xem lại: Xem video quay lại trận đấu" },
                { title: "Dịch vụ hỗ trợ", text: "• Thực đơn: Xem menu đồ uống<br>• Xem hóa đơn: Kiểm tra chi tiết hóa đơn<br>• Khuyến mãi: Xem các chương trình ưu đãi" }
            ];
            case "cards": return [
                { title: "Quản lý người chơi", text: "Nhấn vào biểu tượng <img src=\"../../assets/icon/pen-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> ở góc thẻ để đổi tên. Nhấn vào biểu tượng <img src=\"../../assets/icon/user-delete-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> để xóa thẻ điểm. Nhấn vào Thêm người chơi để thêm người chơi mới." },
                { title: "Thay đổi điểm", text: "Nhấn vào Thay đổi điểm để thay đổi điểm người chơi, nhập số điểm cần cộng hoặc trừ (nhấn giữ để cộng hoặc trừ điểm nhanh), tổng điểm của người chơi phải bằng 0 thì mới có thể nhấn xác nhận" },
                { title: "Cài đặt", text: "Nhấn vào Cài đặt để thiết lập tính Điểm chung.<br>• Mỗi lần cộng điểm cho người chơi sẽ lấy 1 hoặc nhiều điểm của ván đấu đó cho vào điểm chung (mặc định mỗi lần cộng điểm sẽ lấy 1 điểm).<br>• Điểm chung đó được trích từ người thắng hoặc người thua tuỳ cách chơi." },
                { title: "Sử dụng bảng điều khiển bên phải", text: "• Reset tỉ số: Đưa tất cả điểm về 0<br>• Reset trận đấu: Bắt đầu lại từ đầu<br>• Đổi chế độ: Chuyển đổi giữa các chế độ chơi<br>• Lịch sử: Xem lại các thao tác đã thực hiện<br>• Xem lại: Xem video quay lại trận đấu" },
                { title: "Dịch vụ hỗ trợ", text: "• Thực đơn: Xem menu đồ uống<br>• Xem hóa đơn: Kiểm tra chi tiết hóa đơn<br>• Khuyến mãi: Xem các chương trình ưu đãi" }
            ];
            case "multiQuick": return [
                { title: "Quản lý người chơi", text: "Nhấn vào biểu tượng <img src=\"../../assets/icon/pen-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> ở góc thẻ để đổi tên. Nhấn vào biểu tượng <img src=\"../../assets/icon/user-delete-dark.svg\" width=\"20\" height=\"20\" align=\"top\"> để xóa thẻ điểm. Nhấn vào Thêm người chơi để thêm người chơi mới." },
                { title: "Thay đổi điểm", text: "Nhấn '-' để giảm điểm, '+' để tăng điểm. Nhấn giữ để tăng hoặc giảm điểm nhanh" },
                { title: "Sử dụng bảng điều khiển bên phải", text: "• Reset tỉ số: Đưa tất cả điểm về 0<br>• Reset trận đấu: Bắt đầu lại từ đầu<br>• Đổi chế độ: Chuyển đổi giữa các chế độ chơi<br>• Lịch sử: Xem lại các thao tác đã thực hiện<br>• Xem lại: Xem video quay lại trận đấu" },
                { title: "Dịch vụ hỗ trợ", text: "• Thực đơn: Xem menu đồ uống<br>• Xem hóa đơn: Kiểm tra chi tiết hóa đơn<br>• Khuyến mãi: Xem các chương trình ưu đãi" }
            ];
            case "tournament": return [
                { title: "Theo dõi qua QR", text: "Quét mã QR để mở trang chủ giải đấu theo thời gian thực và xem lịch thi đấu, danh sách cơ thủ." },
                { title: "Đồng bộ Tỉ số trực tuyến", text: "Dữ liệu được lấy và cập nhật tự động lên máy chủ web của Poolarena trong suốt quá trình ghi điểm." },
                { title: "Quản lý Trận & Kết thúc", text: "Kết thúc trận, chuyển đổi cuộc thi hoặc theo dõi camera trực tiếp các bàn từ Dashboard quản trị viên." }
            ];
            default: return [];
        }
    }

    titleText:   "HƯỚNG DẪN SỬ DỤNG"
    confirmText: ""
    cancelText:  (typeof win !== "undefined" && win) ? win.tr("common_close") : "Đóng"

    showScrollbar: false

    Column {
        width: parent ? parent.width : Math.round(dlg.dialogW - 2 * dlg.contentMargins)
        spacing: Math.round(24 * dlg.uiScale)
        topPadding: Math.round(10 * dlg.uiScale)
        bottomPadding: Math.round(20 * dlg.uiScale)

        Repeater {
            model: dlg.guideData
            delegate: Column {
                width: parent.width
                spacing: Math.round(8 * dlg.uiScale)

                Row {
                    spacing: Math.round(10 * dlg.uiScale)
                    Rectangle {
                        width: Math.round(32 * dlg.uiScale); height: width
                        radius: width / 2; color: "#1976D2"
                        AppText {
                            anchors.centerIn: parent
                            text: String(model.index + 1)
                            color: "white"
                            font.pixelSize: Math.round(16 * dlg.uiScale)
                            font.bold: true
                        }
                    }
                    AppText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: modelData.title
                        color: "#172339"
                        font.pixelSize: Math.round(20 * dlg.uiScale)
                        font.bold: true
                    }
                }
                AppText {
                    text: modelData.text.replace(/\n/g, '<br>')
                    textFormat: Text.StyledText
                    color: "#65708a"
                    font.pixelSize: Math.round(17 * dlg.uiScale)
                    wrapMode: Text.WordWrap
                    width: parent.width
                    leftPadding: Math.round(42 * dlg.uiScale)
                    lineHeight: 1.4
                }
            }
        }
    }

    footer: Rectangle {
        width: dlg.dialogW - 2 * dlg.contentMargins
        height: Math.round(48 * dlg.uiScale)
        radius: Math.round(10 * dlg.uiScale)
        color: "#E8F5E9"
        border.color: "#4CAF50"
        border.width: 1

        AppText {
            anchors.centerIn: parent
            text: "💡 Nếu cần hỗ trợ, bấm Gọi nhân viên trên bảng điều khiển"
            color: "#2E7D32"
            font.pixelSize: Math.round(16 * dlg.uiScale)
        }
    }
}

import os
import uuid
from PySide6.QtCore import QObject, QByteArray, Signal, Slot
from PySide6.QtNetwork import QUdpSocket, QHostAddress

class ShutdownListener(QObject):
    """
    Lắng nghe tín hiệu tắt máy (UDP port 5555) từ ESP32 trên cùng mạng LAN.
    Khi nhận được chuỗi 'SHUTDOWN_SCOREBOARD', sẽ emit signal để QML xử lý logic.
    QML sẽ quyết định tắt ngay hay hoãn (nếu đang ở trang tỉ số).
    """

    # Signal gửi lên QML khi nhận lệnh tắt
    shutdownRequested = Signal()

    def __init__(self, port=5555, parent=None):
        super().__init__(parent)
        self.socket = QUdpSocket(self)
        
        # Lắng nghe mọi IP đến port 5555
        if self.socket.bind(QHostAddress.Any, port):
            print(f"[ShutdownListener] Đã bật chế độ chờ lệnh tắt máy (UDP Port: {port})")
            self.socket.readyRead.connect(self.read_pending_datagrams)
        else:
            print(f"[ShutdownListener] CẢNH BÁO: Không thể bind port {port}")

    def read_pending_datagrams(self):
        while self.socket.hasPendingDatagrams():
            # Đọc dữ liệu gửi sang
            size = self.socket.pendingDatagramSize()
            datagram, host, port = self.socket.readDatagram(size)
            
            try:
                message = datagram.data().decode('utf-8', errors='ignore').strip()
                
                # Check lệnh
                if message == "STATUS_CHECK":
                    # ESP32 hỏi trạng thái, trả về đang BẬT kèm theo địa chỉ MAC
                    mac_num = uuid.getnode()
                    mac_hex = '{:012x}'.format(mac_num)
                    mac_str = ':'.join(mac_hex[i:i+2] for i in range(0, 12, 2)).upper()
                    
                    response = f"STATUS_ON:{mac_str}"
                    self.socket.writeDatagram(QByteArray(response.encode('utf-8')), host, port)
                
                elif message == "SHUTDOWN_SCOREBOARD":
                    print(f"[ShutdownListener] NHẬN LỆNH TẮT MÁY TỪ ESP32 IP: {host.toString()}")
                    
                    # Gửi xác nhận (ACK) trước
                    ack = QByteArray(b"ACK_SHUTDOWN")
                    self.socket.writeDatagram(ack, host, port)
                    
                    # Emit signal để QML xử lý (hoãn nếu đang ở trang tỉ số)
                    self.shutdownRequested.emit()
                    
            except Exception as e:
                print(f"[ShutdownListener] Lỗi xử lý lệnh: {e}")

    @Slot()
    def execute_shutdown(self):
        """Thực thi tắt máy. Được gọi từ QML khi sẵn sàng."""
        print("[ShutdownListener] THỰC THI TẮT MÁY!")
        os.system("systemctl poweroff -i")

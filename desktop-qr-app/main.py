"""
Desktop QR Generator App - Main Application
AZ POOLARENA One-Time QR Access System
"""
import sys
import io
from datetime import datetime, timezone
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QMessageBox
)
from PySide6.QtCore import Qt, QTimer, QByteArray
from PySide6.QtGui import QPixmap, QFont, QPalette, QColor
import qrcode
from api_client import APIClient
from config import config


class QRGeneratorWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.api_client = APIClient()
        self.current_token = None
        self.expires_at = None
        self.countdown_timer = QTimer()
        self.countdown_timer.timeout.connect(self.update_countdown)
        self.qr_generated = False

        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("AZ POOLARENA ATTENDANCE")
        self.setFixedSize(600, 650)

        # Main widget
        central_widget = QWidget()
        central_widget.setStyleSheet("background-color: #f5f5f5;")
        self.setCentralWidget(central_widget)

        # Main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(30)
        main_layout.setContentsMargins(40, 40, 40, 40)

        # Title
        title = QLabel("MÃ QR CHẤM CÔNG")
        title.setAlignment(Qt.AlignCenter)
        title.setFont(QFont("Arial", 18, QFont.Bold))
        title.setStyleSheet("color: #2c3e50; padding: 10px;")
        main_layout.addWidget(title)

        # QR Display
        self.qr_label = QLabel()
        self.qr_label.setAlignment(Qt.AlignCenter)
        self.qr_label.setFixedSize(400, 400)
        self.qr_label.setScaledContents(False)
        self.qr_label.setStyleSheet("""
            QLabel {
                background-color: #ffffff;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
            }
        """)
        self.qr_label.setText("Chưa có mã QR")
        self.qr_label.setFont(QFont("Arial", 14))
        main_layout.addWidget(self.qr_label, 0, Qt.AlignCenter)

        # Button and Timer Row
        button_row = QHBoxLayout()
        button_row.setSpacing(15)

        # Generate Button
        self.generate_btn = QPushButton("Tạo mã QR")
        self.generate_btn.setFont(QFont("Arial", 14, QFont.Bold))
        self.generate_btn.setFixedHeight(60)
        self.generate_btn.setCursor(Qt.PointingHandCursor)
        self.generate_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0 30px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
            QPushButton:disabled {
                background-color: #cccccc;
                color: #666666;
            }
        """)
        self.generate_btn.clicked.connect(self.generate_qr)
        button_row.addWidget(self.generate_btn)

        # Countdown Label (hidden initially)
        self.countdown_label = QLabel("")
        self.countdown_label.setAlignment(Qt.AlignCenter)
        self.countdown_label.setFont(QFont("Arial", 32, QFont.Bold))
        self.countdown_label.setFixedSize(150, 60)
        self.countdown_label.setStyleSheet("""
            QLabel {
                color: #4CAF50;
                background-color: #f0f0f0;
                border-radius: 8px;
            }
        """)
        self.countdown_label.setVisible(False)
        button_row.addWidget(self.countdown_label)

        main_layout.addLayout(button_row)

        # Add stretch at bottom
        main_layout.addStretch()

    def generate_qr(self):
        """Generate new QR code"""
        ttl = 60  # Fixed 60 seconds

        try:
            self.generate_btn.setEnabled(False)

            # Call API
            response = self.api_client.create_qr_token(
                device_id=config.DEVICE_ID,
                purpose="attendance_access",
                ttl_seconds=ttl
            )

            if not response or not response.get("success"):
                raise Exception("Không thể kết nối với server")

            # Store token info
            self.current_token = response["access_token"]

            # Parse expires_at as UTC time
            # Backend returns format like: "2026-01-12T08:20:20.260901"
            expires_str = response["expires_at"]

            # If no timezone info, assume UTC
            if "+" not in expires_str and expires_str[-1] != "Z":
                # No timezone, add UTC
                self.expires_at = datetime.fromisoformat(expires_str).replace(tzinfo=timezone.utc)
            else:
                # Has timezone
                expires_str = expires_str.replace("Z", "+00:00")
                self.expires_at = datetime.fromisoformat(expires_str)

            qr_url = response["qr_url"]

            # Debug with UTC time
            now_utc = datetime.now(timezone.utc)
            print(f"[DEBUG] Current time (UTC): {now_utc}")
            print(f"[DEBUG] Expires at (UTC): {self.expires_at}")
            print(f"[DEBUG] Seconds remaining: {(self.expires_at - now_utc).total_seconds()}")

            # Generate QR code image
            try:
                print("[QR] Generating QR code...")
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(qr_url)
                qr.make(fit=True)

                print("[QR] Creating image...")
                img = qr.make_image(fill_color="black", back_color="white")

                # Convert PIL image to QPixmap
                print("[QR] Converting to QPixmap...")
                buffer = io.BytesIO()
                img.save(buffer, format="PNG")
                qpixmap = QPixmap()
                qpixmap.loadFromData(QByteArray(buffer.getvalue()))

                # Display QR code
                print("[QR] Displaying QR code...")
                scaled_pixmap = qpixmap.scaled(
                    380, 380,
                    Qt.KeepAspectRatio,
                    Qt.SmoothTransformation
                )
                self.qr_label.setPixmap(scaled_pixmap)
                print("[QR] QR code displayed successfully!")
            except Exception as qr_error:
                print(f"[QR ERROR] {type(qr_error).__name__}: {qr_error}")
                raise Exception(f"Lỗi tạo QR image: {str(qr_error)}")

            # Change button text and show countdown
            self.generate_btn.setText("Tạo lại mã QR")
            self.countdown_label.setVisible(True)
            self.qr_generated = True

            # Update countdown immediately to show initial value
            self.update_countdown()

            # Then start timer for subsequent updates
            self.countdown_timer.start(1000)

        except Exception as e:
            QMessageBox.critical(
                self,
                "Lỗi",
                f"Không thể tạo mã QR:\n\n{str(e)}\n\n"
                "Vui lòng kiểm tra kết nối và thử lại."
            )
        finally:
            self.generate_btn.setEnabled(True)

    def update_countdown(self):
        """Update countdown timer"""
        if not self.expires_at:
            return

        # Use UTC time for comparison since backend returns UTC
        now = datetime.now(timezone.utc)
        remaining = (self.expires_at - now).total_seconds()

        if remaining <= 0:
            # Expired
            self.countdown_timer.stop()
            self.countdown_label.setText("0s")
            self.countdown_label.setStyleSheet("""
                QLabel {
                    color: #f44336;
                    background-color: #ffebee;
                    border-radius: 8px;
                    border: 2px solid #f44336;
                }
            """)

            # Dim the QR code
            self.qr_label.setStyleSheet("""
                QLabel {
                    background-color: #f5f5f5;
                    border: 2px solid #f44336;
                    border-radius: 8px;
                    opacity: 0.5;
                }
            """)
        else:
            # Update countdown
            seconds_remaining = int(remaining)
            self.countdown_label.setText(f"{seconds_remaining}s")

            # Change color based on remaining time
            if remaining <= 10:
                # Red - Critical
                self.countdown_label.setStyleSheet("""
                    QLabel {
                        color: #f44336;
                        background-color: #ffebee;
                        border-radius: 8px;
                        border: 2px solid #f44336;
                    }
                """)
            elif remaining <= 30:
                # Orange - Warning
                self.countdown_label.setStyleSheet("""
                    QLabel {
                        color: #ff9800;
                        background-color: #fff3e0;
                        border-radius: 8px;
                        border: 2px solid #ff9800;
                    }
                """)
            else:
                # Green - Good
                self.countdown_label.setStyleSheet("""
                    QLabel {
                        color: #4CAF50;
                        background-color: #e8f5e9;
                        border-radius: 8px;
                        border: 2px solid #4CAF50;
                    }
                """)


def main():
    # Validate config
    try:
        config.validate()
    except ValueError as e:
        print(f"Configuration Error: {e}")
        print("\nPlease create a .env file with required settings.")
        sys.exit(1)

    app = QApplication(sys.argv)

    # Force Fusion style for consistent appearance
    app.setStyle("Fusion")

    # Set consistent color palette to prevent UI color changes on different PCs
    palette = QPalette()

    # Background colors
    palette.setColor(QPalette.Window, QColor(245, 245, 245))  # Light gray
    palette.setColor(QPalette.Base, QColor(255, 255, 255))    # White
    palette.setColor(QPalette.AlternateBase, QColor(245, 245, 245))

    # Text colors
    palette.setColor(QPalette.WindowText, QColor(44, 62, 80))  # Dark gray
    palette.setColor(QPalette.Text, QColor(44, 62, 80))

    # Button colors
    palette.setColor(QPalette.Button, QColor(76, 175, 80))       # Green
    palette.setColor(QPalette.ButtonText, QColor(255, 255, 255))  # White

    app.setPalette(palette)

    window = QRGeneratorWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

import { Card, Button } from 'flowbite-react';
import { NavLink } from 'react-router';

const Reports = () => {
    const reportTypes = [
        {
            title: 'Kho hàng',
            reports: [
                { name: 'Lịch sử giao dịch kho', path: '/inventory-history' },
                { name: 'Kiểm kê kho', path: '/inventory-check' },
            ]
        },
        {
            title: 'Tài chính',
            reports: [
                { name: 'Báo cáo chi phí hàng tháng', path: '/expense-report' },
                { name: 'Báo cáo doanh thu', path: '/finance' },
            ]
        },
        {
            title: 'Nhân sự',
            reports: [
                { name: 'Bảng chấm công', path: '/timesheet' },
                { name: 'Bảng lương', path: '/payroll' },
            ]
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tổng hợp báo cáo
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Hệ thống báo cáo và thống kê chi tiết
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reportTypes.map((group, idx) => (
                    <Card key={idx} className="h-full">
                        <h2 className="text-xl font-bold border-b pb-2 mb-4 text-blue-600 dark:text-blue-400">
                            {group.title}
                        </h2>
                        <div className="space-y-3">
                            {group.reports.map((report, rIdx) => (
                                <NavLink
                                    key={rIdx}
                                    to={report.path}
                                    className="block p-3 rounded-lg border border-gray-100 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{report.name}</span>
                                        <span className="text-sm text-gray-400">→</span>
                                    </div>
                                </NavLink>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold">Cần báo cáo tùy chỉnh?</h3>
                        <p className="text-blue-100">Liên hệ quản trị viên để thêm các loại báo cáo mới vào hệ thống.</p>
                    </div>
                    <Button color="light" size="sm">
                        Gửi yêu cầu
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Reports;

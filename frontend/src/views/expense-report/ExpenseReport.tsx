import { useState, useEffect } from 'react';
import { Card, Table, Label, Badge } from 'flowbite-react';
import toast from 'react-hot-toast';
import { expenseReportAPI } from '../../api/expenseReport.api';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseCategory {
    category_id?: number | null;
    category_name: string;
    total_amount: number;
    is_salary?: boolean;
}

interface ReportData {
    month: string;
    total_expenses: number;
    categories: ExpenseCategory[];
}

const ExpenseReport = () => {
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
    const [reportData, setReportData] = useState<ReportData | null>(null);

    useEffect(() => {
        fetchExpenseReport(selectedMonth);
    }, [selectedMonth]);

    const fetchExpenseReport = async (month: string) => {
        setLoading(true);
        try {
            const response = await expenseReportAPI.getMonthlyExpenseReport(month);
            setReportData(response.data);
        } catch (_error) {
            toast.error('Không thể tải báo cáo chi phí');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Báo cáo chi phí
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Thống kê chi phí chi tiết theo tháng
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Label value="Chọn tháng:" className="mr-2 hidden md:inline" />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : reportData ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="text-center">
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Tháng báo cáo</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {dayjs(reportData.month).format('MM/YYYY')}
                            </p>
                        </Card>
                        <Card className="text-center">
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Danh mục chi</h3>
                            <p className="text-2xl font-bold">{reportData.categories?.length || 0}</p>
                        </Card>
                        <Card className="text-center bg-red-50 dark:bg-red-900/10 border-red-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Tổng chi phí</h3>
                            <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(reportData.total_expenses)}
                            </p>
                        </Card>
                    </div>

                    <Card>
                        <h3 className="text-lg font-bold mb-4">Chi tiết chi phí theo danh mục</h3>
                        <div className="overflow-x-auto">
                            <Table striped>
                                <Table.Head>
                                    <Table.HeadCell className="w-16">STT</Table.HeadCell>
                                    <Table.HeadCell>Danh mục chi phí</Table.HeadCell>
                                    <Table.HeadCell className="text-right">Tổng chi phí</Table.HeadCell>
                                </Table.Head>
                                <Table.Body className="divide-y">
                                    {reportData.categories.map((item, index) => (
                                        <Table.Row key={index}>
                                            <Table.Cell className="text-center font-medium">{index + 1}</Table.Cell>
                                            <Table.Cell>
                                                <div className="flex items-center gap-2">
                                                    <strong>{item.category_name}</strong>
                                                    {item.is_salary && (
                                                        <Badge color="info">Lương + Thưởng</Badge>
                                                    )}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell className="text-right font-bold text-red-600">
                                                {formatCurrency(item.total_amount)}
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                    <Table.Row className="bg-gray-50 dark:bg-gray-700/50 font-bold border-t-2 border-gray-200">
                                        <Table.Cell colSpan={2} className="text-center">TỔNG CỘNG</Table.Cell>
                                        <Table.Cell className="text-right text-red-600 text-lg">
                                            {formatCurrency(reportData.total_expenses)}
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </div>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            Lưu ý về chi phí lương:
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-6 list-disc">
                            <li>Lương theo giờ: Tính từ chấm công × đơn giá (mặc định 25.000đ/giờ)</li>
                            <li>Lương固定: Toàn bộ lương tháng của nhân viên có lương cứng</li>
                            <li>Thưởng: Tổng tất cả các khoản thưởng trong tháng</li>
                        </ul>
                    </Card>
                </>
            ) : (
                <Card className="text-center py-20 text-gray-500">
                    Không có dữ liệu báo cáo cho tháng này.
                </Card>
            )}
        </div>
    );
};

export default ExpenseReport;

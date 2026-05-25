import { useState } from 'react';
import { Card, Tabs, Button } from 'flowbite-react';
import dayjs from 'dayjs';
import SalaryTable from './components/SalaryTable';
import AdvancePayment from './components/AdvancePayment';
import Bonus from './components/Bonus';
import Penalty from './components/Penalty';

const Payroll = () => {
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý lương
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Tính toán bảng lương, quản lý thưởng phạt và ứng tiền nhân viên
                    </p>
                </div>
                
                {/* Month Picker */}
                <div className="flex w-full lg:w-auto items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border">
                    <Button size="sm" color="gray" onClick={() => setSelectedDate(selectedDate.subtract(1, 'month'))}>
                        <span className="hidden md:inline">← Tháng trước</span>
                        <span className="md:hidden">←</span>
                    </Button>
                    <div className="bg-white dark:bg-gray-700 px-4 py-1.5 rounded font-bold text-center flex-1 md:flex-none">
                        <span className="hidden md:inline">Tháng </span>
                        {selectedDate.format('MM/YYYY')}
                    </div>
                    <Button size="sm" color="gray" onClick={() => setSelectedDate(selectedDate.add(1, 'month'))}>
                        <span className="hidden md:inline">Tháng sau →</span>
                        <span className="md:hidden">→</span>
                    </Button>
                </div>
            </div>

            <Card className="[&>div]:p-3 md:[&>div]:p-6 overflow-hidden">
                <Tabs aria-label="Payroll tabs" variant="underline" className="flex-nowrap whitespace-nowrap overflow-x-auto hide-scrollbar [&_button:focus]:ring-0 [&_button:focus]:outline-none">
                    <Tabs.Item active title="Bảng lương">
                        <div className="py-2 md:py-4">
                            <SalaryTable selectedDate={selectedDate} />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Ứng tiền">
                        <div className="py-2 md:py-4">
                            <AdvancePayment selectedDate={selectedDate} />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Thưởng">
                        <div className="py-2 md:py-4">
                            <Bonus selectedDate={selectedDate} />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Phạt">
                        <div className="py-2 md:py-4">
                            <Penalty selectedDate={selectedDate} />
                        </div>
                    </Tabs.Item>
                </Tabs>
            </Card>
        </div>
    );
};

export default Payroll;

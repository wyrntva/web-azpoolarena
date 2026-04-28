import { Card, Tabs } from 'flowbite-react';
import SalaryTable from './components/SalaryTable';
import AdvancePayment from './components/AdvancePayment';
import Bonus from './components/Bonus';
import Penalty from './components/Penalty';

const Payroll = () => {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý lương
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Tính toán bảng lương, quản lý thưởng phạt và ứng tiền nhân viên
                    </p>
                </div>
            </div>

            <Card>
                <Tabs aria-label="Payroll tabs" variant="underline" className="[&_button:focus]:ring-0 [&_button:focus]:outline-none">
                    <Tabs.Item active title="Bảng lương">
                        <div className="py-4">
                            <SalaryTable />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Ứng tiền">
                        <div className="py-4">
                            <AdvancePayment />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Thưởng">
                        <div className="py-4">
                            <Bonus />
                        </div>
                    </Tabs.Item>
                    <Tabs.Item title="Phạt">
                        <div className="py-4">
                            <Penalty />
                        </div>
                    </Tabs.Item>
                </Tabs>
            </Card>
        </div>
    );
};

export default Payroll;

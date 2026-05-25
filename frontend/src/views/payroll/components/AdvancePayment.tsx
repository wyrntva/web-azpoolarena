import { payrollAPI } from '../../../api/payroll.api';
import PayrollItemManager from './PayrollItemManager';
import dayjs from 'dayjs';

const advanceAPI = {
    getAll: payrollAPI.getAdvances,
    create: payrollAPI.createAdvance,
    update: payrollAPI.updateAdvance,
    delete: payrollAPI.deleteAdvance,
};

const AdvancePayment = ({ selectedDate }: { selectedDate: dayjs.Dayjs }) => {
    return (
        <PayrollItemManager
            api={advanceAPI}
            title="Danh sách phiếu ứng tiền"
            itemName="ứng tiền"
            buttonLabel="Tạo phiếu ứng"
            buttonColor="blue"
            amountColor="text-red-600"
            notesPlaceholder="Lý do ứng tiền..."
            selectedDate={selectedDate}
        />
    );
};

export default AdvancePayment;

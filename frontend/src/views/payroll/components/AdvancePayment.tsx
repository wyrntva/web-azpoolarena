import { payrollAPI } from '../../../api/payroll.api';
import PayrollItemManager from './PayrollItemManager';

const advanceAPI = {
    getAll: payrollAPI.getAdvances,
    create: payrollAPI.createAdvance,
    update: payrollAPI.updateAdvance,
    delete: payrollAPI.deleteAdvance,
};

const AdvancePayment = () => {
    return (
        <PayrollItemManager
            api={advanceAPI}
            title="Danh sách phiếu ứng tiền"
            itemName="ứng tiền"
            buttonLabel="Tạo phiếu ứng"
            buttonColor="blue"
            amountColor="text-red-600"
            notesPlaceholder="Lý do ứng tiền..."
        />
    );
};

export default AdvancePayment;

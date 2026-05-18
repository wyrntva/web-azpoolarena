import dayjs from 'dayjs';
import { payrollAPI } from '../../../api/payroll.api';
import PayrollItemManager from './PayrollItemManager';

const penaltyAPI = {
    getAll: payrollAPI.getPenalties,
    create: payrollAPI.createPenalty,
    update: payrollAPI.updatePenalty,
    delete: payrollAPI.deletePenalty,
};

const Penalty = ({ selectedDate }: { selectedDate: dayjs.Dayjs }) => {

    return (
        <>
            <PayrollItemManager
                api={penaltyAPI}
                title="Danh sách phiếu phạt"
                itemName="phạt"
                buttonLabel="Tạo phiếu phạt"
                buttonColor="failure"
                amountColor="text-red-700"
                notesPlaceholder="Lý do phạt..."
                selectedDate={selectedDate}
            />

        </>
    );
};

export default Penalty;

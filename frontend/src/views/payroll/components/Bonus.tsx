import { payrollAPI } from '../../../api/payroll.api';
import PayrollItemManager from './PayrollItemManager';
import dayjs from 'dayjs';

const bonusAPI = {
    getAll: payrollAPI.getBonuses,
    create: payrollAPI.createBonus,
    update: payrollAPI.updateBonus,
    delete: payrollAPI.deleteBonus,
};

const Bonus = ({ selectedDate }: { selectedDate: dayjs.Dayjs }) => {
    return (
        <PayrollItemManager
            api={bonusAPI}
            title="Danh sách phiếu thưởng"
            itemName="thưởng"
            buttonLabel="Tạo phiếu thưởng"
            buttonColor="green"
            amountColor="text-green-600"
            notesPlaceholder="Lý do thưởng..."
            selectedDate={selectedDate}
        />
    );
};

export default Bonus;

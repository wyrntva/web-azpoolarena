import { Button, Table, Modal, Label, TextInput, Select } from 'flowbite-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { usePayrollItem } from '../hooks/usePayrollItem';

type ColorType = 'blue' | 'green' | 'failure' | 'warning';

interface PayrollItemAPI {
    getAll: () => Promise<{ data: any[] }>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
}

interface PayrollItemManagerProps {
    api: PayrollItemAPI;
    title: string;
    itemName: string;
    buttonLabel: string;
    buttonColor: ColorType;
    amountColor: string;
    notesPlaceholder: string;
    extraActions?: React.ReactNode;
}

const PayrollItemManager = ({
    api,
    title,
    itemName,
    buttonLabel,
    buttonColor,
    amountColor,
    notesPlaceholder,
    extraActions,
}: PayrollItemManagerProps) => {
    const {
        loading,
        items,
        employees,
        modalOpen,
        editingRecord,
        formData,
        setFormData,
        isAdmin,
        handleOpenModal,
        handleSubmit,
        handleDelete,
        closeModal,
    } = usePayrollItem({ api, itemName });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{title}</h3>
                {isAdmin && (
                    <div className="flex gap-2">
                        {extraActions}
                        <Button onClick={() => handleOpenModal()} color={buttonColor} size="sm">
                            {buttonLabel}
                        </Button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <Table striped hoverable>
                    <Table.Head>
                        <Table.HeadCell>Ngày</Table.HeadCell>
                        <Table.HeadCell>Nhân viên</Table.HeadCell>
                        <Table.HeadCell>Số tiền</Table.HeadCell>
                        <Table.HeadCell>Ghi chú</Table.HeadCell>
                        <Table.HeadCell>Người tạo</Table.HeadCell>
                        <Table.HeadCell><span className="sr-only">Thao tác</span></Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {loading ? (
                            <Table.Row>
                                <Table.Cell colSpan={6} className="text-center">Đang tải...</Table.Cell>
                            </Table.Row>
                        ) : items.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={6} className="text-center">Chưa có dữ liệu</Table.Cell>
                            </Table.Row>
                        ) : items.map((item) => (
                            <Table.Row key={item.id}>
                                <Table.Cell className="font-medium whitespace-nowrap">
                                    {formatDate(item.date)}
                                </Table.Cell>
                                <Table.Cell>{item.employee_name || `User #${item.user_id}`}</Table.Cell>
                                <Table.Cell className={`${amountColor} font-bold`}>
                                    {amountColor.includes('red') ? '-' : ''}{formatCurrency(item.amount)}
                                </Table.Cell>
                                <Table.Cell className="max-w-xs truncate">{item.notes || '-'}</Table.Cell>
                                <Table.Cell>{item.created_by_name || '-'}</Table.Cell>
                                <Table.Cell>
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:underline"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </div>

            <Modal show={modalOpen} onClose={closeModal}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingRecord ? `Sửa phiếu ${itemName}` : `Tạo phiếu ${itemName}`}
                    </Modal.Header>
                    <Modal.Body className="space-y-4">
                        <div>
                            <Label value="Nhân viên" />
                            <Select
                                value={formData.user_id}
                                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                required
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label value="Ngày" />
                            <TextInput
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label value="Số tiền (VNĐ)" />
                            <TextInput
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label value="Ghi chú" />
                            <TextInput
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={notesPlaceholder}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit" color={buttonColor}>Lưu phiếu</Button>
                        <Button color="gray" onClick={closeModal}>Hủy</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default PayrollItemManager;

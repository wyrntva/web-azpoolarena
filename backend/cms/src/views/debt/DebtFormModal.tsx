/**
 * DebtFormModal — modal tạo/sửa công nợ.
 * Tách từ Debt.tsx.
 */
import { Button, Label, Modal, Select, TextInput, Textarea } from 'flowbite-react';
import type { User } from '../../types/api';

export interface DebtFormData {
    debtor_name: string;
    amount: number;
    note: string;
    debt_date: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    isEditing: boolean;
    formData: DebtFormData;
    onFormChange: (data: DebtFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    users: User[];
}

export default function DebtFormModal({ open, onClose, isEditing, formData, onFormChange, onSubmit, users }: Props) {
    const set = <K extends keyof DebtFormData>(field: K, value: DebtFormData[K]) =>
        onFormChange({ ...formData, [field]: value });

    return (
        <Modal show={open} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <Modal.Header>{isEditing ? 'Chỉnh sửa công nợ' : 'Thêm công nợ mới'}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="debt_date" value="Ngày nợ" />
                            <input type="date" id="debt_date" value={formData.debt_date}
                                onChange={(e) => set('debt_date', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="debtor_name" value="Người nợ" />
                            <Select id="debtor_name" value={formData.debtor_name}
                                onChange={(e) => set('debtor_name', e.target.value)} required className="mt-1">
                                <option value="">Chọn người nợ</option>
                                {users.map(u => <option key={u.id} value={u.full_name}>{u.full_name} ({u.username})</option>)}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="amount" value="Số tiền" />
                            <TextInput id="amount" type="number" value={formData.amount}
                                onChange={(e) => set('amount', Number(e.target.value))}
                                placeholder="Nhập số tiền" required min={1} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="note" value="Ghi chú (không bắt buộc)" />
                            <Textarea id="note" placeholder="Nhập ghi chú..." rows={3}
                                value={formData.note} onChange={(e) => set('note', e.target.value)} className="mt-1" />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" color="blue">{isEditing ? 'Cập nhật' : 'Thêm'}</Button>
                    <Button color="gray" onClick={onClose}>Hủy</Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

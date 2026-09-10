/**
 * FinanceFormModal — modal tạo/sửa phiếu thu chi.
 * Tách từ Finance.tsx.
 */
import { Button, Label, Modal, Select, TextInput, Textarea } from 'flowbite-react';
import type { ReceiptType } from '../../types/api';

export interface FinanceFormData {
    receipt_date: string;
    receipt_type_id: number;
    amount: number;
    is_income: boolean;
    payment_method: 'cash' | 'bank';
    note: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    isEditing: boolean;
    formData: FinanceFormData;
    onFormChange: (data: FinanceFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    receiptTypes: ReceiptType[];
}

export default function FinanceFormModal({ open, onClose, isEditing, formData, onFormChange, onSubmit, receiptTypes }: Props) {
    const set = <K extends keyof FinanceFormData>(field: K, value: FinanceFormData[K]) =>
        onFormChange({ ...formData, [field]: value });

    return (
        <Modal show={open} onClose={onClose} size="md">
            <form onSubmit={onSubmit}>
                <Modal.Header>
                    {isEditing ? 'Chỉnh sửa phiếu thu/chi' : 'Thêm phiếu thu/chi mới'}
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="receipt_date" value="Ngày (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <input
                                    type="date"
                                    id="receipt_date"
                                    value={formData.receipt_date}
                                    onChange={(e) => set('receipt_date', e.target.value)}
                                    required
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="is_income" value="Loại phiếu (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <Select
                                    id="is_income"
                                    value={formData.is_income.toString()}
                                    onChange={(e) => set('is_income', e.target.value === 'true')}
                                    required
                                >
                                    <option value="true">Phiếu Thu (+)</option>
                                    <option value="false">Phiếu Chi (-)</option>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="receipt_type_id" value="Danh mục (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <Select
                                    id="receipt_type_id"
                                    value={formData.receipt_type_id}
                                    onChange={(e) => set('receipt_type_id', Number(e.target.value))}
                                    required
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {(receiptTypes || []).map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="payment_method" value="Phương thức thanh toán" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                                <Select
                                    id="payment_method"
                                    value={formData.payment_method}
                                    onChange={(e) => set('payment_method', e.target.value as 'cash' | 'bank')}
                                    required
                                >
                                    <option value="cash">Tiền mặt</option>
                                    <option value="bank">Tài khoản</option>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="amount" value="Số tiền (VNĐ) (*)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                            <TextInput
                                id="amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => set('amount', Number(e.target.value))}
                                placeholder="0"
                                required
                                min={1}
                            />
                        </div>

                        <div>
                            <Label htmlFor="note" value="Ghi chú (không bắt buộc)" className="mb-1 block font-medium text-xs text-gray-700 dark:text-gray-300" />
                            <Textarea
                                id="note"
                                placeholder="Nhập ghi chú..."
                                rows={2}
                                value={formData.note}
                                onChange={(e) => set('note', e.target.value)}
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" color="blue">
                        {isEditing ? 'Cập nhật' : 'Thêm'}
                    </Button>
                    <Button color="gray" onClick={onClose}>
                        Hủy
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

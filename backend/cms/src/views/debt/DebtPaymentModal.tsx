/**
 * DebtPaymentModal — modal xác nhận thu nợ.
 * Tách từ Debt.tsx.
 */
import { Button, Label, Modal, Select } from 'flowbite-react';
import { formatCurrency } from '../../utils/formatters';
import type { Debt as DebtType } from '../../types/api';

interface Props {
    open: boolean;
    onClose: () => void;
    debt: DebtType | null;
    paymentMethod: 'cash' | 'bank';
    onPaymentMethodChange: (method: 'cash' | 'bank') => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function DebtPaymentModal({ open, onClose, debt, paymentMethod, onPaymentMethodChange, onSubmit }: Props) {
    return (
        <Modal show={open} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <Modal.Header>Thu nợ</Modal.Header>
                <Modal.Body>
                    {debt && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Người nợ:</p>
                                <p className="text-lg font-semibold">{debt.debtor_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Số tiền:</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(debt.amount)}</p>
                            </div>
                            <div>
                                <Label htmlFor="payment_method" value="Hình thức thu nợ" />
                                <Select id="payment_method" value={paymentMethod}
                                    onChange={(e) => onPaymentMethodChange(e.target.value as 'cash' | 'bank')} required className="mt-1">
                                    <option value="cash">Tiền mặt</option>
                                    <option value="bank">Chuyển khoản</option>
                                </Select>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" color="success">Thu nợ</Button>
                    <Button color="gray" onClick={onClose}>Hủy</Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

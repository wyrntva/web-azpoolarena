import { useState, useEffect } from 'react';
import { Modal, Button, Checkbox, Label } from 'flowbite-react';
import type { Table } from '../../../api/area.api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tables: Table[];
    matchCount: number;
    roundTitle: string;
    initialSelected?: string[];
    onApply: (orderedTableNames: string[]) => void;
}

const TableAssignModal = ({ isOpen, onClose, tables, matchCount, roundTitle, initialSelected = [], onApply }: Props) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) setSelected(new Set(initialSelected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const toggle = (name: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const handleApply = () => {
        // Preserve display order (tables array is already sorted numerically)
        const ordered = tables.map(t => t.name).filter(n => selected.has(n));
        onApply(ordered);
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={onClose} size="md">
            <Modal.Header>Xếp bàn — {roundTitle}</Modal.Header>
            <Modal.Body>
                <p className="text-sm text-gray-500 mb-4">
                    Vòng này có <strong>{matchCount}</strong> trận. Chọn các bàn để xếp lần lượt cho các trận <strong>chưa có bàn</strong>. Trận đã có bàn sẽ không bị thay đổi.
                </p>
                <div className="flex gap-2 mb-4">
                    <Button size="xs" color="light" onClick={() => setSelected(new Set(tables.map(t => t.name)))}>
                        Chọn tất cả
                    </Button>
                    <Button size="xs" color="light" onClick={() => setSelected(new Set())}>
                        Bỏ chọn
                    </Button>
                </div>
                {tables.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Không có bàn nào trong hệ thống.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                        {tables.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`tbl-assign-${t.id}`}
                                    checked={selected.has(t.name)}
                                    onChange={() => toggle(t.name)}
                                />
                                <Label htmlFor={`tbl-assign-${t.id}`} className="cursor-pointer text-sm">
                                    {t.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={handleApply} disabled={selected.size === 0}>
                    Áp dụng ({selected.size} bàn)
                </Button>
                <Button color="gray" onClick={onClose}>Hủy</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TableAssignModal;

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

interface Table {
    id: number;
    name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tables: Table[];
    matchCount: number;
    roundTitle: string;
    initialSelected: string[];
    onApply: (tableNames: string[]) => void;
}

const TableAssignModal: React.FC<Props> = ({
    isOpen,
    onClose,
    tables,
    matchCount,
    roundTitle,
    initialSelected,
    onApply,
}) => {
    const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

    // Sync selected tables when modal opens or initialSelected changes
    useEffect(() => {
        if (isOpen) {
            setSelected(new Set(initialSelected));
        }
    }, [initialSelected, isOpen]);

    if (!isOpen) return null;

    const handleToggleTable = (name: string) => {
        const next = new Set(selected);
        if (next.has(name)) {
            next.delete(name);
        } else {
            next.add(name);
        }
        setSelected(next);
    };

    const handleSelectAll = () => {
        setSelected(new Set(tables.map((t) => t.name)));
    };

    const handleDeselectAll = () => {
        setSelected(new Set());
    };

    const handleApply = () => {
        onApply(Array.from(selected));
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
            }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
        >
            <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl dark:bg-gray-800 transition-all transform flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:billiards-bold-duotone" className="text-xl text-red-600 dark:text-red-500" />
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white uppercase tracking-wide">
                            Cấu hình xếp bàn
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div className="rounded-lg bg-gray-55 p-4 dark:bg-gray-750 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            {roundTitle} &bull; {matchCount} trận đấu
                        </p>
                        Chọn danh sách các bàn sẽ được tự động xếp cho các trận đấu. Hệ thống sẽ phân phối trận đấu vào các bàn được chọn.
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                            Đang chọn: <span className="font-bold text-gray-900 dark:text-white">{selected.size}</span> / {tables.length} bàn
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="inline-flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Chọn tất cả
                            </button>
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="inline-flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Bỏ chọn hết
                            </button>
                        </div>
                    </div>

                    {/* Tables Grid */}
                    {tables.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 italic text-sm">
                            Không tìm thấy bàn nào trong hệ thống
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {tables.map((table) => {
                                const isSelected = selected.has(table.name);
                                return (
                                    <button
                                        key={table.id}
                                        type="button"
                                        onClick={() => handleToggleTable(table.name)}
                                        className={`group relative flex items-center justify-between rounded-xl border p-3.5 transition-all text-left ${
                                            isSelected
                                                ? 'border-red-500 bg-red-50/50 text-red-900 dark:border-red-500 dark:bg-red-950/30 dark:text-red-300 font-semibold ring-1 ring-red-500'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Icon
                                                icon="solar:billiards-outline"
                                                className={`text-lg transition-colors ${
                                                    isSelected ? 'text-red-500 dark:text-red-400' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                            />
                                            <span className="truncate text-sm">{table.name}</span>
                                        </div>
                                        {isSelected && (
                                            <Icon
                                                icon="solar:check-circle-bold"
                                                className="text-lg text-red-600 dark:text-red-500 flex-shrink-0 animate-scale-up"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-150 px-6 py-4 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-850 dark:text-gray-300 dark:hover:bg-gray-750 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={selected.size === 0}
                        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TableAssignModal;

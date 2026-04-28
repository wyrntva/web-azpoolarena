/**
 * AreaDetail Page — drag-and-drop table layout editor for a specific area.
 *
 * Extracted: TableEditModal → TableEditModal.tsx
 *            DraggableTableItem — kept in-file since it's area-layout-specific
 */
import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams, Link } from 'react-router';
import { Button, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import Draggable from 'react-draggable';
import { areaAPI, type Area, type Table } from '../../../api/area.api';
import TableEditModal from './TableEditModal';

// ============================================
// SUB-COMPONENT: Draggable Table Item
// ============================================

const DraggableTableItem = memo(({ table, onStop, onEdit, onDelete }: {
    table: Table;
    onStop: (e: any, data: any, id: number) => void;
    onEdit: (table: Table) => void;
    onDelete: (id: number) => void;
}) => {
    const nodeRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={{ x: table.x, y: table.y }}
            position={{ x: table.x, y: table.y }}
            cancel=".action-button"
            onStart={() => setIsDragging(true)}
            onStop={(e, data) => { setIsDragging(false); onStop(e, data, table.id); }}
            bounds="parent"
        >
            <div
                ref={nodeRef}
                className={`absolute cursor-grab active:cursor-grabbing flex items-center justify-center 
                    bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500 rounded shadow-sm 
                    hover:shadow-md select-none group
                    ${isDragging ? '' : 'transition-all duration-200'}`}
                style={{ width: 90, height: 90, zIndex: isDragging ? 50 : 10 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center gap-2 px-2 relative w-full h-full justify-center">
                    <div className="w-1 h-6 bg-gray-400 rounded-full opacity-40 group-hover:opacity-100" />
                    <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[70px]">
                        {table.name}
                    </span>
                    <div className="w-1 h-6 bg-gray-400 rounded-full opacity-40 group-hover:opacity-100" />

                    {isHovered && (
                        <div className="absolute -top-3 -right-3 flex gap-1 z-20">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(table); }}
                                className="action-button p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg transition-colors pointer-events-auto"
                                title="Sửa tên">
                                <Icon icon="solar:pen-new-square-bold" className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(table.id); }}
                                className="action-button p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors pointer-events-auto"
                                title="Xóa bàn">
                                <Icon icon="solar:trash-bin-trash-bold" className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Draggable>
    );
});

DraggableTableItem.displayName = 'DraggableTableItem';

// ============================================
// CONSTANTS
// ============================================

const TABLE_SIZE = 90;

// ============================================
// MAIN COMPONENT
// ============================================

const AreaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [area, setArea] = useState<Area | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [originalTables, setOriginalTables] = useState<Table[]>([]);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Keep editingTable in sync with the latest tables data
    // (e.g. after onSaved → loadArea refreshes tables from server)
    useEffect(() => {
        if (editingTable && tables.length > 0) {
            const updated = tables.find(t => t.id === editingTable.id);
            if (updated && updated !== editingTable) {
                setEditingTable(updated);
            }
        }
    }, [tables]);

    // --- Data Loading ---

    const loadArea = async (areaId: number) => {
        try {
            setLoading(true);
            const response = await areaAPI.getById(areaId);
            setArea(response.data);
            if (response.data.tables) {
                setTables(response.data.tables);
                setOriginalTables(JSON.parse(JSON.stringify(response.data.tables)));
            }
        } catch (error) {
            toast.error('Không thể tải thông tin khu vực');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadArea(parseInt(id));
    }, [id]);

    // --- Drag & Drop ---

    const isOverlapping = (r1: { x: number; y: number; w: number; h: number }, r2: { x: number; y: number; w: number; h: number }) =>
        !(r1.x + r1.w <= r2.x || r1.x >= r2.x + r2.w || r1.y + r1.h <= r2.y || r1.y >= r2.y + r2.h);

    const handleDragStop = (_e: any, data: { x: number; y: number }, tableId: number) => {
        const newRect = { x: data.x, y: data.y, w: TABLE_SIZE, h: TABLE_SIZE };
        const overlappingTable = tables.find(t => {
            if (t.id === tableId) return false;
            return isOverlapping(newRect, { x: t.x, y: t.y, w: TABLE_SIZE, h: TABLE_SIZE });
        });

        if (overlappingTable) {
            toast.error(`Vị trí bị trùng với ${overlappingTable.name}. Vui lòng thử lại.`);
            setTables([...tables]); // force reset
            return;
        }

        setTables(prev => prev.map(t => t.id === tableId ? { ...t, x: data.x, y: data.y } : t));
    };

    // --- Actions ---

    const handleSave = async () => {
        if (!area) return;
        try {
            setSaving(true);
            await areaAPI.updateLayout(area.id, tables.map(t => ({ id: t.id, x: t.x, y: t.y })));
            toast.success('Đã lưu cấu hình vị trí bàn');
            setOriginalTables(JSON.parse(JSON.stringify(tables)));
        } catch (error) {
            toast.error('Không thể lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const handleAddTable = async () => {
        if (!area) return;
        try {
            setSaving(true);
            await areaAPI.update(area.id, { ...area, table_count: area.table_count + 1 });
            toast.success('Đã thêm bàn mới');
            await loadArea(area.id);
        } catch (error) {
            toast.error('Không thể thêm bàn');
            setSaving(false);
        }
    };

    const handleDeleteTable = async (tableId: number) => {
        if (!area || !confirm('Bạn có chắc chắn muốn xóa bàn này?')) return;
        try {
            setSaving(true);
            await areaAPI.deleteTable(area.id, tableId);
            toast.success('Đã xóa bàn');
            await loadArea(area.id);
        } catch (error) {
            toast.error('Không thể xóa bàn');
            setSaving(false);
        }
    };

    const hasChanges = JSON.stringify(tables) !== JSON.stringify(originalTables);

    // --- Loading / Empty States ---

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spinner size="xl" />
            </div>
        );
    }

    if (!area) {
        return (
            <div className="p-6 text-center">
                <p>Không tìm thấy khu vực</p>
                <Link to="/settings/areas" className="text-blue-600 hover:underline">Quay lại danh sách</Link>
            </div>
        );
    }

    // --- Render ---

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link to="/settings/areas"
                        className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2">
                        <Icon icon="solar:alt-arrow-left-outline" className="mr-1" />
                        Quay lại danh sách khu vực
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white uppercase">{area.name}</h2>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="relative w-[780px] h-[520px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden mx-auto shadow-sm">
                <div className="absolute inset-0 p-4">
                    {tables.map((table) => (
                        <DraggableTableItem key={table.id} table={table}
                            onStop={handleDragStop}
                            onEdit={(t) => { setEditingTable(t); setEditModalOpen(true); }}
                            onDelete={handleDeleteTable} />
                    ))}
                    {tables.length === 0 && (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            Chưa có bàn nào trong khu vực này. Hãy thêm bàn mới.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-center items-center gap-4 pt-4">
                <Button color="blue" size="lg" onClick={handleAddTable} disabled={saving}>
                    {saving ? <Spinner size="sm" /> : <Icon icon="solar:add-circle-bold" className="mr-2 h-5 w-5" />}
                    {!saving && "Thêm bàn"}
                </Button>
                <Button size="lg" color="blue" onClick={handleSave} disabled={!hasChanges || saving}
                    className="min-w-[200px]">
                    {saving ? (
                        <><Spinner size="sm" className="mr-2" />Đang lưu...</>
                    ) : (
                        <><Icon icon="solar:diskette-bold" className="mr-2 h-5 w-5" />Lưu cấu hình</>
                    )}
                </Button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-2">
                * Kéo thả các bàn để thay đổi vị trí. Nhấn "Lưu cấu hình" để lưu lại thay đổi.
            </p>

            {/* Table Edit Modal */}
            <TableEditModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                areaId={area.id}
                table={editingTable}
                onSaved={() => loadArea(area.id)}
            />
        </div>
    );
};

export default AreaDetail;

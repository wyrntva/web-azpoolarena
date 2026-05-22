import { useState, useEffect, useCallback } from 'react';
import { areaAPI, type Table } from '../../../api/area.api';

export const useAllTables = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAllTables = useCallback(async () => {
        setLoading(true);
        try {
            const areasRes = await areaAPI.getAll();
            const areas = areasRes.data;
            const tablePromises = areas.map((a) => areaAPI.getById(a.id));
            const details = await Promise.all(tablePromises);

            const allTables: Table[] = [];
            details.forEach((detail) => {
                if (detail.data.tables) {
                    allTables.push(...detail.data.tables);
                }
            });
            allTables.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

            setTables(allTables);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bàn', error);
            // toast.error('Không thể tải danh sách bàn');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllTables();
    }, [fetchAllTables]);

    return { tables, loading, refetch: fetchAllTables };
};

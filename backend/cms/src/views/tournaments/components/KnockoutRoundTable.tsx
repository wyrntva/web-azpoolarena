import React from 'react';
import { MatchVM } from './knockoutHelpers';

export interface Column {
    key: keyof MatchVM | string; // allow synthetic keys like 'actions'
    title: string;
    widthPct: string;
    align?: 'left' | 'center';
    render: (m: MatchVM, idx: number) => React.ReactNode;
}

interface KnockoutRoundTableProps {
    matches: MatchVM[];
    columns: Column[];
}

const KnockoutRoundTable: React.FC<KnockoutRoundTableProps> = ({ matches, columns }) => {
    return (
        <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-xs table-fixed">
                <colgroup>
                    {columns.map((c) => (
                        <col key={String(c.key)} style={{ width: c.widthPct }} />
                    ))}
                </colgroup>
                <thead>
                    <tr className="bg-white">
                        {columns.map((c) => (
                            <th
                                key={String(c.key)}
                                className={`p-3 uppercase text-gray-600 ${c.align === 'center' ? 'text-center' : 'text-left'}`}
                            >
                                {c.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {matches.map((m, idx) => (
                        <tr key={m.match_no} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                            {columns.map((c) => (
                                <td
                                    key={String(c.key)}
                                    className={`p-2 ${c.align === 'center' ? 'text-center' : ''}`}
                                >
                                    {c.render(m, idx)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default KnockoutRoundTable;

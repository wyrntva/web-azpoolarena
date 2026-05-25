import { useState } from 'react';
import { Button, Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';

const ScoringRulesTab = () => {
    const [ratingMatrix, setRatingMatrix] = useState([
        { diff: 0, winFav: 15, winUnd: 15, loseFav: -15, loseUnd: -15 },
        { diff: 1, winFav: 10, winUnd: 25, loseFav: -25, loseUnd: -10 },
        { diff: 2, winFav: 5, winUnd: 30, loseFav: -30, loseUnd: -5 },
    ]);

    return (
        <div className="space-y-8">
            {/* Rating Matrix Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Icon icon="solar:chart-square-outline" className="text-blue-500" />
                            Quy tắc điểm (Rating Matrix)
                            <Badge color="warning" className="ml-2 text-xs">Chưa tích hợp API</Badge>
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cấu hình điểm cộng/trừ dựa trên chênh lệch cấp độ (Rating Difference)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button color="success" size="sm" onClick={() => {
                            const nextDiff = ratingMatrix.length;
                            setRatingMatrix([...ratingMatrix, { diff: nextDiff, winFav: 0, winUnd: 0, loseFav: 0, loseUnd: 0 }]);
                        }}>
                            <Icon icon="solar:add-circle-outline" className="mr-2" />
                            Thêm mức chênh lệch
                        </Button>
                        <Button color="blue" size="sm" disabled title="Chức năng đang phát triển">
                            <Icon icon="solar:diskette-outline" className="mr-2" />
                            Lưu cấu hình
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 font-bold text-gray-400 uppercase tracking-tighter w-24 text-left">Chênh lệch</th>
                                <th className="p-4 font-bold text-gray-400 uppercase tracking-tighter">Thắng (Cửa trên)</th>
                                <th className="p-4 font-bold text-gray-400 uppercase tracking-tighter">Thắng (Cửa dưới)</th>
                                <th className="p-4 font-bold text-gray-400 uppercase tracking-tighter">Thua (Cửa trên)</th>
                                <th className="p-4 font-bold text-gray-400 uppercase tracking-tighter">Thua (Cửa dưới)</th>
                                <th className="p-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {ratingMatrix.map((item, idx) => (
                                <tr key={idx} className={`${idx === 0 ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : 'bg-white dark:bg-gray-800'} hover:bg-blue-50/30 transition-colors`}>
                                    <td className="p-4 font-medium text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs">#</span>
                                            <input
                                                type="number"
                                                className="w-12 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-left p-0 font-bold focus:border-blue-500 text-gray-900 dark:text-white"
                                                value={item.diff}
                                                onChange={(e) => {
                                                    const newMatrix = [...ratingMatrix];
                                                    newMatrix[idx].diff = parseInt(e.target.value) || 0;
                                                    setRatingMatrix(newMatrix);
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg"
                                            value={item.winFav.toFixed(2)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    const newMatrix = [...ratingMatrix];
                                                    newMatrix[idx].winFav = val;
                                                    setRatingMatrix(newMatrix);
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg"
                                            value={item.winUnd.toFixed(2)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    const newMatrix = [...ratingMatrix];
                                                    newMatrix[idx].winUnd = val;
                                                    setRatingMatrix(newMatrix);
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg"
                                            value={item.loseFav.toFixed(2)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    const newMatrix = [...ratingMatrix];
                                                    newMatrix[idx].loseFav = val;
                                                    setRatingMatrix(newMatrix);
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg"
                                            value={item.loseUnd.toFixed(2)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    const newMatrix = [...ratingMatrix];
                                                    newMatrix[idx].loseUnd = val;
                                                    setRatingMatrix(newMatrix);
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        {idx > 0 && (
                                            <button
                                                onClick={() => setRatingMatrix(ratingMatrix.filter((_, i) => i !== idx))}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                title="Xóa dòng"
                                            >
                                                <Icon icon="solar:trash-bin-minimalistic-outline" width="18" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ScoringRulesTab;

import { useState, useEffect } from 'react';
import { Button, Badge, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { tournamentSettingsAPI } from '../../../api/tournamentSettings.api';
import toast from 'react-hot-toast';

interface RatingMatrixItem {
    diff: number;
    winFav: number | string;
    winUnd: number | string;
    loseFav: number | string;
    loseUnd: number | string;
}

const ScoringRulesTab = () => {
    const [ratingMatrix, setRatingMatrix] = useState<RatingMatrixItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRatingMatrix();
    }, []);

    const fetchRatingMatrix = async () => {
        try {
            setLoading(true);
            const response = await tournamentSettingsAPI.getRatingMatrix();
            setRatingMatrix(response.data || []);
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải ma trận điểm đấu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Parse all input values to pure numbers before sending to backend
            const parsedMatrix = ratingMatrix.map((item) => ({
                diff: Number(item.diff) || 0,
                winFav: Number(item.winFav) || 0,
                winUnd: Number(item.winUnd) || 0,
                loseFav: Number(item.loseFav) || 0,
                loseUnd: Number(item.loseUnd) || 0,
            }));

            await tournamentSettingsAPI.saveRatingMatrix(parsedMatrix);
            toast.success('Cấu hình ma trận điểm đấu thành công');
            fetchRatingMatrix(); // Refresh to reload formatted numbers from backend
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể lưu cấu hình ma trận điểm đấu');
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefault = () => {
        if (window.confirm('Bạn có chắc muốn khôi phục ma trận điểm về cấu hình mặc định ban đầu không?')) {
            setRatingMatrix([
                { diff: 0, winFav: 15, winUnd: 15, loseFav: -15, loseUnd: -15 },
                { diff: 1, winFav: 10, winUnd: 25, loseFav: -25, loseUnd: -10 },
                { diff: 2, winFav: 5, winUnd: 30, loseFav: -30, loseUnd: -5 },
            ]);
            toast.success('Đã tải cấu hình mặc định (Nhấp "Lưu cấu hình" để cập nhật vào máy chủ)');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Rating Matrix Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Icon icon="solar:chart-square-outline" className="text-blue-500" />
                            Quy tắc điểm (Rating Matrix)
                            <Badge color="success" className="text-xs">Đã tích hợp API</Badge>
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Nhấp đúp hoặc click trực tiếp vào các con số trong bảng dưới đây để tự sửa đổi điểm.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button color="gray" size="sm" onClick={handleResetToDefault}>
                            <Icon icon="solar:restart-outline" className="mr-2" />
                            Đặt lại mặc định
                        </Button>
                        <Button color="success" size="sm" onClick={() => {
                            const nextDiff = ratingMatrix.length;
                            setRatingMatrix([...ratingMatrix, { diff: nextDiff, winFav: 0, winUnd: 0, loseFav: 0, loseUnd: 0 }]);
                        }}>
                            <Icon icon="solar:add-circle-outline" className="mr-2" />
                            Thêm mức chênh lệch
                        </Button>
                        <Button color="blue" size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:diskette-outline" className="mr-2" />}
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
                                                type="text"
                                                className="w-12 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-left p-0 font-bold focus:border-blue-500 text-gray-900 dark:text-white"
                                                value={item.diff}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newMatrix = [...ratingMatrix];
                                                    newMatrix[idx].diff = val;
                                                    setRatingMatrix(newMatrix);
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg font-semibold"
                                            value={item.winFav}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newMatrix = [...ratingMatrix];
                                                newMatrix[idx].winFav = val;
                                                setRatingMatrix(newMatrix);
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg font-semibold"
                                            value={item.winUnd}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newMatrix = [...ratingMatrix];
                                                newMatrix[idx].winUnd = val;
                                                setRatingMatrix(newMatrix);
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg font-semibold"
                                            value={item.loseFav}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newMatrix = [...ratingMatrix];
                                                newMatrix[idx].loseFav = val;
                                                setRatingMatrix(newMatrix);
                                            }}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            className="w-24 bg-transparent border-none border-b border-dashed border-blue-400/50 focus:ring-0 text-center p-0 text-gray-700 dark:text-gray-300 focus:border-blue-500 text-lg font-semibold"
                                            value={item.loseUnd}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const newMatrix = [...ratingMatrix];
                                                newMatrix[idx].loseUnd = val;
                                                setRatingMatrix(newMatrix);
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

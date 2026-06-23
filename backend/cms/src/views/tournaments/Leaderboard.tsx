import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Table, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import CustomPagination from '../../components/shared/CustomPagination';
import { poolArenaUserAPI } from '../../api/poolArenaUser.api';
import type { PoolArenaUser } from '../../types/api';
import { defaultAvatar, GENDER_LABELS, getAvatarUrl } from '../../constants/shared';
import { formatLevel } from '../../utils/formatters';

const Leaderboard = () => {
    const [customers, setCustomers] = useState<PoolArenaUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await poolArenaUserAPI.getUsers({ limit: 10000 });
            const sortedData = (response.data?.data || []).sort(
                (a, b) => (b.points ?? 0) - (a.points ?? 0)
            );
            setCustomers(sortedData);
        } catch (_error) {
            toast.error('Không thể tải bảng xếp hạng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const filteredCustomers = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return customers;

        return customers.filter((customer) => {
            const haystack = [
                customer.full_name,
                customer.phone_number,
                customer.email || '',
                customer.rank || '',
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(keyword);
        });
    }, [customers, search]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);


    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        BẢNG XẾP HẠNG
                    </h1>
                </div>
                <button
                    onClick={fetchCustomers}
                    disabled={loading}
                    className="bg-[#C6010B] hover:bg-[#C6010B]/90 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:refresh-outline" className="text-xl" />
                        Làm mới
                    </div>
                </button>
            </div>

            <Card className="overflow-hidden rounded-lg shadow-sm">
                {/* Search - right aligned */}
                <div className="flex flex-col md:flex-row justify-end items-center gap-4 p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, SĐT, email, level"
                            icon={() => <Icon icon="solar:magnifer-outline" />}
                            className="w-full md:w-auto"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <Table.Head>
                            <Table.HeadCell className="w-20 text-center">Hạng</Table.HeadCell>
                            <Table.HeadCell className="w-20">Ảnh</Table.HeadCell>
                            <Table.HeadCell>Họ và tên</Table.HeadCell>
                            <Table.HeadCell>Số điện thoại</Table.HeadCell>
                            <Table.HeadCell>Email</Table.HeadCell>
                            <Table.HeadCell>Giới tính</Table.HeadCell>
                            <Table.HeadCell>Level</Table.HeadCell>
                            <Table.HeadCell className="text-right">Điểm</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredCustomers.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={8} className="text-center py-8 text-gray-500">
                                        Chưa có người chơi nào
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                currentCustomers.map((customer, idx) => {
                                    const actualRank = indexOfFirstItem + idx + 1;

                                    return (
                                        <Table.Row
                                            key={customer.id}
                                            className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <Table.Cell className="text-center">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    #{actualRank}
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div className="w-[60px] h-[75px] rounded overflow-hidden flex items-center justify-center">
                                                    <img
                                                        src={getAvatarUrl(customer.avatar_url)}
                                                        alt={customer.full_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = defaultAvatar;
                                                        }}
                                                    />
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell className="font-medium text-gray-900 dark:text-white">
                                                {customer.full_name}
                                            </Table.Cell>
                                            <Table.Cell>{customer.phone_number}</Table.Cell>
                                            <Table.Cell>{customer.email || '-'}</Table.Cell>
                                            <Table.Cell>{GENDER_LABELS[customer.gender || ''] || '-'}</Table.Cell>
                                            <Table.Cell>
                                                {customer.rank ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                                        {formatLevel(customer.rank)}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </Table.Cell>
                                            <Table.Cell className="text-right">
                                                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                                    {customer.points ?? 0}
                                                </span>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })
                            )}
                        </Table.Body>
                    </Table>
                </div>

                {filteredCustomers.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
                        <span className="text-sm text-[#37393E] dark:text-white/80">
                            Hiển thị {Math.min(indexOfLastItem, filteredCustomers.length) - indexOfFirstItem} / {filteredCustomers.length} người chơi
                            {search && ` (tìm kiếm: "${search}")`}
                        </span>
                        <CustomPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Leaderboard;

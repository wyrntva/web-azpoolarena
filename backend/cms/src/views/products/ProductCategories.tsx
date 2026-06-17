import { useState, useEffect } from 'react';
import { Button, Card, Modal, Label, TextInput, Textarea, Dropdown } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import CustomPagination from '../../components/shared/CustomPagination';
import { useCategories, Category } from '../../contexts/CategoryContext';
import { useProducts } from '../../contexts/ProductContext';

const ProductCategories = () => {
    const { categories, addCategory, updateCategory, deleteCategory, updateCategoryItemCount } = useCategories();
    const { products } = useProducts();
    const [openModal, setOpenModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const itemsPerPage = 10;
    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    // Sync category item counts whenever products change
    useEffect(() => {
        categories.forEach(category => {
            const count = products.filter(p => p.categoryId === category.id).length;
            if (category.itemCount !== count) {
                updateCategoryItemCount(category.id, count);
            }
        });
    }, [products, categories, updateCategoryItemCount]);

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setOpenModal(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
        });
        setOpenModal(true);
    };

    const handleDelete = (id: number) => {
        // Check if category has products
        const productsInCategory = products.filter(p => p.categoryId === id);
        if (productsInCategory.length > 0) {
            toast.error(`Không thể xóa danh mục có ${productsInCategory.length} mặt hàng`);
            return;
        }

        if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
            deleteCategory(id);
            toast.success('Xóa danh mục thành công');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        if (editingCategory) {
            updateCategory(editingCategory.id, formData);
            toast.success('Cập nhật danh mục thành công');
        } else {
            addCategory(formData);
            toast.success('Tạo danh mục thành công');
        }

        setOpenModal(false);
        setFormData({ name: '', description: '' });
    };

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        DANH MỤC MẶT HÀNG
                    </h1>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer"
                >
                    Tạo danh mục
                </button>
            </div>

            {/* Main Card */}
            <Card>
                {/* Tab */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex">
                        <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                            Tất cả danh mục
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Icon
                            icon="solar:magnifer-outline"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"
                        />
                        <input
                            type="text"
                            placeholder="Tìm kiếm danh mục"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300">
                            <tr>
                                <th className="p-4 font-semibold">Danh mục</th>
                                <th className="p-4 font-semibold text-right">Số lượng mặt hàng</th>
                                <th className="p-4 font-semibold text-right w-20">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {currentCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        Không tìm thấy danh mục nào
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <td className="p-4">
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {category.name}
                                            </span>
                                            {category.description && (
                                                <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-gray-900 dark:text-white">
                                            {category.itemCount}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Dropdown
                                                label=""
                                                dismissOnClick={true}
                                                renderTrigger={() => (
                                                    <button className="text-gray-500 hover:text-gray-700">
                                                        <Icon icon="solar:menu-dots-bold" className="text-xl" />
                                                    </button>
                                                )}
                                            >
                                                <Dropdown.Item onClick={() => handleEdit(category)}>
                                                    <Icon icon="solar:pen-outline" className="mr-2" />
                                                    Sửa
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDelete(category.id)}>
                                                    <Icon icon="solar:trash-bin-trash-outline" className="mr-2" />
                                                    Xóa
                                                </Dropdown.Item>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filteredCategories.length > 0 && (
                    <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Hiển thị từ {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, filteredCategories.length)} trên tổng {filteredCategories.length}
                        </span>
                        <CustomPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </Card>

            {/* Create/Edit Category Modal */}
            <Modal show={openModal} onClose={() => setOpenModal(false)}>
                <form onSubmit={handleSubmit}>
                    <Modal.Header>
                        {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="categoryName" value="Tên danh mục" className="mb-2 block" />
                                <TextInput
                                    id="categoryName"
                                    placeholder="Nhập tên danh mục"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="categoryDesc" value="Mô tả" className="mb-2 block" />
                                <Textarea
                                    id="categoryDesc"
                                    placeholder="Nhập mô tả (không bắt buộc)"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="justify-end">
                        <Button color="gray" onClick={() => setOpenModal(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" color="blue">
                            {editingCategory ? 'Cập nhật' : 'Tạo'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default ProductCategories;

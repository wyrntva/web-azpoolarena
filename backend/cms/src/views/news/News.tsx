import { useState, useRef } from 'react';
import { Button, Card, Table, Modal, TextInput, Label, Textarea, Badge, Pagination, Select, ToggleSwitch } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { newsAPI } from '../../api/news.api';
import { API_BASE } from '../../constants/shared';
import { cropImageToSize } from '../tournaments/utils/imageUtils';
import QuillEditor from '../../components/QuillEditor';

export interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
  content: string[];
  featured?: boolean;
}

const CATEGORIES = ['Tin tức', 'Giải đấu', 'Thông báo', 'Hướng dẫn & Mẹo', 'Khuyến mãi'];
const IMAGE_W = 1920;
const IMAGE_H = 450;

const emptyForm = {
  title: '',
  category: 'Tin tức',
  date: new Date().toLocaleDateString('vi-VN'),
  author: '',
  imageFile: null as File | null,
  imageUrl: '',
  excerpt: '',
  contentHtml: '',
  featured: false,
};

type FormState = typeof emptyForm;

const PAGE_SIZE = 10;

const News = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      category: article.category,
      date: article.date,
      author: article.author,
      imageFile: null,
      imageUrl: article.image,
      excerpt: article.excerpt,
      contentHtml: Array.isArray(article.content) ? article.content.join('\n') : (article.content || ''),
      featured: !!article.featured,
    });
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    e.target.value = '';
    if (!file) return;

    setImageUploading(true);
    try {
      const cropped = await cropImageToSize(file, IMAGE_W, IMAGE_H);
      const url = await newsAPI.uploadImage(cropped);
      setForm((f) => ({ ...f, imageFile: cropped, imageUrl: url }));
      toast.success('Đã tải ảnh lên');
    } catch {
      toast.error('Tải ảnh lên thất bại');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((f) => ({ ...f, imageFile: null, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (!form.author.trim()) { toast.error('Vui lòng nhập tác giả'); return; }
    if (!form.excerpt.trim()) { toast.error('Vui lòng nhập mô tả ngắn'); return; }
    if (!form.contentHtml.trim()) { toast.error('Vui lòng nhập nội dung bài viết'); return; }

    const articleData = {
      title: form.title,
      category: form.category,
      date: form.date,
      author: form.author,
      image: form.imageUrl,
      excerpt: form.excerpt,
      content: [form.contentHtml],
      featured: form.featured,
    };

    if (editingId !== null) {
      setArticles((prev) =>
        prev.map((a) => a.id === editingId ? { ...a, ...articleData } : a),
      );
      toast.success('Đã cập nhật bài viết');
    } else {
      setArticles((prev) => [{ id: String(Date.now()), ...articleData }, ...prev]);
      toast.success('Đã thêm bài viết');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingId !== null) {
      setArticles((prev) => prev.filter((a) => a.id !== deletingId));
      toast.success('Đã xóa bài viết');
    }
    setDeleteModalOpen(false);
  };

  const resolvedPreview = form.imageUrl
    ? form.imageUrl.startsWith('http') ? form.imageUrl : `${API_BASE}${form.imageUrl}`
    : null;

  return (
    <div className="pt-0 px-6 pb-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
            DANH SÁCH TIN TỨC
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Icon icon="solar:add-circle-outline" className="text-xl" />
            Thêm bài viết
          </div>
        </button>
      </div>

      {/* Card: Search + Table + Footer */}
      <Card className="overflow-hidden rounded-lg shadow-sm">
        {/* Search - right aligned */}
        <div className="flex flex-col md:flex-row justify-end items-center gap-4 p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <TextInput
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              icon={() => <Icon icon="solar:magnifer-outline" />}
              className="w-full md:w-auto"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell className="text-center">STT</Table.HeadCell>
              <Table.HeadCell className="text-center">TIÊU ĐỀ</Table.HeadCell>
              <Table.HeadCell className="text-center">DANH MỤC</Table.HeadCell>
              <Table.HeadCell className="text-center">TÁC GIẢ</Table.HeadCell>
              <Table.HeadCell className="text-center">NGÀY</Table.HeadCell>
              <Table.HeadCell className="text-center">NỔI BẬT</Table.HeadCell>
              <Table.HeadCell className="text-center">HÀNH ĐỘNG</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {paginated.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    {search ? 'Không tìm thấy kết quả' : 'Chưa có bài viết nào'}
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginated.map((article, index) => (
                  <Table.Row key={article.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="text-center text-[#37393E] dark:text-white/80">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-[#37393E] dark:text-white max-w-xs truncate">
                      {article.title}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Badge color="indigo">{article.category}</Badge>
                    </Table.Cell>
                    <Table.Cell className="text-center text-[#37393E] dark:text-white/80">{article.author}</Table.Cell>
                    <Table.Cell className="text-center text-[#37393E] dark:text-white/80 whitespace-nowrap">{article.date}</Table.Cell>
                    <Table.Cell className="text-center">
                      {article.featured ? <Badge color="warning">Nổi bật</Badge> : <span className="text-gray-300">—</span>}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <button onClick={() => openEdit(article)} className="font-medium text-[#3E26FF] hover:underline cursor-pointer">
                          Chỉnh sửa
                        </button>
                        <button onClick={() => openDelete(article.id)} className="font-medium text-[#C6010B] hover:underline cursor-pointer">
                          Xóa
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
          <span className="text-sm text-[#37393E] dark:text-white/80">
            Hiển thị {filtered.length} / {articles.length} bài viết
            {search && ` (tìm kiếm: "${search}")`}
          </span>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} showIcons />
          )}
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Modal show={modalOpen} onClose={() => setModalOpen(false)} size="3xl">
        <Modal.Header>{editingId !== null ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">

            {/* Title */}
            <div>
              <Label htmlFor="n-title" value="Tiêu đề *" />
              <TextInput
                id="n-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Nhập tiêu đề bài viết"
              />
            </div>

            {/* Category + Author */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="n-category" value="Danh mục *" />
                <Select id="n-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="n-author" value="Tác giả *" />
                <TextInput
                  id="n-author"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="VD: Ban Tổ Chức"
                />
              </div>
            </div>

            {/* Date */}
            <div className="max-w-xs">
              <Label htmlFor="n-date" value="Ngày đăng *" />
              <TextInput
                id="n-date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                placeholder="VD: 22/06/2026"
              />
            </div>

            {/* Image upload */}
            <div>
              <Label value={`Ảnh bìa (${IMAGE_W}×${IMAGE_H}px)`} />
              <div className="mt-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    id="n-image-input"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    type="button"
                    color="light"
                    size="sm"
                    disabled={imageUploading}
                    onClick={() => document.getElementById('n-image-input')?.click()}
                  >
                    {imageUploading ? (
                      <>
                        <Icon icon="solar:refresh-circle-outline" className="mr-2 h-4 w-4 animate-spin" />
                        Đang tải lên...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:gallery-outline" className="mr-2 h-4 w-4" />
                        Chọn ảnh
                      </>
                    )}
                  </Button>
                  {form.imageUrl && (
                    <Button type="button" color="failure" size="sm" onClick={handleRemoveImage}>
                      <Icon icon="solar:trash-bin-minimalistic-outline" className="mr-2 h-4 w-4" />
                      Xóa ảnh
                    </Button>
                  )}
                  <span className="text-xs text-gray-400">Ảnh sẽ tự động crop {IMAGE_W}×{IMAGE_H}px</span>
                </div>

                {resolvedPreview && (
                  <div
                    className="w-full overflow-hidden rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                    style={{ aspectRatio: `${IMAGE_W} / ${IMAGE_H}` }}
                  >
                    <img
                      src={resolvedPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="n-excerpt" value="Mô tả ngắn (excerpt) *" />
              <Textarea
                id="n-excerpt"
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Tóm tắt nội dung hiển thị trên danh sách tin..."
              />
            </div>

            {/* Content rich text */}
            <div>
              <Label value="Nội dung bài viết *" className="mb-1 block" />
              <QuillEditor
                value={form.contentHtml}
                onChange={(html) => setForm((f) => ({ ...f, contentHtml: html }))}
                placeholder="Nhập nội dung bài viết..."
                minHeight={240}
              />
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3">
              <ToggleSwitch
                checked={form.featured}
                label="Đánh dấu là bài viết nổi bật"
                onChange={(val) => setForm((f) => ({ ...f, featured: val }))}
              />
            </div>

          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleSave} disabled={imageUploading}>Lưu</Button>
          <Button color="gray" onClick={() => setModalOpen(false)}>Hủy</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} size="sm">
        <Modal.Header>Xác nhận xóa</Modal.Header>
        <Modal.Body>
          <p className="text-gray-600 dark:text-gray-400">Bạn có chắc muốn xóa bài viết này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleDelete}>Xóa</Button>
          <Button color="gray" onClick={() => setDeleteModalOpen(false)}>Hủy</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default News;

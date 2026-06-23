import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Card, Table, Modal, TextInput, Label, Textarea, Badge, Pagination, Select, ToggleSwitch } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { newsAPI, type NewsArticle, type NewsPayload } from '../../api/news.api';
import { API_BASE } from '../../constants/shared';
import { cropImageToSize } from '../tournaments/utils/imageUtils';
import QuillEditor from '../../components/QuillEditor';

const CATEGORIES = ['Tin tức', 'Giải đấu', 'Thông báo', 'Hướng dẫn & Mẹo', 'Khuyến mãi'];
const IMAGE_W = 1920;
const IMAGE_H = 450;
const PAGE_SIZE = 10;

const FB_IMAGE_W = 1200;
const FB_IMAGE_H = 630;

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
  postToFanpage: false,
  fanpageImageUrl: '',
};

type FormState = typeof emptyForm;

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [fanpageImageUploading, setFanpageImageUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fanpageFileInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchArticles = useCallback(async (page: number, q: string) => {
    setLoading(true);
    try {
      const res = await newsAPI.getAll(page, PAGE_SIZE, q);
      setArticles(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(currentPage, search);
  }, [currentPage, search, fetchArticles]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (article: NewsArticle) => {
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
      postToFanpage: !!article.fanpage_image,
      fanpageImageUrl: article.fanpage_image || '',
    });
    setModalOpen(true);
  };

  const openDelete = (id: number) => {
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

  const handleFanpageImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFanpageImageUploading(true);
    try {
      const url = await newsAPI.uploadImage(file);
      setForm((f) => ({ ...f, fanpageImageUrl: url }));
      toast.success('Đã tải ảnh fanpage lên');
    } catch {
      toast.error('Tải ảnh fanpage thất bại');
    } finally {
      setFanpageImageUploading(false);
    }
  };

  const handleRemoveFanpageImage = () => {
    setForm((f) => ({ ...f, fanpageImageUrl: '' }));
    if (fanpageFileInputRef.current) fanpageFileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (!form.author.trim()) { toast.error('Vui lòng nhập tác giả'); return; }
    if (!form.excerpt.trim()) { toast.error('Vui lòng nhập mô tả ngắn'); return; }
    if (!form.contentHtml.trim()) { toast.error('Vui lòng nhập nội dung bài viết'); return; }

    const payload: NewsPayload = {
      title: form.title,
      category: form.category,
      date: form.date,
      author: form.author,
      image: form.imageUrl,
      excerpt: form.excerpt,
      content: [form.contentHtml],
      featured: form.featured,
      fanpage_image: form.postToFanpage ? form.fanpageImageUrl : '',
      post_to_fanpage: form.postToFanpage,
    };

    setSaving(true);
    try {
      if (editingId !== null) {
        await newsAPI.update(editingId, payload);
        toast.success('Đã cập nhật bài viết');
      } else {
        await newsAPI.create(payload);
        toast.success('Đã thêm bài viết');
      }
      setModalOpen(false);
      fetchArticles(currentPage, search);
    } catch {
      toast.error('Lưu bài viết thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      await newsAPI.delete(deletingId);
      toast.success('Đã xóa bài viết');
      setDeleteModalOpen(false);
      const newPage = articles.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchArticles(newPage, search);
    } catch {
      toast.error('Xóa bài viết thất bại');
      setDeleteModalOpen(false);
    }
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
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
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
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6010B]"></div>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : articles.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    {search ? 'Không tìm thấy kết quả' : 'Chưa có bài viết nào'}
                  </Table.Cell>
                </Table.Row>
              ) : (
                articles.map((article, index) => (
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
            Hiển thị {articles.length} / {total} bài viết
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

            {/* Post to Fanpage */}
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-3 mb-1">
                <ToggleSwitch
                  checked={form.postToFanpage}
                  label=""
                  onChange={(val) => setForm((f) => ({ ...f, postToFanpage: val }))}
                />
                <div className="flex items-center gap-2">
                  <Icon icon="logos:facebook" className="text-xl" />
                  <span className="font-medium text-[#37393E] dark:text-white">Đăng fanpage</span>
                </div>
              </div>

              {form.postToFanpage && (
                <div className="mt-3">
                  <Label value={`Ảnh bài đăng Facebook (${FB_IMAGE_W}×${FB_IMAGE_H}px)`} />
                  <div className="mt-1 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        ref={fanpageFileInputRef}
                        type="file"
                        accept="image/*"
                        id="n-fanpage-image-input"
                        className="hidden"
                        onChange={handleFanpageImageSelect}
                      />
                      <Button
                        type="button"
                        color="light"
                        size="sm"
                        disabled={fanpageImageUploading}
                        onClick={() => document.getElementById('n-fanpage-image-input')?.click()}
                      >
                        {fanpageImageUploading ? (
                          <>
                            <Icon icon="solar:refresh-circle-outline" className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải lên...
                          </>
                        ) : (
                          <>
                            <Icon icon="solar:gallery-outline" className="mr-2 h-4 w-4" />
                            Chọn ảnh Facebook
                          </>
                        )}
                      </Button>
                      {form.fanpageImageUrl && (
                        <Button type="button" color="failure" size="sm" onClick={handleRemoveFanpageImage}>
                          <Icon icon="solar:trash-bin-minimalistic-outline" className="mr-2 h-4 w-4" />
                          Xóa ảnh
                        </Button>
                      )}
                      <span className="text-xs text-gray-400">Khuyến nghị {FB_IMAGE_W}×{FB_IMAGE_H}px</span>
                    </div>

                    {form.fanpageImageUrl && (
                      <div
                        className="w-full overflow-hidden rounded border border-blue-300 dark:border-blue-700 bg-gray-50 dark:bg-gray-800"
                        style={{ aspectRatio: `${FB_IMAGE_W} / ${FB_IMAGE_H}` }}
                      >
                        <img
                          src={form.fanpageImageUrl.startsWith('http') ? form.fanpageImageUrl : `${API_BASE}${form.fanpageImageUrl}`}
                          alt="Facebook preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
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
          <Button color="primary" onClick={handleSave} disabled={imageUploading || saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
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

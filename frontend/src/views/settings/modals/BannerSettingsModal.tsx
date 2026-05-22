/**
 * Banner Settings Modal — manages uploading/deleting banners for scoreboard, tournament, and ranking.
 */
import { Button, Label } from 'flowbite-react';
import { Icon } from '@iconify/react';
import BaseDialog from '../../../components/shared/BaseDialog';
import { type StoreSettings, storeSettingsAPI } from '../../../api/storeSettings.api';
import { cropImageForBannerType, type BannerType } from '../../../utils/bannerUtils';
import toast from 'react-hot-toast';

interface BannerSettingsModalProps {
    open: boolean;
    onClose: () => void;
    storeSettings: StoreSettings | null;
    onSettingsChange: (settings: StoreSettings) => void;
    onReload: () => void;
}

// ============================================
// HELPERS
// ============================================

function resolveBannerUrl(url: string): string {
    if (url.startsWith('/')) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        return `${apiUrl}${url}`;
    }
    return url;
}

function getBannerUrls(settings: StoreSettings | null, type: 'scoreboard' | 'tournament'): string[] {
    if (!settings) return [];
    const field = `banner_${type}` as keyof StoreSettings;
    const urlValue = settings[field] as string | null;
    if (!urlValue) return [];

    try {
        const urls = JSON.parse(urlValue);
        if (Array.isArray(urls)) return urls.map(resolveBannerUrl);
    } catch {
        // Backward compatibility: single string
        return [resolveBannerUrl(urlValue)];
    }
    return [];
}

function getSingleBannerUrl(settings: StoreSettings | null, type: 'ranking' | 'member'): string {
    if (!settings) return '';
    const field = `banner_${type}` as keyof StoreSettings;
    const url = settings[field] as string | null;
    if (!url) return '';
    return resolveBannerUrl(url);
}

// ============================================
// COMPONENT
// ============================================

const BannerSettingsModal = ({
    open,
    onClose,
    storeSettings,
    onSettingsChange,
    onReload,
}: BannerSettingsModalProps) => {
    const [loading, setLoading] = React.useState(false);
    const [uploadingBanners, setUploadingBanners] = React.useState<Record<string, boolean>>({});

    const handleDeleteBanner = async (type: 'scoreboard' | 'tournament', index: number) => {
        try {
            setLoading(true);
            const response = await storeSettingsAPI.deleteBanner(type, index);
            onSettingsChange(response.data);
            toast.success('Đã xóa banner');
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể xóa banner');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSingleBanner = async (type: 'ranking' | 'member') => {
        try {
            setLoading(true);
            const response = await storeSettingsAPI.deleteSingleBanner(type);
            onSettingsChange(response.data);
            toast.success('Đã xóa banner');
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể xóa banner');
        } finally {
            setLoading(false);
        }
    };

    const handleBannerUpload = async (type: BannerType, file: File) => {
        try {
            setUploadingBanners(prev => ({ ...prev, [type]: true }));
            const croppedFile = await cropImageForBannerType(type, file);
            const response = await storeSettingsAPI.uploadBanner(type, croppedFile);
            onSettingsChange(response.data);
            toast.success('Tải banner lên thành công');
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải banner lên');
        } finally {
            setUploadingBanners(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleMultipleBannerUpload = async (type: 'scoreboard' | 'tournament', files: FileList) => {
        const fileArray = Array.from(files);
        try {
            setUploadingBanners(prev => ({ ...prev, [type]: true }));
            const croppedFiles: File[] = [];
            for (const file of fileArray) {
                try {
                    const cropped = await cropImageForBannerType(type, file);
                    croppedFiles.push(cropped);
                } catch {
                    // ignore
                }
            }
            if (croppedFiles.length === 0) {
                toast.error('Không thể xử lý ảnh để tải lên');
                return;
            }
            let latestSettings: StoreSettings | null = null;
            let successCount = 0;
            let failCount = 0;
            for (const cropped of croppedFiles) {
                try {
                    const response = await storeSettingsAPI.uploadBanner(type, cropped);
                    latestSettings = response.data;
                    successCount++;
                } catch {
                    failCount++;
                }
            }
            if (latestSettings) {
                onSettingsChange(latestSettings);
            } else {
                onReload();
            }
            if (successCount > 0 && failCount === 0) {
                toast.success(`Đã tải lên ${successCount} banner thành công`);
            } else if (successCount > 0) {
                toast.error(`Đã tải lên ${successCount} banner, thất bại ${failCount} banner`);
            } else {
                toast.error('Không thể tải banner lên');
            }
        } catch (error) {
            toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Không thể tải banner lên');
        } finally {
            setUploadingBanners(prev => ({ ...prev, [type]: false }));
        }
    };

    const scoreboardUrls = getBannerUrls(storeSettings, 'scoreboard');
    const tournamentUrls = getBannerUrls(storeSettings, 'tournament');
    const rankingUrl = getSingleBannerUrl(storeSettings, 'ranking');

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title="Thiết lập banner quảng cáo"
            size="2xl"
            showFooter={false}
            bodyClassName="space-y-6"
        >
            {/* Scoreboard Banners */}
            <MultiBannerSection
                label="Banner thiết bị quảng cáo và bảng tỉ số"
                sizeHint="1920x1080"
                urls={scoreboardUrls}
                inputId="banner-scoreboard"
                uploading={!!uploadingBanners.scoreboard}
                loading={loading}
                onUpload={(files) => handleMultipleBannerUpload('scoreboard', files)}
                onDelete={(index) => handleDeleteBanner('scoreboard', index)}
            />

            {/* Tournament Banners */}
            <MultiBannerSection
                label="Banner chính (giải đấu, scoreboard, member...)"
                sizeHint="1360x280"
                urls={tournamentUrls}
                inputId="banner-tournament"
                uploading={!!uploadingBanners.tournament}
                loading={loading}
                onUpload={(files) => handleMultipleBannerUpload('tournament', files)}
                onDelete={(index) => handleDeleteBanner('tournament', index)}
            />

            {/* Ranking Banner */}
            <SingleBannerSection
                label="Banner bảng xếp hạng"
                sizeHint="1920x400"
                url={rankingUrl}
                inputId="banner-ranking"
                uploading={!!uploadingBanners.ranking}
                loading={loading}
                onUpload={(file) => handleBannerUpload('ranking', file)}
                onDelete={() => handleDeleteSingleBanner('ranking')}
            />
        </BaseDialog>
    );
};

export default BannerSettingsModal;

// ============================================
// NEED React import
// ============================================
import React from 'react';

// ============================================
// REUSABLE BANNER SECTIONS
// ============================================

function MultiBannerSection({ label, sizeHint, urls, inputId, uploading, loading, onUpload, onDelete }: {
    label: string;
    sizeHint: string;
    urls: string[];
    inputId: string;
    uploading: boolean;
    loading: boolean;
    onUpload: (files: FileList) => void;
    onDelete: (index: number) => void;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">
                {label} <span className="text-sm font-normal text-gray-500">(Kích thước chuẩn: {sizeHint})</span>
            </Label>
            {urls.length > 0 && (
                <div className="grid grid-cols-1 gap-3 mb-2">
                    {urls.map((url, index) => (
                        <BannerPreview key={index} url={url} alt={`${label} ${index + 1}`} loading={loading} onDelete={() => onDelete(index)} />
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <input type="file" accept="image/*" id={inputId} className="hidden" multiple onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) onUpload(files);
                    e.target.value = '';
                }} />
                <UploadButton inputId={inputId} uploading={uploading} label={urls.length > 0 ? 'Thêm banner' : 'Tải banner lên'} />
            </div>
        </div>
    );
}

function SingleBannerSection({ label, sizeHint, url, inputId, uploading, loading, onUpload, onDelete }: {
    label: string;
    sizeHint: string;
    url: string;
    inputId: string;
    uploading: boolean;
    loading: boolean;
    onUpload: (file: File) => void;
    onDelete: () => void;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">
                {label} <span className="text-sm font-normal text-gray-500">(Kích thước chuẩn: {sizeHint})</span>
            </Label>
            {url && <BannerPreview url={url} alt={label} loading={loading} onDelete={onDelete} />}
            <div className="flex gap-2">
                <input type="file" accept="image/*" id={inputId} className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                    e.target.value = '';
                }} />
                <UploadButton inputId={inputId} uploading={uploading} label={url ? 'Thay đổi banner' : 'Tải banner lên'} />
            </div>
        </div>
    );
}

function BannerPreview({ url, alt, loading, onDelete }: { url: string; alt: string; loading: boolean; onDelete: () => void }) {
    return (
        <div className="mb-2 relative group">
            <img src={url} alt={alt} className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
            <button
                type="button"
                onClick={onDelete}
                disabled={loading}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
                <Icon icon="solar:trash-bin-minimalistic-outline" className="w-4 h-4" />
            </button>
        </div>
    );
}

function UploadButton({ inputId, uploading, label }: { inputId: string; uploading: boolean; label: string }) {
    return (
        <Button
            type="button"
            color="light"
            size="sm"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById(inputId)?.click();
            }}
            onFocus={(e) => e.target.blur()}
            disabled={uploading}
            className="focus:outline-none focus:ring-0"
        >
            {uploading ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                    Đang tải...
                </>
            ) : (
                <>
                    <Icon icon="solar:gallery-outline" className="mr-2" />
                    {label}
                </>
            )}
        </Button>
    );
}

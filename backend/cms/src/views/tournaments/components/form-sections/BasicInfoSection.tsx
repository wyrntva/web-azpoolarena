/**
 * BasicInfoSection — Section 1: Thông tin cơ bản (name, slug, banner, logo, sponsor logos)
 */
import { Button, TextInput, Label } from 'flowbite-react';
import { Icon } from '@iconify/react';
import type { TournamentFormData } from '../../types';
import { API_BASE } from '../../../../constants/shared';

interface BasicInfoSectionProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
    handleNameChange: (value: string) => void;
    handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleOrganizerLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDetailLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSponsorLogosChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveSponsorLogo: (index: number) => void;
    handleRemoveBanner: () => void;
    handleRemoveOrganizerLogo: () => void;
    handleRemoveDetailLogo: () => void;
}

export default function BasicInfoSection({
    formData, setFormData,
    handleNameChange, handleBannerChange, handleOrganizerLogoChange,
    handleDetailLogoChange, handleSponsorLogosChange, handleRemoveSponsorLogo,
    handleRemoveBanner, handleRemoveOrganizerLogo, handleRemoveDetailLogo,
}: BasicInfoSectionProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name" className="mb-2 block text-blue-600 dark:text-blue-400">
                        Tên giải đấu <span className="text-red-500">(*)</span>
                    </Label>
                    <TextInput
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="slug" className="mb-2 block">Slug</Label>
                    <TextInput
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Banner */}
                <div>
                    <Label htmlFor="banner" className="mb-2 block">
                        Banner giải đấu <span className="text-xs text-gray-500">(1920x450px)</span>
                    </Label>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <input type="file" accept="image/*" id="banner" onChange={handleBannerChange} className="hidden" />
                            <Button
                                type="button" color="light" size="sm"
                                onClick={(e) => { e.preventDefault(); document.getElementById('banner')?.click(); }}
                                onFocus={(e) => e.target.blur()}
                                className="focus:outline-none focus:ring-0"
                            >
                                <Icon icon="solar:gallery-outline" className="mr-2" />
                                Chọn banner
                            </Button>
                            {(formData.banner instanceof File || (typeof formData.banner === 'string' && formData.banner)) && (
                                <Button type="button" color="failure" size="sm" onClick={handleRemoveBanner}>
                                    <Icon icon="solar:trash-bin-minimalistic-outline" className="mr-2" />
                                    Xóa banner
                                </Button>
                            )}
                        </div>
                        {(formData.banner instanceof File || (typeof formData.banner === 'string' && formData.banner)) && (
                            <div className="w-full max-w-[384px] h-[90px] border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                {formData.banner instanceof File ? (
                                    <img src={URL.createObjectURL(formData.banner)} alt={formData.banner.name} className="w-full h-full object-cover" />
                                ) : typeof formData.banner === 'string' ? (
                                    <img
                                        src={formData.banner.startsWith('http') ? formData.banner : `${API_BASE}${formData.banner}`}
                                        alt="Banner" className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">Preview</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Organizer Logo */}
                <div>
                    <Label htmlFor="organizer_logo" className="mb-2 block">
                        Logo giải đấu <span className="text-xs text-gray-500">(300x100px)</span>
                    </Label>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <input type="file" accept="image/*" id="organizer_logo" onChange={handleOrganizerLogoChange} className="hidden" />
                            <Button
                                type="button" color="light" size="sm"
                                onClick={(e) => { e.preventDefault(); document.getElementById('organizer_logo')?.click(); }}
                                onFocus={(e) => e.target.blur()}
                                className="focus:outline-none focus:ring-0"
                            >
                                <Icon icon="solar:gallery-outline" className="mr-2" />
                                Chọn logo
                            </Button>
                            {(formData.organizer_logo instanceof File || (typeof formData.organizer_logo === 'string' && formData.organizer_logo)) && (
                                <Button type="button" color="failure" size="sm" onClick={handleRemoveOrganizerLogo}>
                                    <Icon icon="solar:trash-bin-minimalistic-outline" className="mr-2" />
                                    Xóa logo
                                </Button>
                            )}
                        </div>
                        {(formData.organizer_logo instanceof File || (typeof formData.organizer_logo === 'string' && formData.organizer_logo)) && (
                            <div className="w-[150px] h-[50px] border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                {formData.organizer_logo instanceof File ? (
                                    <img src={URL.createObjectURL(formData.organizer_logo)} alt={formData.organizer_logo.name} className="w-full h-full object-cover" />
                                ) : typeof formData.organizer_logo === 'string' ? (
                                    <img
                                        src={formData.organizer_logo.startsWith('http') ? formData.organizer_logo : `${API_BASE}${formData.organizer_logo}`}
                                        alt="Logo" className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">Preview</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Logo */}
                <div>
                    <Label htmlFor="detail_logo" className="mb-2 block">
                        Logo trang giải <span className="text-xs text-gray-500">(300x100px)</span>
                    </Label>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <input type="file" accept="image/*" id="detail_logo" onChange={handleDetailLogoChange} className="hidden" />
                            <Button
                                type="button" color="light" size="sm"
                                onClick={(e) => { e.preventDefault(); document.getElementById('detail_logo')?.click(); }}
                                onFocus={(e) => e.target.blur()}
                                className="focus:outline-none focus:ring-0"
                            >
                                <Icon icon="solar:gallery-outline" className="mr-2" />
                                Chọn logo
                            </Button>
                            {(formData.detail_logo instanceof File || (typeof formData.detail_logo === 'string' && formData.detail_logo)) && (
                                <Button type="button" color="failure" size="sm" onClick={handleRemoveDetailLogo}>
                                    <Icon icon="solar:trash-bin-minimalistic-outline" className="mr-2" />
                                    Xóa logo
                                </Button>
                            )}
                        </div>
                        {(formData.detail_logo instanceof File || (typeof formData.detail_logo === 'string' && formData.detail_logo)) && (
                            <div className="w-[150px] h-[50px] border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                {formData.detail_logo instanceof File ? (
                                    <img src={URL.createObjectURL(formData.detail_logo)} alt={formData.detail_logo.name} className="w-full h-full object-cover" />
                                ) : typeof formData.detail_logo === 'string' ? (
                                    <img
                                        src={formData.detail_logo.startsWith('http') ? formData.detail_logo : `${API_BASE}${formData.detail_logo}`}
                                        alt="Logo trang giải" className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">Preview</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sponsor Logos */}
                <div>
                    <Label htmlFor="sponsor_logos" className="mb-2 block">
                        Logo nhà tài trợ <span className="text-xs text-gray-500">(220x100px)</span>
                    </Label>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <input type="file" accept="image/*" id="sponsor_logos" multiple onChange={handleSponsorLogosChange} className="hidden" />
                            <Button
                                type="button" color="light" size="sm"
                                onClick={(e) => { e.preventDefault(); document.getElementById('sponsor_logos')?.click(); }}
                                onFocus={(e) => e.target.blur()}
                                className="focus:outline-none focus:ring-0"
                            >
                                <Icon icon="solar:gallery-outline" className="mr-2" />
                                Chọn logo
                            </Button>
                        </div>
                        {formData.sponsor_logos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.sponsor_logos.map((logo, index) => (
                                    <div key={index} className="relative group">
                                        <div className="w-[110px] h-[50px] border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                            {logo instanceof File ? (
                                                <img src={URL.createObjectURL(logo)} alt={logo.name} className="w-full h-full object-cover" />
                                            ) : typeof logo === 'string' ? (
                                                <img
                                                    src={logo.startsWith('http') ? logo : `${API_BASE}${logo}`}
                                                    alt={`Sponsor ${index + 1}`} className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400">Preview</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSponsorLogo(index)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Xóa logo"
                                        >
                                            <Icon icon="solar:close-circle-bold" className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

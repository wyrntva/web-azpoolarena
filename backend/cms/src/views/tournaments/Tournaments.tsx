import { useState, useEffect, useCallback } from 'react';
import { Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import BaseDialog from '../../components/shared/BaseDialog';
import TournamentTable from './components/TournamentTable';
import { useTournamentForm } from './hooks/useTournamentForm';
import TournamentForm from './components/TournamentForm';
import { tournamentAPI, type Tournament } from '../../api/tournament.api';

interface TournamentsProps {
    category?: 'tournament' | 'event';
}

const Tournaments = ({ category = 'tournament' }: TournamentsProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [total, setTotal] = useState(0);
    
    const {
        formData,
        setFormData,
        ranks,
        loadedTournament,
        handleRankToggle,
        handleBannerChange,
        handleOrganizerLogoChange,
        handleDetailLogoChange,
        handleSponsorLogosChange,
        handleRemoveSponsorLogo,
        handleRemoveBanner,
        handleRemoveOrganizerLogo,
        handleRemoveDetailLogo,
        handleCurrencyChange,
        getFormattedValue,
        handleSubmit,
        resetForm,
        handleNameChange,
        handleStartDateChange,
        loadTournament,
        submitting,
    } = useTournamentForm(category);

    const onPageChange = (page: number) => setCurrentPage(page);

    const fetchTournaments = useCallback(async () => {
        try {
            const response = await tournamentAPI.getTournaments({ skip: (currentPage - 1) * 10, limit: 10, category });
            setTournaments(response.data?.data || []);
            setTotal(response.data?.meta?.total || 0);
        } catch {
            // Error handled silently
        }
    }, [currentPage, category]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) {
                fetchTournaments();
            }
        });
        return () => {
            active = false;
        };
    }, [fetchTournaments]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await handleSubmit(e);
            setModalOpen(false);
            await fetchTournaments();
        } catch {
            toast.error(category === 'event' ? 'Không thể thêm sự kiện. Vui lòng thử lại.' : 'Không thể thêm giải đấu. Vui lòng thử lại.');
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentTournamentId && loadedTournament) {
                await handleSubmit(e, currentTournamentId, loadedTournament);
                setUpdateModalOpen(false);
                setCurrentTournamentId(null);
                await fetchTournaments();
            }
        } catch {
            toast.error(category === 'event' ? 'Không thể cập nhật sự kiện. Vui lòng thử lại.' : 'Không thể cập nhật giải đấu. Vui lòng thử lại.');
        }
    };

    const handleCloseDialog = () => {
        setModalOpen(false);
        resetForm();
    };

    const handleCloseUpdateDialog = () => {
        setUpdateModalOpen(false);
        setCurrentTournamentId(null);
        resetForm();
    };

    const handleUpdateClick = async (tournamentId: number) => {
        try {
            await loadTournament(tournamentId);
            setCurrentTournamentId(tournamentId);
            setUpdateModalOpen(true);
        } catch (_error) {
            toast.error(category === 'event' ? 'Không thể tải thông tin sự kiện. Vui lòng thử lại.' : 'Không thể tải thông tin giải đấu. Vui lòng thử lại.');
        }
    };

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        {category === 'event' ? 'DANH SÁCH SỰ KIỆN' : 'DANH SÁCH GIẢI ĐẤU'}
                    </h1>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:add-circle-outline" className="text-xl" />
                        {category === 'event' ? 'Thêm Sự kiện' : 'Thêm Giải đấu'}
                    </div>
                </button>
            </div>

            {/* Table */}
            <TournamentTable
                tournaments={tournaments}
                total={total}
                currentPage={currentPage}
                category={category}
                onPageChange={onPageChange}
                onRefresh={fetchTournaments}
                onUpdate={handleUpdateClick}
            />

            {/* Add Tournament Dialog */}
            <BaseDialog
                open={modalOpen}
                onClose={handleCloseDialog}
                title={category === 'event' ? "Thêm sự kiện" : "Thêm giải đấu"}
                size="6xl"
                showFooter={true}
                footer={
                    <>
                        <Button type="button" color="gray" onClick={handleCloseDialog} disabled={submitting}>
                            Hủy
                        </Button>
                        <Button type="submit" form="tournament-form" color="blue" disabled={submitting}>
                            {submitting ? 'Đang lưu...' : 'Lưu và trở lại'}
                        </Button>
                    </>
                }
            >
                <TournamentForm
                    formData={formData}
                    setFormData={setFormData}
                    ranks={ranks}
                    handleRankToggle={handleRankToggle}
                    handleBannerChange={handleBannerChange}
                    handleOrganizerLogoChange={handleOrganizerLogoChange}
                    handleDetailLogoChange={handleDetailLogoChange}
                    handleSponsorLogosChange={handleSponsorLogosChange}
                    handleRemoveSponsorLogo={handleRemoveSponsorLogo}
                    handleRemoveBanner={handleRemoveBanner}
                    handleRemoveOrganizerLogo={handleRemoveOrganizerLogo}
                    handleRemoveDetailLogo={handleRemoveDetailLogo}
                    handleCurrencyChange={handleCurrencyChange}
                    getFormattedValue={getFormattedValue}
                    handleSubmit={handleFormSubmit}
                    handleNameChange={handleNameChange}
                    handleStartDateChange={handleStartDateChange}
                    isEvent={category === 'event'}
                />
            </BaseDialog>

            {/* Update Tournament Dialog */}
            <BaseDialog
                open={updateModalOpen}
                onClose={handleCloseUpdateDialog}
                title={category === 'event' ? "Cập nhật sự kiện" : "Cập nhật giải đấu"}
                size="6xl"
                showFooter={true}
                footer={
                    <>
                        <Button type="button" color="gray" onClick={handleCloseUpdateDialog} disabled={submitting}>
                            Hủy
                        </Button>
                        <Button type="submit" form="tournament-form" color="blue" disabled={submitting}>
                            {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                    </>
                }
            >
                <TournamentForm
                    formData={formData}
                    setFormData={setFormData}
                    ranks={ranks}
                    handleRankToggle={handleRankToggle}
                    handleBannerChange={handleBannerChange}
                    handleOrganizerLogoChange={handleOrganizerLogoChange}
                    handleDetailLogoChange={handleDetailLogoChange}
                    handleSponsorLogosChange={handleSponsorLogosChange}
                    handleRemoveSponsorLogo={handleRemoveSponsorLogo}
                    handleRemoveBanner={handleRemoveBanner}
                    handleRemoveOrganizerLogo={handleRemoveOrganizerLogo}
                    handleRemoveDetailLogo={handleRemoveDetailLogo}
                    handleCurrencyChange={handleCurrencyChange}
                    getFormattedValue={getFormattedValue}
                    handleSubmit={handleUpdateSubmit}
                    handleNameChange={handleNameChange}
                    handleStartDateChange={handleStartDateChange}
                    isEvent={category === 'event'}
                />
            </BaseDialog>
        </div>
    );
};

export default Tournaments;

import { useState, useEffect, useCallback } from 'react';
import { Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import BaseDialog from '../../components/shared/BaseDialog';
import TournamentTable from './components/TournamentTable';
import { useTournamentForm } from './hooks/useTournamentForm';
import TournamentForm from './components/TournamentForm';
import { tournamentAPI, type Tournament } from '../../api/tournament.api';

const Tournaments = () => {
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
    } = useTournamentForm();

    const onPageChange = (page: number) => setCurrentPage(page);

    const fetchTournaments = useCallback(async () => {
        try {
            const response = await tournamentAPI.getTournaments({ skip: (currentPage - 1) * 10, limit: 10 });
            setTournaments(response.data?.data || []);
            setTotal(response.data?.meta?.total || 0);
        } catch {
            // Error handled silently
        }
    }, [currentPage]);

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
            toast.error('Không thể thêm giải đấu. Vui lòng thử lại.');
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
            toast.error('Không thể cập nhật giải đấu. Vui lòng thử lại.');
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
            toast.error('Không thể tải thông tin giải đấu. Vui lòng thử lại.');
        }
    };

    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        DANH SÁCH GIẢI ĐẤU
                    </h1>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#C6010B] hover:bg-[#C6010B]/90 text-white font-medium px-4 py-2.5 rounded-[24px] flex items-center justify-center transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:add-circle-outline" className="text-xl" />
                        Thêm Giải đấu
                    </div>
                </button>
            </div>

            {/* Table */}
            <TournamentTable
                tournaments={tournaments}
                total={total}
                currentPage={currentPage}
                onPageChange={onPageChange}
                onRefresh={fetchTournaments}
                onUpdate={handleUpdateClick}
            />

            {/* Add Tournament Dialog */}
            <BaseDialog
                open={modalOpen}
                onClose={handleCloseDialog}
                title="Thêm giải đấu"
                size="6xl"
                showFooter={true}
                footer={
                    <>
                        <Button type="button" color="gray" onClick={handleCloseDialog}>
                            Hủy
                        </Button>
                        <Button type="submit" form="tournament-form" color="blue">
                            Lưu và trở lại
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
                />
            </BaseDialog>

            {/* Update Tournament Dialog */}
            <BaseDialog
                open={updateModalOpen}
                onClose={handleCloseUpdateDialog}
                title="Cập nhật giải đấu"
                size="6xl"
                showFooter={true}
                footer={
                    <>
                        <Button type="button" color="gray" onClick={handleCloseUpdateDialog}>
                            Hủy
                        </Button>
                        <Button type="submit" form="tournament-form" color="blue">
                            Cập nhật
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
                />
            </BaseDialog>
        </div>
    );
};

export default Tournaments;

import { useState, useEffect, useCallback } from 'react';
import { Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
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
    const [_loading, _setLoading] = useState(true);
    
    const {
        formData,
        setFormData,
        ranks,
        loadedTournament,
        handleRankToggle,
        handleBannerChange,
        handleOrganizerLogoChange,
        handleSponsorLogosChange,
        handleRemoveSponsorLogo,
        handleRemoveBanner,
        handleRemoveOrganizerLogo,
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
            _setLoading(true);
            const response = await tournamentAPI.getTournaments({ skip: (currentPage - 1) * 50, limit: 50 });
            setTournaments(response.data?.data || []);
        } catch {
            // Error handled silently
        } finally {
            _setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchTournaments();
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Giải Đấu
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600 dark:text-gray-400">Hiển thị {tournaments.length} mục.</span>
                        <Link to="#" className="text-blue-600 hover:underline">Đặt lại</Link>
                    </div>
                </div>
                <Button color="blue" onClick={() => setModalOpen(true)}>
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:add-circle-outline" className="text-xl" />
                        Thêm Giải đấu
                    </div>
                </Button>
            </div>

            {/* Table */}
            <TournamentTable
                tournaments={tournaments}
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
                    handleSponsorLogosChange={handleSponsorLogosChange}
                    handleRemoveSponsorLogo={handleRemoveSponsorLogo}
                    handleRemoveBanner={handleRemoveBanner}
                    handleRemoveOrganizerLogo={handleRemoveOrganizerLogo}
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
                    handleSponsorLogosChange={handleSponsorLogosChange}
                    handleRemoveSponsorLogo={handleRemoveSponsorLogo}
                    handleRemoveBanner={handleRemoveBanner}
                    handleRemoveOrganizerLogo={handleRemoveOrganizerLogo}
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

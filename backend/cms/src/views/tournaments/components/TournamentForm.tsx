import type { TournamentFormData } from '../types';
import type { TournamentRank } from '../../../types/api';
import {
    BasicInfoSection,
    LevelTypeSection,
    StatusDisplaySection,
    ScheduleSection,
    FeesPrizesSection,
    HandicapSection,
    OtherInfoSection,
} from './form-sections';

interface TournamentFormProps {
    formData: TournamentFormData;
    setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
    ranks: TournamentRank[];
    handleRankToggle: (rank: string) => void;
    handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleOrganizerLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSponsorLogosChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveSponsorLogo: (index: number) => void;
    handleRemoveBanner: () => void;
    handleRemoveOrganizerLogo: () => void;
    handleCurrencyChange: (field: keyof TournamentFormData, value: string) => void;
    getFormattedValue: (value: string) => string;
    handleSubmit: (e: React.FormEvent) => void;
    handleNameChange: (value: string) => void;
    handleStartDateChange: (value: string) => void;
}

const TournamentForm = ({
    formData,
    setFormData,
    ranks,
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
    handleNameChange,
    handleStartDateChange,
}: TournamentFormProps) => {
    return (
        <form id="tournament-form" onSubmit={handleSubmit} className="space-y-6">
            <BasicInfoSection
                formData={formData}
                setFormData={setFormData}
                handleNameChange={handleNameChange}
                handleBannerChange={handleBannerChange}
                handleOrganizerLogoChange={handleOrganizerLogoChange}
                handleSponsorLogosChange={handleSponsorLogosChange}
                handleRemoveSponsorLogo={handleRemoveSponsorLogo}
                handleRemoveBanner={handleRemoveBanner}
                handleRemoveOrganizerLogo={handleRemoveOrganizerLogo}
            />

            <LevelTypeSection
                formData={formData}
                setFormData={setFormData}
                ranks={ranks}
                handleRankToggle={handleRankToggle}
            />

            <StatusDisplaySection
                formData={formData}
                setFormData={setFormData}
            />

            <ScheduleSection
                formData={formData}
                setFormData={setFormData}
                onStartDateChange={handleStartDateChange}
            />

            <FeesPrizesSection
                formData={formData}
                setFormData={setFormData}
                handleCurrencyChange={handleCurrencyChange}
                getFormattedValue={getFormattedValue}
            />

            <HandicapSection
                formData={formData}
                setFormData={setFormData}
            />

            <OtherInfoSection
                formData={formData}
                setFormData={setFormData}
            />
        </form>
    );
};

export default TournamentForm;

import { Card, Tabs } from 'flowbite-react';
import RanksTab from './tabs/RanksTab';
import TournamentsTab from './tabs/TournamentsTab';
import ScoringRulesTab from './tabs/ScoringRulesTab';

const TournamentSettings = () => {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Cài đặt giải đấu
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Quản lý loại giải đấu, hạng và quy tắc điểm
                </p>
            </div>

            {/* Tabs Card */}
            <Card>
                <Tabs aria-label="Cài đặt giải đấu" variant="underline">
                    <Tabs.Item active title="Loại giải đấu">
                        <TournamentsTab />
                    </Tabs.Item>
                    <Tabs.Item title="Hạng">
                        <RanksTab />
                    </Tabs.Item>
                    <Tabs.Item title="Quy tắc điểm">
                        <ScoringRulesTab />
                    </Tabs.Item>
                </Tabs>
            </Card>
        </div>
    );
};

export default TournamentSettings;

import { Card, Tabs } from 'flowbite-react';
import RanksTab from './tabs/RanksTab';
import ScoringRulesTab from './tabs/ScoringRulesTab';
import CoefficientTab from './tabs/CoefficientTab';
import TableFeeTab from './tabs/TableFeeTab';

const TournamentSettings = () => {
    return (
        <div className="pt-0 px-6 pb-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-[16px] font-semibold uppercase text-[#37393E] dark:text-white flex items-center gap-2">
                        CÀI ĐẶT GIẢI ĐẤU
                    </h1>
                </div>
            </div>

            {/* Tabs Card */}
            <Card>
                <Tabs aria-label="Cài đặt giải đấu" variant="underline">
                    <Tabs.Item active title="Hạng">
                        <RanksTab />
                    </Tabs.Item>
                    <Tabs.Item title="Hệ số">
                        <CoefficientTab />
                    </Tabs.Item>
                    <Tabs.Item title="Quy tắc điểm">
                        <ScoringRulesTab />
                    </Tabs.Item>
                    <Tabs.Item title="Tiền bàn">
                        <TableFeeTab />
                    </Tabs.Item>
                </Tabs>
            </Card>
        </div>
    );
};

export default TournamentSettings;

import { Card, Spinner } from 'flowbite-react';
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import { useKnockoutBracket } from '../hooks/useKnockoutBracket';
import KnockoutMatchTable from './KnockoutMatchTable';
import { useAllTables } from '../hooks/useAllTables';

interface TournamentKnockoutTabProps {
    tournamentId: number;
    numberOfPlayers: number;
    players: TournamentRegisteredPlayer[];
    matches: TournamentMatch[];
    tournament: Tournament;
    bracketLoading?: boolean;
    onUpsertMatch: (matchNo: number, data: TournamentMatchUpsert) => Promise<TournamentMatch>;
    onDirty?: () => void;
    onClean?: () => void;
}

const TournamentKnockoutTab = ({
    numberOfPlayers, players, matches, tournament, bracketLoading, onUpsertMatch, onDirty, onClean,
}: TournamentKnockoutTabProps) => {
    const { tables } = useAllTables();
    const {
        ko8Round1, ko8Round2, ko8Final, qualified8Players, qualified8Count, ko8SelectedIds,
        ko16R16, ko16QF, ko16SF, ko16Final, qualifiedPlayers, qualified16Count, ko16SelectedIds,
        ko32R32, ko32R16, ko32QF, ko32SF, ko32Final, qualified32Players, qualified32Count, ko32SelectedIds,
        handleKO8Change, handleKO16Change, handleKO32Change,
        saveKO8Match, saveKO16Match, saveKO32Match,
        isKO8Mode, isKO32Mode,
    } = useKnockoutBracket({ numberOfPlayers, players, matches, onUpsertMatch, tournament, onDirty, onClean });

    if (bracketLoading) {
        return <div className="flex justify-center p-12"><Spinner /></div>;
    }

    const QualificationWarning = ({ current, required }: { current: number; required: number }) =>
        current < required ? (
            <Card className="border-amber-200 bg-amber-50">
                <div className="text-sm text-amber-800">
                    Chưa đủ người để vào vòng KO. Hiện tại có: <strong>{current}</strong>/{required}.
                </div>
            </Card>
        ) : null;

    const RoundDivider = () => (
        <div className="pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
    );

    // KO8 Mode (16 players)
    if (isKO8Mode) {
        return (
            <div className="mt-4 space-y-12 pb-10">
                <QualificationWarning current={qualified8Count} required={8} />

                <KnockoutMatchTable
                    matches={ko8Round1} players={players} title="Tứ kết" matchRange="Trận 21-24" matchCount={4}
                    isPlayerSelectable={true} availablePlayers={qualified8Players} selectedIds={ko8SelectedIds}
                    selectDisabled={false}
                    onChange={(idx, field, value) => handleKO8Change(1, idx, field, value)}
                    onSaveMatch={(idx) => saveKO8Match(1, idx)}
                    tablesList={tables} tournament={tournament}
                />
                <RoundDivider />
                <KnockoutMatchTable
                    matches={ko8Round2} players={players} title="Bán Kết" matchRange="Trận 25-26" matchCount={2}
                    player1Placeholder={() => 'Chờ thắng KO...'} player2Placeholder={() => 'Chờ thắng KO...'}
                    onChange={(idx, field, value) => handleKO8Change(2, idx, field, value)}
                    onSaveMatch={(idx) => saveKO8Match(2, idx)}
                    tablesList={tables} tournament={tournament}
                />
                <RoundDivider />
                <KnockoutMatchTable
                    matches={ko8Final} players={players} title="Chung Kết" matchRange="Trận 27" matchCount={1}
                    player1Placeholder={() => 'Chờ thắng BK...'} player2Placeholder={() => 'Chờ thắng BK...'}
                    onChange={(idx, field, value) => handleKO8Change(3, idx, field, value)}
                    onSaveMatch={(idx) => saveKO8Match(3, idx)}
                    tablesList={tables} tournament={tournament}
                />
            </div>
        );
    }

    // KO32 Mode (64 players)
    if (isKO32Mode) {
        return (
            <div className="mt-4 space-y-12 pb-10">
                <QualificationWarning current={qualified32Count} required={32} />

                <KnockoutMatchTable
                    matches={ko32R32} players={players} title="Vòng 1/16" matchRange="Trận 81-96" matchCount={16}
                    isPlayerSelectable={true} availablePlayers={qualified32Players} selectedIds={ko32SelectedIds}
                    selectDisabled={false}
                    onChange={(idx, field, value) => handleKO32Change(1, idx, field, value)}
                    onSaveMatch={(idx) => saveKO32Match(1, idx)}
                    tablesList={tables} tournament={tournament}
                />
                <RoundDivider />
                <KnockoutMatchTable
                    matches={ko32R16} players={players} title="Vòng 1/8" matchRange="Trận 97-104" matchCount={8}
                    player1Placeholder={() => 'Chờ thắng KO...'} player2Placeholder={() => 'Chờ thắng KO...'}
                    onChange={(idx, field, value) => handleKO32Change(2, idx, field, value)}
                    onSaveMatch={(idx) => saveKO32Match(2, idx)}
                    tablesList={tables} tournament={tournament}
                />
                <RoundDivider />
                <KnockoutMatchTable
                    matches={ko32QF} players={players} title="Tứ Kết" matchRange="Trận 105-108" matchCount={4}
                    player1Placeholder={() => 'Chờ thắng KO...'} player2Placeholder={() => 'Chờ thắng KO...'}
                    onChange={(idx, field, value) => handleKO32Change(3, idx, field, value)}
                    onSaveMatch={(idx) => saveKO32Match(3, idx)}
                    tablesList={tables} tournament={tournament}
                />
                <RoundDivider />
                <KnockoutMatchTable
                    matches={ko32SF} players={players} title="Bán Kết" matchRange="Trận 109-110" matchCount={2}
                    player1Placeholder={() => 'Chờ thắng TK...'} player2Placeholder={() => 'Chờ thắng TK...'}
                    onChange={(idx, field, value) => handleKO32Change(4, idx, field, value)}
                    onSaveMatch={(idx) => saveKO32Match(4, idx)}
                    tablesList={tables} tournament={tournament}
                />
                <RoundDivider />
                <KnockoutMatchTable
                    matches={ko32Final} players={players} title="Chung Kết" matchRange="Trận 111" matchCount={1}
                    player1Placeholder={() => 'Chờ thắng BK...'} player2Placeholder={() => 'Chờ thắng BK...'}
                    onChange={(idx, field, value) => handleKO32Change(5, idx, field, value)}
                    onSaveMatch={(idx) => saveKO32Match(5, idx)}
                    tablesList={tables} tournament={tournament}
                />
            </div>
        );
    }

    // KO16 Mode (32 players)
    return (
        <div className="mt-4 space-y-12 pb-10">
            <QualificationWarning current={qualified16Count} required={16} />

            <KnockoutMatchTable
                matches={ko16R16} players={players} title="Vòng 1/8" matchRange="Trận 41-48" matchCount={8}
                isPlayerSelectable={true} availablePlayers={qualifiedPlayers} selectedIds={ko16SelectedIds}
                selectDisabled={false}
                onChange={(idx, field, value) => handleKO16Change(1, idx, field, value)}
                onSaveMatch={(idx) => saveKO16Match(1, idx)}
                tablesList={tables} tournament={tournament}
            />
            <RoundDivider />
            <KnockoutMatchTable
                matches={ko16QF} players={players} title="Tứ Kết" matchRange="Trận 49-52" matchCount={4}
                player1Placeholder={() => 'Chờ thắng KO...'} player2Placeholder={() => 'Chờ thắng KO...'}
                onChange={(idx, field, value) => handleKO16Change(2, idx, field, value)}
                onSaveMatch={(idx) => saveKO16Match(2, idx)}
                tablesList={tables} tournament={tournament}
            />
            <RoundDivider />
            <KnockoutMatchTable
                matches={ko16SF} players={players} title="Bán Kết" matchRange="Trận 53-54" matchCount={2}
                player1Placeholder={() => 'Chờ thắng TK...'} player2Placeholder={() => 'Chờ thắng TK...'}
                onChange={(idx, field, value) => handleKO16Change(3, idx, field, value)}
                onSaveMatch={(idx) => saveKO16Match(3, idx)}
                tablesList={tables} tournament={tournament}
            />
            <RoundDivider />
            <KnockoutMatchTable
                matches={ko16Final} players={players} title="Chung Kết" matchRange="Trận 55" matchCount={1}
                player1Placeholder={() => 'Chờ thắng BK...'} player2Placeholder={() => 'Chờ thắng BK...'}
                onChange={(idx, field, value) => handleKO16Change(4, idx, field, value)}
                onSaveMatch={(idx) => saveKO16Match(4, idx)}
                tablesList={tables} tournament={tournament}
            />
        </div>
    );
};

export default TournamentKnockoutTab;

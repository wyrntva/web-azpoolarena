/**
 * Qualification Tab — combines Winners Bracket and Losers Bracket into a single "Vòng loại" tab.
 * Each section is rendered independently with its own save functionality.
 */
import type { Tournament, TournamentMatch, TournamentMatchUpsert, TournamentRegisteredPlayer } from '../../../api/tournament.api';
import TournamentWinnersBracketTab from './TournamentWinnersBracketTab';
import TournamentLosersBracketTab from './TournamentLosersBracketTab';

interface Props {
    tournamentId: number;
    numberOfPlayers: number;
    players: TournamentRegisteredPlayer[];
    matches: TournamentMatch[];
    tournament: Tournament;
    bracketLoading?: boolean;
    onUpsertMatch: (matchNo: number, data: TournamentMatchUpsert) => Promise<TournamentMatch>;
    onDirty?: () => void;
    onClean?: () => void;
    enabledTables?: string[] | null;
    onTablePoolChange?: (names: string[]) => void;
    priorityTables?: string[];
    onPriorityTablesChange?: (names: string[]) => void;
}

const TournamentQualificationTab = ({
    tournamentId,
    numberOfPlayers,
    players,
    matches,
    tournament,
    bracketLoading,
    onUpsertMatch,
    onDirty,
    onClean,
    enabledTables,
    onTablePoolChange,
    priorityTables,
    onPriorityTablesChange,
}: Props) => {
    const commonProps = {
        tournamentId,
        numberOfPlayers,
        players,
        matches,
        tournament,
        bracketLoading,
        onUpsertMatch,
        onDirty,
        onClean,
    };

    if (numberOfPlayers === 24) {
        return (
            <div className="space-y-12">
                {/* Vòng 1: Nhánh thắng */}
                <TournamentWinnersBracketTab
                    {...commonProps}
                    visibleRounds={[1]}
                    enabledTables={enabledTables}
                    onTablePoolChange={onTablePoolChange}
                    priorityTables={priorityTables}
                    onPriorityTablesChange={onPriorityTablesChange}
                />

                {/* Vòng 2: Nhánh thắng */}
                <TournamentWinnersBracketTab {...commonProps} visibleRounds={[2]} />

                {/* Vòng 2: Nhánh thua */}
                <TournamentLosersBracketTab {...commonProps} visibleRounds={[1]} />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <TournamentWinnersBracketTab
                {...commonProps}
                visibleRounds={[1]}
                enabledTables={enabledTables}
                onTablePoolChange={onTablePoolChange}
                priorityTables={priorityTables}
                onPriorityTablesChange={onPriorityTablesChange}
            />

            {/* Vòng 1: Nhánh thua (Losers) */}
            <TournamentLosersBracketTab {...commonProps} visibleRounds={[1]} />

            {/* Vòng 2 nhánh thắng (Winners) */}
            <TournamentWinnersBracketTab {...commonProps} visibleRounds={[2]} />

            {/* Vòng 2: Nhánh thua (Losers) */}
            <TournamentLosersBracketTab {...commonProps} visibleRounds={[2]} />
        </div>
    );
};

export default TournamentQualificationTab;

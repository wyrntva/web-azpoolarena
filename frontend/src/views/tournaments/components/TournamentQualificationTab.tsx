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

    return (
        <div className="space-y-12">
            {/* Vòng 1 (Winners) */}
            <TournamentWinnersBracketTab {...commonProps} visibleRounds={[1]} />

            {/* Vòng 1: Nhánh thua (Losers) */}
            <TournamentLosersBracketTab {...commonProps} visibleRounds={[1]} />

            {/* Vòng 2 (Winners) */}
            <TournamentWinnersBracketTab {...commonProps} visibleRounds={[2]} />

            {/* Vòng 2: Nhánh thua (Losers) */}
            <TournamentLosersBracketTab {...commonProps} visibleRounds={[2]} />
        </div>
    );
};

export default TournamentQualificationTab;

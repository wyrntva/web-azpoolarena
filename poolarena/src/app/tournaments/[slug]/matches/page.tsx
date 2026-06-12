import { redirect } from "next/navigation";
import { tournamentAPI } from "@/api/tournament.api";

function getKnockoutStart(numberOfPlayers: number) {
    if (numberOfPlayers > 32) return 81;
    if (numberOfPlayers === 24) return 25;
    if (numberOfPlayers > 16) return 41;
    return 21;
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function MatchesRedirectPage({ params }: PageProps) {
    const { slug } = await params;

    let targetStage = 1;

    try {
        const [tournamentRes, matchesRes] = await Promise.all([
            tournamentAPI.getTournament(slug).catch(() => ({ data: null })),
            tournamentAPI.getTournamentMatchesBySlug(slug).catch(() => ({ data: [] })),
        ]);

        const tournament = tournamentRes.data;
        const matches = matchesRes.data || [];

        if (tournament) {
            if (tournament.status === "completed") {
                targetStage = 2;
            } else if (tournament.status === "upcoming") {
                targetStage = 1;
            } else {
                // ongoing
                const numberOfPlayers = tournament.number_of_players || 16;
                const knockoutStart = getKnockoutStart(numberOfPlayers);

                const hasOngoingOrCompletedKnockout = matches.some(
                    (m: any) => m.match_no >= knockoutStart && (m.status === "ongoing" || m.status === "completed")
                );

                if (hasOngoingOrCompletedKnockout) {
                    targetStage = 2;
                } else {
                    targetStage = 1;
                }
            }
        }
    } catch (err) {
        console.error("Server-side redirect check failed:", err);
    }

    redirect(`/tournaments/${slug}/matches/${targetStage}`);
}

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { TournamentsService } = require('./dist/tournaments/services/tournaments.service');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { TournamentMatchEntity } = require('./dist/tournaments/entities/tournament.entity');

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(TournamentsService);
    const matchRepo = app.get(getRepositoryToken(TournamentMatchEntity));
    
    console.log("Reseeding Tournament 6...");
    
    // 1. Delete all existing matches of Tournament 6
    await matchRepo.delete({ tournament_id: 6 });
    console.log("Deleted old matches for Tournament 6.");
    
    // 2. Call assignAllRegisteredPlayersToRound1 to generate and seed all registered players cleanly
    await service.assignAllRegisteredPlayersToRound1(6);
    console.log("✅ Seeded all registered players into the correct Winners Round 1 & 2 matches.");
    
    await app.close();
    console.log("Reseed completed successfully.");
}

main().catch(console.error);

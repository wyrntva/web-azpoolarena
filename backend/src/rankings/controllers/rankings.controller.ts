import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService } from '../services/rankings.service';

@Controller('api/rankings')
export class RankingsController {
  constructor(private readonly service: RankingsService) {}

  @Get()
  async getRankings(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('filter[rank_id]') rankId?: string,
    @Query('filter[gender]') gender?: string,
    @Query('sort') sort?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return this.service.getRankings(
      page,
      limit,
      rankId,
      gender,
      sort || '-points',
    );
  }
}

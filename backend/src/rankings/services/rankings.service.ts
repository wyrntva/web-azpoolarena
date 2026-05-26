import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async getRankings(
    page = 1,
    limit = 20,
    rankId?: string,
    gender?: string,
    sort = '-points',
  ) {
    const qb = this.repo
      .createQueryBuilder('u')
      .where('u.user_type IN (:...types)', { types: ['player', 'both'] })
      .andWhere('u.is_active = true');

    if (rankId && rankId !== 'all') {
      if (rankId === 'gplus') {
        qb.andWhere('u.rank = :r', { r: 'G+' });
      } else {
        qb.andWhere('u.rank = :r', { r: rankId });
      }
    }

    if (
      gender &&
      (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'female')
    ) {
      qb.andWhere('u.gender = :g', { g: gender.toLowerCase() });
    }

    if (sort === '-points') {
      qb.orderBy('u.points', 'DESC').addOrderBy('u.id', 'ASC');
    } else if (sort === 'points') {
      qb.orderBy('u.points', 'ASC').addOrderBy('u.id', 'ASC');
    } else {
      qb.orderBy('u.points', 'DESC');
    }

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = users.map((user) => ({
      id: String(user.id),
      points: user.points || 0,
      rank_id: user.rank,
      rank_name: user.rank || 'N/A',
      player: {
        id: String(user.id),
        name: user.full_name,
        avatar_url: user.avatar_url || '',
      },
    }));

    return {
      data,
      meta: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total,
        per_page: limit,
      },
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { UserEntity } from '../../users/entities/user.entity';
import { TournamentRankEntity } from '../../tournaments/entities';
import {
  CreatePoolArenaUserDto,
  UpdatePoolArenaUserDto,
} from '../dto/pool-arena.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PoolArenaService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    @InjectRepository(TournamentRankEntity)
    private readonly rankRepo: Repository<TournamentRankEntity>,
  ) {}

  async create(dto: CreatePoolArenaUserDto) {
    const existing = await this.repo.findOne({
      where: { phone_number: dto.phone_number },
    });
    if (existing)
      throw new BadRequestException('Phone number already registered');

    const hashedPassword = await bcrypt.hash(
      dto.hashed_password || '123456',
      10,
    );
    const user = this.repo.create({
      ...dto,
      user_type: 'player' as const,
      hashed_password: hashedPassword,
      rank: 'K',
    });
    return this.repo.save(user);
  }

  async findAll(skip = 0, limit = 50, search?: string, rank?: string, gender?: string) {
    const qb = this.repo
      .createQueryBuilder('u')
      .where('u.user_type IN (:...types)', { types: ['player', 'both'] })
      .skip(skip)
      .take(limit)
      .orderBy('u.points', 'DESC')
      .addOrderBy('u.created_at', 'DESC');

    if (search) {
      qb.andWhere('(u.full_name ILIKE :s OR u.phone_number ILIKE :s)', {
        s: `%${search}%`,
      });
    }
    if (rank) {
      qb.andWhere('u.rank = :rank', { rank });
    }
    if (gender) {
      qb.andWhere('u.gender = :gender', { gender });
    }

    return qb.getManyAndCount();
  }

  async findOne(id: number) {
    const user = await this.repo
      .createQueryBuilder('u')
      .where('u.id = :id AND u.user_type IN (:...types)', { id, types: ['player', 'both'] })
      .getOne();
    if (!user) throw new NotFoundException('PoolArena user not found');

    try {
      const { TournamentRegistrationEntity, TournamentEntity } = require('../../tournaments/entities');
      const count = await this.repo.manager
        .createQueryBuilder(TournamentRegistrationEntity, 'reg')
        .innerJoin(TournamentEntity, 'tour', 'tour.id = reg.tournament_id')
        .where('reg.user_id = :id', { id })
        .andWhere('tour.status = :status', { status: 'completed' })
        .getCount();
      (user as any).tournaments_count = count;
    } catch {
      (user as any).tournaments_count = 0;
    }

    return user;
  }

  async update(id: number, dto: UpdatePoolArenaUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    if (dto.rank && dto.points === undefined) {
      const rank = await this.rankRepo.findOne({ where: { name: dto.rank } });
      if (rank) user.points = rank.default_score;
    }
    return this.repo.save(user);
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    this.deleteLocalFile(user.avatar_url);
    await this.repo.remove(user);
  }

  async updateAvatar(id: number, avatarUrl: string) {
    const user = await this.findOne(id);
    this.deleteLocalFile(user.avatar_url);
    user.avatar_url = avatarUrl;
    return this.repo.save(user);
  }

  async deleteAvatar(id: number) {
    const user = await this.findOne(id);
    this.deleteLocalFile(user.avatar_url);
    (user as any).avatar_url = null;
    return this.repo.save(user);
  }

  private deleteLocalFile(url: string | null | undefined) {
    if (!url || !url.startsWith('/uploads/')) return;
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
    const relativePath = url.replace(/^\/uploads\//, '');
    const fullPath = path.join(uploadsDir, relativePath);
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch { /* ignore */ }
  }

  async getRankings(limit = 100) {
    return this.repo
      .createQueryBuilder('u')
      .where('u.user_type IN (:...rtypes)', { rtypes: ['player', 'both'] })
      .andWhere('u.is_active = true')
      .select([
        'u.id',
        'u.full_name',
        'u.avatar_url',
        'u.points',
        'u.rank',
        'u.wins',
        'u.losses',
        'u.total_games',
      ])
      .orderBy('u.points', 'DESC')
      .take(limit)
      .getMany();
  }
}

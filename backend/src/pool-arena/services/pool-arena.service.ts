import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoolArenaUserEntity } from '../entities';
import {
  CreatePoolArenaUserDto,
  UpdatePoolArenaUserDto,
} from '../dto/pool-arena.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PoolArenaService {
  constructor(
    @InjectRepository(PoolArenaUserEntity)
    private readonly repo: Repository<PoolArenaUserEntity>,
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
      hashed_password: hashedPassword,
      rank: 'K',
    }); // Default rank 'K'
    return this.repo.save(user);
  }

  async findAll(skip = 0, limit = 50, search?: string, rank?: string, gender?: string) {
    const qb = this.repo
      .createQueryBuilder('u')
      .skip(skip)
      .take(limit)
      .orderBy('u.points', 'DESC')
      .addOrderBy('u.created_at', 'DESC');

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (search) {
      conditions.push('(u.full_name ILIKE :s OR u.phone_number ILIKE :s)');
      params.s = `%${search}%`;
    }
    if (rank) {
      conditions.push('u.rank = :rank');
      params.rank = rank;
    }
    if (gender) {
      conditions.push('u.gender = :gender');
      params.gender = gender;
    }

    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    return qb.getManyAndCount();
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('PoolArena user not found');
    return user;
  }

  async update(id: number, dto: UpdatePoolArenaUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async getRankings(limit = 100) {
    return this.repo
      .createQueryBuilder('u')
      .where('u.is_active = true')
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

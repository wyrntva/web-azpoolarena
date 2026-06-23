import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NewsEntity } from './news.entity';

export class CreateNewsDto {
  title: string;
  category?: string;
  date: string;
  author: string;
  image?: string;
  excerpt: string;
  content: string[];
  featured?: boolean;
  fanpage_image?: string;
  post_to_fanpage?: boolean;
}

export class UpdateNewsDto {
  title?: string;
  category?: string;
  date?: string;
  author?: string;
  image?: string;
  excerpt?: string;
  content?: string[];
  featured?: boolean;
  fanpage_image?: string;
  fb_post_id?: string | null;
  post_to_fanpage?: boolean;
}

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly repo: Repository<NewsEntity>,
  ) {}

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? [{ title: Like(`%${search}%`) }, { excerpt: Like(`%${search}%`) }]
      : {};

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy bài viết');
    return item;
  }

  async create(dto: CreateNewsDto) {
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateNewsDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: 'Đã xóa bài viết' };
  }
}

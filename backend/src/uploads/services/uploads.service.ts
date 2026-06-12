import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { TournamentEntity } from '../../tournaments/entities';
import { StoreSettingsEntity } from '../../store-settings/entities';
import { ProductEntity, MenuEntity } from '../../pos/entities';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(TournamentEntity)
    private tourRepo: Repository<TournamentEntity>,
    @InjectRepository(StoreSettingsEntity)
    private settingsRepo: Repository<StoreSettingsEntity>,
    @InjectRepository(ProductEntity)
    private productRepo: Repository<ProductEntity>,
    @InjectRepository(MenuEntity)
    private menuRepo: Repository<MenuEntity>,
  ) {}

  private extractUrls(urls: Set<string>, value: string | null | undefined) {
    if (value && typeof value === 'string' && value.startsWith('/uploads/')) {
      urls.add(value);
    }
  }

  async collectUsedUploadUrls(): Promise<Set<string>> {
    const used = new Set<string>();

    const users = await this.userRepo.find({ select: ['avatar_url'] });
    for (const u of users) this.extractUrls(used, u.avatar_url);

    const tours = await this.tourRepo.find({
      select: ['banner', 'organizer_logo', 'detail_logo', 'sponsor_logos'],
    });
    for (const t of tours) {
      this.extractUrls(used, t.banner);
      this.extractUrls(used, t.organizer_logo);
      this.extractUrls(used, t.detail_logo);
      if (t.sponsor_logos) {
        try {
          const logos = JSON.parse(t.sponsor_logos);
          if (Array.isArray(logos))
            logos.forEach((url) => this.extractUrls(used, url));
        } catch {
          this.extractUrls(used, t.sponsor_logos);
        }
      }
    }

    const settings = await this.settingsRepo.findOne({ where: {} });
    if (settings) {
      this.extractUrls(used, settings.banner_tournament);
      this.extractUrls(used, settings.banner_ranking);
      this.extractUrls(used, settings.banner_member);
      if (settings.banner_scoreboard) {
        try {
          const banners = JSON.parse(settings.banner_scoreboard);
          if (Array.isArray(banners))
            banners.forEach((url) => this.extractUrls(used, url));
        } catch {
          this.extractUrls(used, settings.banner_scoreboard);
        }
      }
    }

    const products = await this.productRepo.find({ select: ['image'] });
    for (const p of products) this.extractUrls(used, p.image);

    const menus = await this.menuRepo.find({ select: ['image'] });
    for (const m of menus) this.extractUrls(used, m.image);

    return used;
  }

  listUploadFiles(): string[] {
    const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
    const urls: string[] = [];

    const traverse = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          traverse(fullPath);
        } else {
          const relative = path
            .relative(uploadsDir, fullPath)
            .split(path.sep)
            .join('/');
          urls.push(`/uploads/${relative}`);
        }
      }
    };
    traverse(uploadsDir);

    return urls;
  }

  async getOrphans(deleteOrphans: boolean) {
    const used = await this.collectUsedUploadUrls();
    const allFiles = new Set(this.listUploadFiles());
    const orphans = Array.from(allFiles)
      .filter((url) => !used.has(url))
      .sort();

    let deletedCount = 0;
    if (deleteOrphans && orphans.length > 0) {
      const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
      for (const url of orphans) {
        const relativePath = url.replace(/^\/uploads\//, '');
        const fullPath = path.join(uploadsDir, relativePath);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            deletedCount++;
          }
        } catch (e) {
          this.logger.error(`Failed to delete ${fullPath}`, e);
        }
      }
    }

    return {
      total_files: allFiles.size,
      used_files: used.size,
      orphan_files: orphans.length,
      deleted: deletedCount,
      orphans,
    };
  }

  // Chạy mỗi ngày lúc 3 giờ sáng để dọn ảnh không dùng đến
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledCleanup() {
    this.logger.log('Running scheduled orphan cleanup...');
    const result = await this.getOrphans(true);
    this.logger.log(
      `Orphan cleanup done: deleted ${result.deleted}/${result.orphan_files} orphans`,
    );
  }
}

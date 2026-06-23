import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreSettingsEntity } from '../entities';
import { UpdateStoreSettingsDto } from '../dto/store-settings.dto';

@Injectable()
export class StoreSettingsService {
  constructor(
    @InjectRepository(StoreSettingsEntity)
    private readonly repo: Repository<StoreSettingsEntity>,
  ) {}

  async getSettings() {
    let settings = await this.repo.findOne({ where: {} });
    if (!settings) {
      settings = this.repo.create({
        name: 'AZ Pool Arena',
        currency: 'VND',
        banner_scoreboard: '[]',
        banner_tournament: '[]',
      });
      await this.repo.save(settings);
    }
    return settings;
  }

  async updateSettings(dto: UpdateStoreSettingsDto) {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.repo.save(settings);
  }

  async addBanner(type: string, url: string) {
    const settings = await this.getSettings();
    const fieldName = `banner_${type}`;

    // For single banners
    if (type === 'ranking' || type === 'member') {
      (settings as any)[fieldName] = url;
    } else {
      // For multi banners (JSON array string)
      let current: string[] = [];
      if ((settings as any)[fieldName]) {
        try {
          current = JSON.parse((settings as any)[fieldName]);
        } catch {
          if ((settings as any)[fieldName])
            current = [(settings as any)[fieldName]];
        }
      }
      if (!Array.isArray(current)) current = [];
      current.push(url);
      (settings as any)[fieldName] = JSON.stringify(current);
    }

    return this.repo.save(settings);
  }

  async removeBanner(type: string, index: number) {
    const settings = await this.getSettings();
    const fieldName = `banner_${type}`;

    if ((settings as any)[fieldName]) {
      try {
        const current = JSON.parse((settings as any)[fieldName]);
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current.splice(index, 1);
          (settings as any)[fieldName] = JSON.stringify(current);
          return this.repo.save(settings);
        }
      } catch {}
    }
    return settings;
  }

  async removeSingleBanner(type: string) {
    const settings = await this.getSettings();
    const fieldName = `banner_${type}`;
    (settings as any)[fieldName] = null;
    return this.repo.save(settings);
  }
}

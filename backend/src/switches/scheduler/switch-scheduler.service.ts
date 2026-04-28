import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { SwitchEntity } from '../entities/switch.entity';
import * as http from 'http';

@Injectable()
export class SwitchSchedulerService {
  private readonly logger = new Logger(SwitchSchedulerService.name);
  /** track (switchId, "on"|"off") → dateString to fire only once per day */
  private triggeredToday = new Map<string, string>();

  constructor(
    @InjectRepository(SwitchEntity)
    private readonly switchRepo: Repository<SwitchEntity>,
  ) {}

  @Cron('*/5 * * * * *') // Every 5 seconds
  async checkSchedules() {
    try {
      const switches = await this.switchRepo.find({
        where: [
          { schedule_on: Not(IsNull()) },
          { schedule_off: Not(IsNull()) },
        ],
      });

      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const sw of switches) {
        const keyOn = `${sw.id}-on`;
        const keyOff = `${sw.id}-off`;

        // Reset if new day
        if (this.triggeredToday.get(keyOn) !== today)
          this.triggeredToday.delete(keyOn);
        if (this.triggeredToday.get(keyOff) !== today)
          this.triggeredToday.delete(keyOff);

        let shouldTriggerOn = false;
        let shouldTriggerOff = false;

        // Độc lập
        if (sw.schedule_on) {
          const [onH, onM] = sw.schedule_on.split(':').map(Number);
          shouldTriggerOn = currentMinutes >= (onH * 60 + onM);
        }
        if (sw.schedule_off) {
          const [offH, offM] = sw.schedule_off.split(':').map(Number);
          shouldTriggerOff = currentMinutes >= (offH * 60 + offM);
        }

        // Nếu có CẢ HAI, áp dụng logic khoảng thời gian
        if (sw.schedule_on && sw.schedule_off) {
          const [onH, onM] = sw.schedule_on.split(':').map(Number);
          const [offH, offM] = sw.schedule_off.split(':').map(Number);
          const onMinutes = onH * 60 + onM;
          const offMinutes = offH * 60 + offM;

          if (onMinutes < offMinutes) {
            shouldTriggerOn = currentMinutes >= onMinutes && currentMinutes < offMinutes;
            shouldTriggerOff = currentMinutes >= offMinutes;
          } else {
            // Overnight: e.g., on=18:00 off=06:00
            shouldTriggerOn = currentMinutes >= onMinutes || currentMinutes < offMinutes;
            shouldTriggerOff = currentMinutes >= offMinutes && currentMinutes < onMinutes;
          }
        }

        // Turn ON (once)
        if (
          shouldTriggerOn &&
          !this.triggeredToday.has(keyOn) &&
          !sw.is_active
        ) {
          sw.is_active = true;
          await this.switchRepo.save(sw);
          this.triggeredToday.set(keyOn, today);
          this.logger.log(
            `[SCHEDULE] Bật ${sw.name} (${now.toTimeString().slice(0, 5)})`,
          );
          this.sendEspCommand(sw, 'on');
        }

        // Turn OFF (once)
        if (
          shouldTriggerOff &&
          !this.triggeredToday.has(keyOff) &&
          sw.is_active
        ) {
          sw.is_active = false;
          await this.switchRepo.save(sw);
          this.triggeredToday.set(keyOff, today);
          this.logger.log(
            `[SCHEDULE] Tắt ${sw.name} (${now.toTimeString().slice(0, 5)})`,
          );
          this.sendEspCommand(sw, 'off');
        }
      }
    } catch (err) {
      this.logger.error(`[SCHEDULE] Error: ${err.message}`);
    }
  }

  sendEspCommand(sw: SwitchEntity, command: string) {
    if (!sw.ip_address) return;

    const path = sw.port ? `/${sw.port}/${command}` : `/${command}`;
    const url = `http://${sw.ip_address}${path}`;

    const req = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        this.logger.log(
          `ESP [${sw.name}] ${url} -> ${res.statusCode}: ${body}`,
        );
      });
    });

    req.on('error', (err) => {
      this.logger.warn(
        `ESP [${sw.name}] no response: ${url} -> ${err.message}`,
      );
    });

    req.end();
  }
}

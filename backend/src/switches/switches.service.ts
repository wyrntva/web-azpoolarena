import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwitchEntity } from './entities/switch.entity';
import { AreaEntity, TableEntity } from '../areas/entities/area.entity';
import * as http from 'http';
import * as mqtt from 'mqtt';

const VALID_SWITCH_TYPES = [
  'light',
  'scoreboard',
  'tv',
  'ac',
  'ceiling_light',
  'fan',
  'exhaust_fan',
  'sign_light',
  'other',
];

@Injectable()
export class SwitchesService {
  private readonly logger = new Logger(SwitchesService.name);
  private mqttClient: mqtt.MqttClient;

  constructor(
    @InjectRepository(SwitchEntity)
    private readonly switchRepo: Repository<SwitchEntity>,
    @InjectRepository(TableEntity)
    private readonly tableRepo: Repository<TableEntity>,
    @InjectRepository(AreaEntity)
    private readonly areaRepo: Repository<AreaEntity>,
  ) {
    const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
    this.mqttClient = mqtt.connect(mqttUrl);
  }

  async findAll() {
    // Step 1: Clean duplicate scoreboard switches
    const dupes = await this.switchRepo
      .createQueryBuilder('s')
      .select('s.name')
      .where('s.switch_type = :type', { type: 'scoreboard' })
      .groupBy('s.name')
      .having('COUNT(s.id) > 1')
      .getRawMany();

    for (const dupe of dupes) {
      const allDupes = await this.switchRepo.find({
        where: { switch_type: 'scoreboard', name: dupe.s_name },
        order: { id: 'ASC' },
      });
      if (allDupes.length > 1) {
        await this.switchRepo.remove(allDupes.slice(1));
      }
    }

    // Step 2: Auto-sync connected scoreboards and TVs
    const connectedTables = await this.tableRepo
      .createQueryBuilder('t')
      .where('t.device_activated_at IS NOT NULL')
      .getMany();

    for (const table of connectedTables) {
      const area = await this.areaRepo.findOne({
        where: { id: table.area_id },
      });
      const areaName = area?.name ?? '';

      // Auto-sync Scoreboard switch (Chỉ giữ lại của Scoreboard)
      const switchNamePC = `Scoreboard - ${table.name}`;
      const descriptionPC = `Máy tính bảng tỉ số ${table.name}`;
      const existingPC = await this.switchRepo.findOne({
        where: { name: switchNamePC, switch_type: 'scoreboard' },
      });

      if (existingPC) {
        let changed = false;
        if (existingPC.description !== descriptionPC) {
          existingPC.description = descriptionPC;
          changed = true;
        }
        if (existingPC.area_name !== areaName) {
          existingPC.area_name = areaName;
          changed = true;
        }
        if (existingPC.sort_order !== table.id) {
          existingPC.sort_order = table.id;
          changed = true;
        }
        if (changed) await this.switchRepo.save(existingPC);
      } else {
        await this.switchRepo.save(
          this.switchRepo.create({
            name: switchNamePC,
            switch_type: 'scoreboard',
            description: descriptionPC,
            area_name: areaName,
            sort_order: table.id,
            is_active: false,
            created_at: new Date(),
            updated_at: new Date(),
          } as Partial<SwitchEntity>),
        );
      }
    }

    return this.switchRepo.find({
      order: { switch_type: 'ASC', sort_order: 'ASC', name: 'ASC' },
    });
  }

  async create(dto: Partial<SwitchEntity>) {
    if (!dto.switch_type || !VALID_SWITCH_TYPES.includes(dto.switch_type)) {
      throw new BadRequestException(
        `Invalid switch type. Choose: ${VALID_SWITCH_TYPES.join(', ')}`,
      );
    }

    const sw = this.switchRepo.create({
      ...dto,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    } as Partial<SwitchEntity>);
    return this.switchRepo.save(sw);
  }

  async update(id: number, dto: Partial<SwitchEntity>) {
    const sw = await this.switchRepo.findOne({ where: { id } });
    if (!sw) throw new NotFoundException('Công tắc không tồn tại');

    if (dto.switch_type && !VALID_SWITCH_TYPES.includes(dto.switch_type)) {
      throw new BadRequestException(`Invalid switch type`);
    }

    Object.assign(sw, dto);

    // Send ESP command if toggling is_active
    if (dto.is_active !== undefined) {
      if (sw.switch_type === 'scoreboard') {
        const tableName = sw.name.replace('Scoreboard - ', '');
        const payload = JSON.stringify({
          type: 'scoreboard',
          table_name: tableName,
          action: dto.is_active ? 'ON' : 'OFF',
        });
        this.mqttClient.publish('azpool/master_esp/control', payload);
        this.logger.log(`[MQTT] Lệnh tắt/bật PC: ${payload}`);
      } else if (
        ['tv', 'light', 'other', 'fan', 'ac'].includes(sw.switch_type) &&
        !sw.ip_address
      ) {
        // Nếu không có ip_address (nghĩa là Node WiFi thông qua Master ESP)
        const payload = JSON.stringify({
          type: sw.switch_type,
          target: sw.name,
          action: dto.is_active ? 'ON' : 'OFF',
        });
        this.mqttClient.publish('azpool/master_esp/control', payload);
        this.logger.log(`[MQTT] Lệnh điều khiển thiết bị: ${payload}`);
      } else if (sw.ip_address) {
        // Legacy HTTP command for standard smart-switches/relays
        this.sendEspCommand(sw.name, sw.ip_address, sw.port, sw.is_active);
      }
    }

    return this.switchRepo.save(sw);
  }

  async remove(id: number) {
    const sw = await this.switchRepo.findOne({ where: { id } });
    if (!sw) throw new NotFoundException('Công tắc không tồn tại');
    await this.switchRepo.remove(sw);
    return { success: true, message: 'Xóa công tắc thành công' };
  }

  async getEspStatus(code: string, ip?: string) {
    const switches = await this.switchRepo.find({
      where: { device_code: code.toUpperCase() },
      order: { port: 'ASC' },
    });

    // Auto-update IP from ESP
    if (ip && switches.length > 0) {
      for (const s of switches) {
        if (s.ip_address !== ip) {
          s.ip_address = ip;
          await this.switchRepo.save(s);
        }
      }
    }

    return {
      relays: switches.map((s) => ({
        channel: s.port || 0,
        active: s.is_active,
        name: s.name,
      })),
    };
  }

  async updateStatusByReport(tableName: string, isActive: boolean) {
    // Tìm Switch kiểu Scoreboard tương ứng với Tên Bàn
    const switchName = `Scoreboard - ${tableName}`;
    const sw = await this.switchRepo.findOne({
      where: { name: switchName, switch_type: 'scoreboard' },
    });

    if (sw && sw.is_active !== isActive) {
      sw.is_active = isActive;
      await this.switchRepo.save(sw);
      this.logger.log(
        `[MQTT Sync] Bảng ${tableName} -> ${isActive ? 'ON' : 'OFF'}`,
      );
    }
  }

  // Tự động nhận dạng và cập nhật thiết bị (Plug And Play + Actual Status Sync)
  async handleDiscovery(data: {
    name: string;
    switch_type: string;
    is_active?: boolean;
  }) {
    if (!data || !data.name || !data.switch_type) return;

    if (!VALID_SWITCH_TYPES.includes(data.switch_type)) return;

    const existing = await this.switchRepo.findOne({
      where: { name: data.name, switch_type: data.switch_type },
    });
    if (!existing) {
      await this.switchRepo.save(
        this.switchRepo.create({
          name: data.name,
          switch_type: data.switch_type,
          description: `Tự động nhận diện qua mạng: ${data.name}`,
          is_active: data.is_active || false,
          sort_order: 9999, // Đẩy xuống cuối cẩu
          created_at: new Date(),
          updated_at: new Date(),
        } as Partial<SwitchEntity>),
      );
      this.logger.log(
        `[Auto-Discovery] Đã thêm thiết bị cắm-là-chạy ngầm: ${data.name}`,
      );
    } else {
      // Thiết bị đã có, kiểm tra CẬP NHẬT TRẠNG THÁI THỰC TẾ
      if (
        data.is_active !== undefined &&
        existing.is_active !== data.is_active
      ) {
        existing.is_active = data.is_active;
        await this.switchRepo.save(existing);
        this.logger.log(
          `[Hardware Sync] Trạng thái thực tế thiết bị ${data.name} đè lên UI: ${data.is_active ? 'ON' : 'OFF'}`,
        );
      }
    }
  }

  private sendEspCommand(
    name: string,
    ipAddress: string,
    port: number | null,
    isActive: boolean,
  ) {
    const command = isActive ? 'on' : 'off';
    const path = port ? `/${port}/${command}` : `/${command}`;
    const url = `http://${ipAddress}${path}`;

    const req = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        this.logger.log(`ESP [${name}] ${url} -> ${res.statusCode}: ${body}`);
      });
    });

    req.on('error', (err) => {
      this.logger.warn(`ESP [${name}] no response: ${url} -> ${err.message}`);
    });

    req.end();
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);

  constructor(@Inject('MQTT_CLIENT') private readonly client: ClientProxy) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('MQTT client connected');
    } catch (err) {
      this.logger.warn(
        `MQTT connection failed: ${err.message}. HTTP fallback active.`,
      );
    }
  }

  /** Publish switch command to ESP via MQTT */
  publishSwitchCommand(
    deviceCode: string,
    channel: number,
    command: 'on' | 'off',
  ) {
    const topic = `azpool/switches/${deviceCode}/command`;
    const payload = { channel, command, timestamp: Date.now() };
    this.client.emit(topic, payload);
    this.logger.log(`MQTT → ${topic}: ${JSON.stringify(payload)}`);
  }

  /** Publish scoreboard data to a specific device */
  publishScoreboardData(deviceCode: string, data: any) {
    const topic = `azpool/scoreboard/${deviceCode}/data`;
    this.client.emit(topic, data);
  }

  /** Generic publish */
  publish(topic: string, payload: any) {
    this.client.emit(topic, payload);
  }
}

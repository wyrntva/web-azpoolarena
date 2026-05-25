import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  MqttContext,
} from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller()
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  /** Handle ESP status reports: azpool/switches/+/status */
  @MessagePattern('azpool/switches/+/status')
  handleSwitchStatus(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    this.logger.log(`MQTT ← ${topic}: ${JSON.stringify(data)}`);
    // TODO: Update switch status in DB based on ESP report
  }

  /** Handle scoreboard heartbeat: azpool/scoreboard/+/heartbeat */
  @MessagePattern('azpool/scoreboard/+/heartbeat')
  handleScoreboardHeartbeat(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    this.logger.log(`MQTT ← ${topic}: heartbeat from scoreboard`);
  }
}

import { MqttContext } from '@nestjs/microservices';
export declare class MqttController {
    private readonly logger;
    handleSwitchStatus(data: any, context: MqttContext): void;
    handleScoreboardHeartbeat(data: any, context: MqttContext): void;
}

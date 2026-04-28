import { ClientProxy } from '@nestjs/microservices';
export declare class MqttService {
    private readonly client;
    private readonly logger;
    constructor(client: ClientProxy);
    onModuleInit(): Promise<void>;
    publishSwitchCommand(deviceCode: string, channel: number, command: 'on' | 'off'): void;
    publishScoreboardData(deviceCode: string, data: any): void;
    publish(topic: string, payload: any): void;
}

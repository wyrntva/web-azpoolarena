import { Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
export interface JwtPayload {
    sub: string;
    type: 'access' | 'refresh';
    exp?: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userRepo;
    constructor(configService: ConfigService, userRepo: Repository<UserEntity>);
    validate(payload: JwtPayload): Promise<UserEntity>;
}
export {};

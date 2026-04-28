export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Permission: (perm: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;

// pool_arena_users đã được gộp vào bảng users (user_type='player').
// Re-export để các module cũ không cần đổi import path ngay lập tức.
export { UserEntity as PoolArenaUserEntity } from '../users/entities/user.entity';
export type { UserType } from '../users/entities/user.entity';

// Giữ lại enum để không break DTO/controller imports
export { PoolArenaUserGender } from '../common/enums';

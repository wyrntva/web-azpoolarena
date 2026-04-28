import { UploadsService } from '../services/uploads.service';
export declare class UploadsController {
    private readonly service;
    constructor(service: UploadsService);
    getOrphans(): Promise<{
        total_files: number;
        used_files: number;
        orphan_files: number;
        deleted: number;
        orphans: string[];
    }>;
    cleanupOrphans(): Promise<{
        total_files: number;
        used_files: number;
        orphan_files: number;
        deleted: number;
        orphans: string[];
    }>;
}

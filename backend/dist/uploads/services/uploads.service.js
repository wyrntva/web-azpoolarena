"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../pool-arena/entities");
const entities_2 = require("../../tournaments/entities");
const entities_3 = require("../../store-settings/entities");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let UploadsService = class UploadsService {
    userRepo;
    tourRepo;
    settingsRepo;
    constructor(userRepo, tourRepo, settingsRepo) {
        this.userRepo = userRepo;
        this.tourRepo = tourRepo;
        this.settingsRepo = settingsRepo;
    }
    extractUrls(urls, value) {
        if (value && typeof value === 'string' && value.startsWith('/uploads/')) {
            urls.add(value);
        }
    }
    async collectUsedUploadUrls() {
        const used = new Set();
        const users = await this.userRepo.find({ select: ['avatar_url'] });
        for (const u of users)
            this.extractUrls(used, u.avatar_url);
        const tours = await this.tourRepo.find({
            select: ['banner', 'organizer_logo', 'sponsor_logos'],
        });
        for (const t of tours) {
            this.extractUrls(used, t.banner);
            this.extractUrls(used, t.organizer_logo);
            if (t.sponsor_logos) {
                try {
                    const logos = JSON.parse(t.sponsor_logos);
                    if (Array.isArray(logos))
                        logos.forEach((url) => this.extractUrls(used, url));
                }
                catch {
                    this.extractUrls(used, t.sponsor_logos);
                }
            }
        }
        const settings = await this.settingsRepo.findOne({ where: {} });
        if (settings) {
            this.extractUrls(used, settings.banner_tournament);
            this.extractUrls(used, settings.banner_ranking);
            this.extractUrls(used, settings.banner_member);
            if (settings.banner_scoreboard) {
                try {
                    const banners = JSON.parse(settings.banner_scoreboard);
                    if (Array.isArray(banners))
                        banners.forEach((url) => this.extractUrls(used, url));
                }
                catch {
                    this.extractUrls(used, settings.banner_scoreboard);
                }
            }
        }
        return used;
    }
    listUploadFiles() {
        const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
        const urls = [];
        const traverse = (dir) => {
            if (!fs.existsSync(dir))
                return;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    traverse(fullPath);
                }
                else {
                    const relative = path
                        .relative(uploadsDir, fullPath)
                        .split(path.sep)
                        .join('/');
                    urls.push(`/uploads/${relative}`);
                }
            }
        };
        traverse(uploadsDir);
        return urls;
    }
    async getOrphans(deleteOrphans) {
        const used = await this.collectUsedUploadUrls();
        const allFiles = new Set(this.listUploadFiles());
        const orphans = Array.from(allFiles)
            .filter((url) => !used.has(url))
            .sort();
        let deletedCount = 0;
        if (deleteOrphans && orphans.length > 0) {
            const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
            for (const url of orphans) {
                const relativePath = url.replace(/^\/uploads\//, '');
                const fullPath = path.join(uploadsDir, relativePath);
                try {
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        deletedCount++;
                    }
                }
                catch (e) {
                    console.error(`Failed to delete ${fullPath}`, e);
                }
            }
        }
        return {
            total_files: allFiles.size,
            used_files: used.size,
            orphan_files: orphans.length,
            deleted: deletedCount,
            orphans,
        };
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PoolArenaUserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_2.TournamentEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_3.StoreSettingsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map
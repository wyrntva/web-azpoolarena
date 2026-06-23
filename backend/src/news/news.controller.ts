import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { convertToWebp } from '../common/utils/image.utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { NewsService, CreateNewsDto, UpdateNewsDto } from './news.service';
import { FacebookService } from './facebook.service';

@Controller('api/news')
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(
    private readonly newsService: NewsService,
    private readonly facebookService: FacebookService,
  ) {}

  // ── Public routes ──────────────────────────────────────────────

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.newsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search || '',
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  // ── Admin routes ───────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async create(@Body() dto: CreateNewsDto) {
    const { post_to_fanpage, ...articleDto } = dto;
    const article = await this.newsService.create(articleDto);

    if (post_to_fanpage) {
      try {
        const { post_id } = await this.facebookService.postNewsToPage(article);
        await this.newsService.update(article.id, { fb_post_id: post_id });
        article.fb_post_id = post_id;
        this.logger.log(`Facebook post created: ${post_id}`);
      } catch (err: any) {
        this.logger.error(err.message);
      }
    }

    return article;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNewsDto,
  ) {
    const { post_to_fanpage, ...articleDto } = dto;
    const existing = await this.newsService.findOne(id);
    const article = await this.newsService.update(id, articleDto);

    if (post_to_fanpage) {
      // Xóa bài cũ trên Facebook nếu có
      if (existing.fb_post_id) {
        await this.facebookService.deletePost(existing.fb_post_id);
      }
      // Đăng bài mới
      try {
        const { post_id } = await this.facebookService.postNewsToPage(article);
        await this.newsService.update(article.id, { fb_post_id: post_id });
        article.fb_post_id = post_id;
        this.logger.log(`Facebook post updated: ${post_id}`);
      } catch (err: any) {
        this.logger.error(err.message);
      }
    }

    return article;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const existing = await this.newsService.findOne(id);

    // Xóa bài đăng Facebook nếu có
    if (existing.fb_post_id) {
      await this.facebookService.deletePost(existing.fb_post_id);
    }

    return this.newsService.remove(id);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'Super Admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/news',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `news-image-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const webpPath = await convertToWebp(file.path);
    const filename = webpPath.split(/[\\/]/).pop();
    return { url: `/uploads/news/${filename}` };
  }
}

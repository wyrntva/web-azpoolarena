import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly graphUrl = 'https://graph.facebook.com/v25.0';

  constructor(private readonly config: ConfigService) {}

  async postNewsToPage(article: {
    id: number;
    title: string;
    excerpt: string;
    fanpage_image?: string;
  }): Promise<{ post_id: string }> {
    const token = this.config.get<string>('FB_PAGE_ACCESS_TOKEN');
    const pageId = this.config.get<string>('FB_PAGE_ID');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'https://azpoolarena.com');

    if (!token || !pageId) {
      throw new Error('FB_PAGE_ACCESS_TOKEN hoặc FB_PAGE_ID chưa được cấu hình');
    }

    const articleUrl = `${frontendUrl}/news/${article.id}`;
    const caption = `${article.title}\n\n${article.excerpt}\n\n🔗 ${articleUrl}`;

    try {
      if (article.fanpage_image) {
        const imageUrl = article.fanpage_image.startsWith('http')
          ? article.fanpage_image
          : `${frontendUrl}${article.fanpage_image}`;

        const res = await axios.post(
          `${this.graphUrl}/${pageId}/photos`,
          {
            url: imageUrl,
            caption,
            access_token: token,
          },
        );
        return { post_id: res.data.post_id || res.data.id };
      } else {
        const res = await axios.post(
          `${this.graphUrl}/${pageId}/feed`,
          {
            message: caption,
            link: articleUrl,
            access_token: token,
          },
        );
        return { post_id: res.data.id };
      }
    } catch (err: any) {
      const fbError = err?.response?.data?.error?.message || err.message;
      this.logger.error(`Facebook post failed: ${fbError}`);
      throw new Error(`Đăng Facebook thất bại: ${fbError}`);
    }
  }

  async deletePost(fbPostId: string): Promise<void> {
    const token = this.config.get<string>('FB_PAGE_ACCESS_TOKEN');
    try {
      await axios.delete(`${this.graphUrl}/${fbPostId}`, {
        params: { access_token: token },
      });
      this.logger.log(`Facebook post deleted: ${fbPostId}`);
    } catch (err: any) {
      const fbError = err?.response?.data?.error?.message || err.message;
      this.logger.warn(`Facebook delete failed (${fbPostId}): ${fbError}`);
    }
  }
}

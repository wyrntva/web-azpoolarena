import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Ga4Summary {
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface Ga4TopPage {
  path: string;
  title: string;
  pageviews: number;
  users: number;
}

export interface Ga4TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

export interface Ga4Device {
  device: string;
  sessions: number;
  users: number;
}

export interface Ga4Country {
  country: string;
  sessions: number;
  users: number;
}

export interface Ga4Data {
  summary: Ga4Summary;
  top_pages: Ga4TopPage[];
  traffic_sources: Ga4TrafficSource[];
  devices: Ga4Device[];
  countries: Ga4Country[];
}

/**
 * Kết nối Google Analytics 4 Data API qua Service Account.
 *
 * Biến môi trường cần thiết:
 *   GA4_PROPERTY_ID         — số Property ID (ví dụ: "123456789")
 *   GA4_SERVICE_ACCOUNT_JSON — nội dung file JSON của Service Account (khuyến nghị)
 *   hoặc GA4_SERVICE_ACCOUNT_KEY_PATH — đường dẫn tuyệt đối tới file JSON key
 *
 * Nếu không cấu hình, module vẫn khởi động được nhưng trả về null cho phần GA4.
 */
@Injectable()
export class Ga4Service {
  private readonly logger = new Logger(Ga4Service.name);
  private client: any = null;
  private propertyId: string | null = null;
  private ready = false;

  constructor(private readonly configService: ConfigService) {
    this.initClient();
  }

  private async initClient(): Promise<void> {
    const propertyId = this.configService.get<string>('GA4_PROPERTY_ID');
    if (!propertyId) {
      this.logger.warn('GA4_PROPERTY_ID chưa cấu hình — tính năng GA4 bị tắt');
      return;
    }
    this.propertyId = propertyId;

    const keyJson = this.configService.get<string>('GA4_SERVICE_ACCOUNT_JSON');
    const keyPath = this.configService.get<string>(
      'GA4_SERVICE_ACCOUNT_KEY_PATH',
    );

    if (!keyJson && !keyPath) {
      this.logger.warn(
        'Chưa cấu hình GA4_SERVICE_ACCOUNT_JSON hoặc GA4_SERVICE_ACCOUNT_KEY_PATH',
      );
      return;
    }

    try {
      // Dynamic import để không bắt buộc cài package nếu không dùng GA4
      const { BetaAnalyticsDataClient } =
        await import('@google-analytics/data');

      if (keyJson) {
        const credentials = JSON.parse(keyJson);
        this.client = new BetaAnalyticsDataClient({ credentials });
      } else {
        this.client = new BetaAnalyticsDataClient({ keyFilename: keyPath });
      }

      this.ready = true;
      this.logger.log(
        `GA4 client khởi tạo thành công (property: ${propertyId})`,
      );
    } catch (err: any) {
      this.logger.error(
        'Khởi tạo GA4 client thất bại — kiểm tra package @google-analytics/data và credentials',
        err?.message,
      );
    }
  }

  async getMetrics(
    startDate: string,
    endDate: string,
  ): Promise<Ga4Data | null> {
    if (!this.ready || !this.client || !this.propertyId) return null;

    try {
      const property = `properties/${this.propertyId}`;
      const dateRanges = [{ startDate, endDate }];

      const [summaryRes, topPagesRes, sourcesRes, devicesRes, countriesRes] =
        await Promise.all([
          this.client.runReport({
            property,
            dateRanges,
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
            ],
          }),
          this.client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
            orderBys: [
              { metric: { metricName: 'screenPageViews' }, desc: true },
            ],
            limit: 10,
          }),
          this.client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
            metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10,
          }),
          this.client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          }),
          this.client.runReport({
            property,
            dateRanges,
            dimensions: [{ name: 'country' }],
            metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10,
          }),
        ]);

      const mv = summaryRes[0]?.rows?.[0]?.metricValues ?? [];
      const summary: Ga4Summary = {
        sessions: parseInt(mv[0]?.value ?? '0', 10),
        users: parseInt(mv[1]?.value ?? '0', 10),
        pageviews: parseInt(mv[2]?.value ?? '0', 10),
        bounce_rate: Math.round(parseFloat(mv[3]?.value ?? '0') * 1000) / 10,
        avg_session_duration: Math.round(parseFloat(mv[4]?.value ?? '0')),
      };

      const top_pages: Ga4TopPage[] = (topPagesRes[0]?.rows ?? []).map(
        (row: any) => ({
          path: row.dimensionValues?.[0]?.value ?? '',
          title: row.dimensionValues?.[1]?.value ?? '',
          pageviews: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
          users: parseInt(row.metricValues?.[1]?.value ?? '0', 10),
        }),
      );

      const traffic_sources: Ga4TrafficSource[] = (
        sourcesRes[0]?.rows ?? []
      ).map((row: any) => ({
        source: row.dimensionValues?.[0]?.value ?? '',
        medium: row.dimensionValues?.[1]?.value ?? '',
        sessions: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
        users: parseInt(row.metricValues?.[1]?.value ?? '0', 10),
      }));

      const devices: Ga4Device[] = (devicesRes[0]?.rows ?? []).map(
        (row: any) => ({
          device: row.dimensionValues?.[0]?.value ?? '',
          sessions: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
          users: parseInt(row.metricValues?.[1]?.value ?? '0', 10),
        }),
      );

      const countries: Ga4Country[] = (countriesRes[0]?.rows ?? []).map(
        (row: any) => ({
          country: row.dimensionValues?.[0]?.value ?? '',
          sessions: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
          users: parseInt(row.metricValues?.[1]?.value ?? '0', 10),
        }),
      );

      return { summary, top_pages, traffic_sources, devices, countries };
    } catch (err: any) {
      this.logger.error('GA4 runReport thất bại', err?.message);
      return null;
    }
  }
}

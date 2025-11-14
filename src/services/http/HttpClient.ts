import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/Logger.ts';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export class HttpClient {
  private api: AxiosInstance;

  constructor(baseURL?: string) {
    this.api = axios.create({
      baseURL:
        baseURL || process.env.API_BASE_URL || 'http://localhost:4000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      config => {
        logger.debug('API Request', {
          module: 'HttpClient',
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      error => {
        logger.error('API Request Error', { module: 'HttpClient' }, error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      response => {
        logger.info('API Response Success', {
          module: 'HttpClient',
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          statusText: response.statusText,
          responseSize: JSON.stringify(response.data).length,
          responseType: typeof response.data,
        });

        // Log response data for debugging (only in debug level)
        logger.debug('API Response Data', {
          module: 'HttpClient',
          url: response.config.url,
          data: response.data,
        });

        // Check if response follows our ApiResponse structure
        const responseData = response.data as ApiResponse;

        if (
          responseData &&
          typeof responseData === 'object' &&
          'success' in responseData
        ) {
          if (!responseData.success) {
            // Backend returned success: false
            const errorMessage =
              responseData.error ||
              responseData.message ||
              'API operation failed';
            logger.error('API Business Logic Error', {
              module: 'HttpClient',
              url: response.config.url,
              error: errorMessage,
              success: responseData.success,
            });

            throw new ApiError(errorMessage, response.status, responseData);
          }

          // Create a new response structure with extracted data
          const extractedResponse: HttpResponse<typeof responseData.data> = {
            data: responseData.data,
            status: response.status,
            statusText: response.statusText,
          };

          logger.debug('API Response Data Extracted', {
            module: 'HttpClient',
            url: response.config.url,
            extractedData: responseData.data,
          });

          // Return the custom response structure
          return extractedResponse as unknown as typeof response;
        }

        return response;
      },
      error => {
        logger.error(
          'API Response Error',
          {
            module: 'HttpClient',
            status: error.response?.status,
            url: error.config?.url,
          },
          error
        );
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<HttpResponse<T>> {
    return this.api.get<T>(url) as Promise<HttpResponse<T>>;
  }

  async post<T>(url: string, data?: unknown): Promise<HttpResponse<T>> {
    return this.api.post<T>(url, data) as Promise<HttpResponse<T>>;
  }

  async put<T>(url: string, data?: unknown): Promise<HttpResponse<T>> {
    return this.api.put<T>(url, data) as Promise<HttpResponse<T>>;
  }

  async patch<T>(url: string, data?: unknown): Promise<HttpResponse<T>> {
    return this.api.patch<T>(url, data) as Promise<HttpResponse<T>>;
  }

  async delete<T>(url: string): Promise<HttpResponse<T>> {
    return this.api.delete<T>(url) as Promise<HttpResponse<T>>;
  }
}

export const httpClient = new HttpClient();

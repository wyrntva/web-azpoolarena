/**
 * Centralized error handling utilities
 * Maps API errors to user-friendly Vietnamese messages
 */

export interface ApiError {
    response?: {
        status: number;
        data?: {
            detail?: string;
            message?: string;
        };
    };
    code?: string;
    message?: string;
}

/**
 * Get user-friendly error message from API error
 */
export const getErrorMessage = (error: ApiError | any): string => {
    // Handle axios errors
    if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || error.response.data?.message;

        // Map common HTTP status codes to Vietnamese messages
        switch (status) {
            case 400:
                return detail || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            case 401:
                return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            case 403:
                return 'Bạn không có quyền thực hiện thao tác này.';
            case 404:
                return 'Không tìm thấy dữ liệu yêu cầu.';
            case 409:
                return detail || 'Dữ liệu đã tồn tại hoặc xung đột.';
            case 422:
                return detail || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
            case 429:
                return 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.';
            case 500:
                return 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
            case 502:
            case 503:
                return 'Hệ thống đang bảo trì. Vui lòng thử lại sau.';
            case 504:
                return 'Kết nối timeout. Vui lòng kiểm tra mạng và thử lại.';
            default:
                return detail || `Lỗi không xác định (${status}). Vui lòng thử lại.`;
        }
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'Kết nối timeout. Vui lòng kiểm tra mạng và thử lại.';
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
        return 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.';
    }

    // Handle cancelled requests
    if (error.code === 'ERR_CANCELED') {
        return 'Yêu cầu đã bị hủy.';
    }

    // Fallback to generic message
    return error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ApiError | any): boolean => {
    if (!error.response) return true; // Network errors are retryable

    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors and rate limits
};

/**
 * Log error with context for debugging
 */
export const logError = (error: ApiError | any, _context?: Record<string, any>) => {
    // errors are handled by toast notifications; no console output in production
};

/**
 * Common error messages for specific operations
 */
export const ERROR_MESSAGES = {
    FETCH_FAILED: 'Không thể tải dữ liệu',
    CREATE_FAILED: 'Không thể tạo',
    UPDATE_FAILED: 'Không thể cập nhật',
    DELETE_FAILED: 'Không thể xóa',
    SAVE_FAILED: 'Không thể lưu',
    UPLOAD_FAILED: 'Không thể tải lên',
    DOWNLOAD_FAILED: 'Không thể tải xuống',
    EXPORT_FAILED: 'Không thể xuất dữ liệu',
    IMPORT_FAILED: 'Không thể nhập dữ liệu',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    LOGOUT_FAILED: 'Đăng xuất thất bại',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    UNKNOWN_ERROR: 'Lỗi không xác định',
} as const;

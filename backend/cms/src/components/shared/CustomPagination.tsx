import React from 'react';
import { Icon } from '@iconify/react';

interface CustomPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 0) return null;

    const renderPageNumbers = () => {
        const pages = [];
        // Simple logic for now: show all or localized window. 
        // User requested: "nếu có 1 trang thì chỉ hiện 1 số 1 thôi". 
        // Let's implement a smart visible range if needed, but for now standard range.

        // Use a simple range logic: always show first, last, and current neighborhood
        // For simplicity matching the prompt "để mỗi số thôi", we render buttons.

        for (let i = 1; i <= totalPages; i++) {
            // Show all pages if totalPages is small (e.g. < 7)
            // Otherwise show 1, ..., current-1, current, current+1, ..., last
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                            ${currentPage === i
                                ? 'bg-primary text-white'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        {i}
                    </button>
                );
            } else if (
                (i === currentPage - 2 && i > 1) ||
                (i === currentPage + 2 && i < totalPages)
            ) {
                pages.push(<span key={`dots-${i}`} className="flex items-end justify-center w-4 h-8 text-gray-400">...</span>);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700"
            >
                <Icon icon="solar:alt-arrow-left-linear" width={16} />
            </button>

            {renderPageNumbers()}

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700"
            >
                <Icon icon="solar:alt-arrow-right-linear" width={16} />
            </button>
        </div>
    );
};

export default CustomPagination;

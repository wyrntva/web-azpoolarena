import { ReactNode } from 'react';
import { Modal, Button } from 'flowbite-react';
import SimpleBar from 'simplebar-react';

export interface BaseDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
    footer?: ReactNode;
    showFooter?: boolean;
    onConfirm?: () => void;
    confirmText?: string;
    confirmColor?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'light' | 'dark';
    onCancel?: () => void;
    cancelText?: string;
    cancelColor?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'light' | 'dark';
    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
    loading?: boolean;
}

const BaseDialog: React.FC<BaseDialogProps> = ({
    open,
    onClose,
    title,
    children,
    size = 'lg',
    footer,
    showFooter = true,
    onConfirm,
    confirmText = 'Lưu',
    confirmColor = 'blue',
    onCancel,
    cancelText = 'Hủy',
    cancelColor = 'gray',
    bodyClassName = '',
    headerClassName = '',
    footerClassName = 'justify-end',
    loading = false,
}) => {
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    const defaultFooter = (
        <>
            {onCancel && (
                <Button color={cancelColor} onClick={handleCancel}>
                    {cancelText}
                </Button>
            )}
            {onConfirm && (
                <Button color={confirmColor} onClick={onConfirm} disabled={loading}>
                    {loading ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {confirmText}
                        </div>
                    ) : confirmText}
                </Button>
            )}
            {!onCancel && !onConfirm && (
                <Button color={cancelColor} onClick={onClose}>
                    {cancelText}
                </Button>
            )}
        </>
    );

    return (
        <Modal show={open} onClose={onClose} size={size}>
            <Modal.Header className={headerClassName}>{title}</Modal.Header>
            <Modal.Body className="p-0 overflow-hidden flex flex-col">
                <SimpleBar className="flex-1 max-h-[calc(85vh-120px)]" autoHide={false}>
                    <div className={`p-6 ${bodyClassName}`}>
                        {children}
                    </div>
                </SimpleBar>
            </Modal.Body>
            {showFooter && (
                <Modal.Footer className={`${footerClassName} border-t border-gray-200 dark:border-gray-700`}>
                    {footer || defaultFooter}
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default BaseDialog;

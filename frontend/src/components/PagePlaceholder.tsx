import { Card } from 'flowbite-react';

interface PagePlaceholderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
}

const PagePlaceholder = ({ title, description, icon }: PagePlaceholderProps) => {
    return (
        <div className="p-6">
            <Card>
                <div className="flex flex-col items-center justify-center py-12">
                    {icon && <div className="mb-4 text-6xl text-gray-400">{icon}</div>}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                            {description}
                        </p>
                    )}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            🚧 Trang này đang được phát triển
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PagePlaceholder;

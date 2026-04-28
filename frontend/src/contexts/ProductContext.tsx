import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI, type ProductApiResponse } from '../api/product.api';

export interface Product {
    id: number;
    name: string;
    categoryId: number | null;
    type: string;
    code?: string;
    sellPrice?: number;
    costPrice?: number;
    unit?: string;
    color?: string;
    image?: string;
    description?: string;
    channels: string[];
    inventoryLinked?: boolean;
    inventoryId?: number;
    hourlyPrice?: number;
    timeIntervalValue?: number;
    timeIntervalUnit?: string;
    firstHourEnabled?: boolean;
    specialHourEnabled?: boolean;
    showOnScoreboard?: boolean;
    createdAt: Date;
}

interface ProductContextType {
    products: Product[];
    loading: boolean;
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
    updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;
    getProductsByCategoryId: (categoryId: number) => Product[];
    refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const mapApiToProduct = (p: ProductApiResponse): Product => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId ?? null,
    type: p.type,
    code: p.code ?? undefined,
    sellPrice: p.sellPrice ?? undefined,
    costPrice: p.costPrice ?? undefined,
    unit: p.unit ?? undefined,
    color: p.color ?? undefined,
    image: p.image ?? undefined,
    description: p.description ?? undefined,
    channels: p.channels ?? [],
    inventoryLinked: p.inventoryLinked ?? undefined,
    inventoryId: p.inventoryId ?? undefined,
    hourlyPrice: p.hourlyPrice ?? undefined,
    timeIntervalValue: p.timeIntervalValue ?? undefined,
    timeIntervalUnit: p.timeIntervalUnit ?? undefined,
    firstHourEnabled: p.firstHourEnabled ?? undefined,
    specialHourEnabled: p.specialHourEnabled ?? undefined,
    showOnScoreboard: p.showOnScoreboard ?? true,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
});

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshProducts = async () => {
        try {
            setLoading(true);
            const res = await productAPI.getAll();
            setProducts(res.data.map(mapApiToProduct));
        } catch (err) {
            toast.error('Không thể tải danh sách mặt hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProducts();
    }, []);

    const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
        try {
            const res = await productAPI.create({
                ...product,
                channels: product.channels ?? null,
            });
            const created = mapApiToProduct(res.data);
            setProducts(prev => [...prev, created]);
            return created;
        } catch (err) {
            toast.error('Không thể thêm mặt hàng');
            throw err;
        }
    };

    const updateProduct = async (id: number, updates: Partial<Product>) => {
        try {
            const res = await productAPI.update(id, {
                ...updates,
                channels: updates.channels ?? undefined,
            });
            const updated = mapApiToProduct(res.data);
            setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
        } catch (err) {
            toast.error('Không thể cập nhật mặt hàng');
            throw err;
        }
    };

    const deleteProduct = async (id: number) => {
        try {
            await productAPI.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            toast.error('Không thể xóa mặt hàng');
            throw err;
        }
    };

    const getProductsByCategoryId = (categoryId: number) => {
        return products.filter(p => p.categoryId === categoryId);
    };

    return (
        <ProductContext.Provider
            value={{
                products,
                loading,
                addProduct,
                updateProduct,
                deleteProduct,
                getProductsByCategoryId,
                refreshProducts,
            }}
        >
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within ProductProvider');
    }
    return context;
};

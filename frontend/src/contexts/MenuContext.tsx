import React, { createContext, useContext, useState, useEffect } from 'react';
import { menuAPI, MenuApiResponse } from '../api/menu.api';
import toast from 'react-hot-toast';

export interface Menu {
    id: number;
    name: string;
    icon: string;
    image?: string | null;
    productIds: number[];
    sort_order: number;
    createdAt: Date;
}

interface MenuContextType {
    menus: Menu[];
    loading: boolean;
    addMenu: (menu: { name: string; icon: string; image?: string | null; productIds: number[] }) => Promise<void>;
    updateMenu: (id: number, updates: Partial<Menu>) => Promise<void>;
    deleteMenu: (id: number) => Promise<void>;
    addProductToMenu: (menuId: number, productId: number) => Promise<void>;
    removeProductFromMenu: (menuId: number, productId: number) => Promise<void>;
    reorderMenus: (sourceIndex: number, destinationIndex: number) => Promise<void>;
    refreshMenus: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const mapApiResponseToMenu = (apiMenu: MenuApiResponse): Menu => ({
    ...apiMenu,
    createdAt: apiMenu.createdAt ? new Date(apiMenu.createdAt) : new Date(),
});

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshMenus = async () => {
        try {
            setLoading(true);
            const response = await menuAPI.getAll();
            setMenus(response.data.map(mapApiResponseToMenu));
        } catch (error) {
            toast.error('Không thể tải danh sách thực đơn');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if user is authenticated
        const token = localStorage.getItem('access_token');
        if (token) {
            refreshMenus();
        } else {
            setLoading(false);
        }
    }, []);

    const addMenu = async (menuData: { name: string; icon: string; image?: string | null; productIds: number[] }) => {
        try {
            const response = await menuAPI.create(menuData);
            setMenus(prev => [...prev, mapApiResponseToMenu(response.data)]);
        } catch (error) {
            toast.error('Không thể tạo thực đơn');
            throw error;
        }
    };

    const updateMenu = async (id: number, updates: Partial<Menu>) => {
        try {
            const payload: { name?: string; icon?: string; image?: string | null; productIds?: number[] } = {};

            if (updates.name !== undefined) payload.name = updates.name;
            if (updates.icon !== undefined) payload.icon = updates.icon;
            if (updates.image !== undefined) payload.image = updates.image;
            if (updates.productIds !== undefined) {
                const raw = updates.productIds as unknown;

                if (Array.isArray(raw)) {
                    payload.productIds = raw
                        .map((v) => (typeof v === 'string' ? Number(v) : v))
                        .filter((v) => Number.isFinite(v)) as number[];
                } else if (typeof raw === 'string') {
                    payload.productIds = raw
                        .split(',')
                        .map((s) => Number(s.trim()))
                        .filter((v) => Number.isFinite(v));
                } else {
                    payload.productIds = [];
                }
            }

            const response = await menuAPI.update(id, payload);
            setMenus(prev => prev.map(m => (m.id === id ? mapApiResponseToMenu(response.data) : m)));
        } catch (error) {
            toast.error('Không thể cập nhật thực đơn');
            throw error;
        }
    };

    const deleteMenu = async (id: number) => {
        try {
            await menuAPI.delete(id);
            setMenus(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            toast.error('Không thể xóa thực đơn');
            throw error;
        }
    };

    const addProductToMenu = async (menuId: number, productId: number) => {
        const menu = menus.find(m => m.id === menuId);
        if (!menu) return;
        
        try {
            const updatedProductIds = menu.productIds.includes(productId)
                ? menu.productIds
                : [...menu.productIds, productId];
            await updateMenu(menuId, { productIds: updatedProductIds });
        } catch (error) {
            // Error handled in updateMenu
        }
    };

    const removeProductFromMenu = async (menuId: number, productId: number) => {
        const menu = menus.find(m => m.id === menuId);
        if (!menu) return;
        
        try {
            const updatedProductIds = menu.productIds.filter(id => id !== productId);
            await updateMenu(menuId, { productIds: updatedProductIds });
        } catch (error) {
            // Error handled in updateMenu
        }
    };

    const reorderMenus = async (sourceIndex: number, destinationIndex: number) => {
        // Optimistic UI update
        const originalMenus = [...menus];
        const newMenus = [...menus];
        const [moved] = newMenus.splice(sourceIndex, 1);
        newMenus.splice(destinationIndex, 0, moved);
        
        // Update sort_order based on new positions
        const reorderData = newMenus.map((m, index) => ({
            id: m.id,
            sort_order: index
        }));
        
        setMenus(newMenus.map((m, index) => ({ ...m, sort_order: index })));

        try {
            await menuAPI.reorder(reorderData);
        } catch (error) {
            toast.error('Không thể lưu thứ tự thực đơn');
            setMenus(originalMenus); // Rollback on failure
        }
    };

    return (
        <MenuContext.Provider value={{ 
            menus, 
            loading, 
            addMenu, 
            updateMenu, 
            deleteMenu, 
            addProductToMenu, 
            removeProductFromMenu, 
            reorderMenus,
            refreshMenus
        }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenus = () => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenus must be used within MenuProvider');
    }
    return context;
};

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Category {
    id: number;
    name: string;
    description?: string;
    itemCount: number;
}

interface CategoryContextType {
    categories: Category[];
    addCategory: (category: Omit<Category, 'id' | 'itemCount'>) => void;
    updateCategory: (id: number, category: Partial<Category>) => void;
    deleteCategory: (id: number) => void;
    updateCategoryItemCount: (categoryId: number, count: number) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useState<Category[]>(() => {
        // Load from localStorage
        const saved = localStorage.getItem('productCategories');
        if (saved) {
            return JSON.parse(saved);
        }
        // Default categories
        return [
            { id: 1, name: 'Matcha/cacao', itemCount: 0 },
            { id: 2, name: 'Nước Ép', itemCount: 0 },
            { id: 3, name: 'Trà', itemCount: 0 },
            { id: 4, name: 'COMBO', itemCount: 0 },
            { id: 5, name: 'Dịch vụ', itemCount: 0 },
            { id: 6, name: 'Café', itemCount: 0 },
            { id: 7, name: 'Đồ ăn', itemCount: 0 },
            { id: 8, name: 'Đồ ăn vặt', itemCount: 0 },
            { id: 9, name: 'ĐỒ UỐNG ĐÓNG CHAI', itemCount: 0 },
            { id: 10, name: 'Thuốc lá', itemCount: 0 },
        ];
    });

    useEffect(() => {
        // Save to localStorage whenever categories change
        localStorage.setItem('productCategories', JSON.stringify(categories));
    }, [categories]);

    const addCategory = (category: Omit<Category, 'id' | 'itemCount'>) => {
        const newCategory: Category = {
            ...category,
            id: Math.max(...categories.map(c => c.id), 0) + 1,
            itemCount: 0,
        };
        setCategories([...categories, newCategory]);
    };

    const updateCategory = (id: number, updates: Partial<Category>) => {
        setCategories(categories.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
        ));
    };

    const deleteCategory = (id: number) => {
        setCategories(categories.filter(cat => cat.id !== id));
    };

    const updateCategoryItemCount = (categoryId: number, count: number) => {
        setCategories(categories.map(cat =>
            cat.id === categoryId ? { ...cat, itemCount: count } : cat
        ));
    };

    return (
        <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, updateCategoryItemCount }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategories = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within CategoryProvider');
    }
    return context;
};

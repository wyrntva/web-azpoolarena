import axiosClient from './axiosClient.ts';
import type { AxiosResponse } from 'axios';
import type { Inventory } from '../types/api';
import type { PaginatedResponse } from '../types/common';

interface InventoryQueryParams {
    category_id?: number;
    status_filter?: string;
    search?: string;
    page?: number;
    page_size?: number;
}

interface CreateInventoryData {
    product_name: string;
    category_id: number;
    base_unit_id: number;
    quantity: number;
    min_quantity: number;
    conversion_unit_id?: number;
    conversion_rate?: number;
}

type UpdateInventoryData = Partial<CreateInventoryData>;

interface InventoryInData {
    import_date?: string;
    note?: string;
    items: {
        inventory_id: number;
        quantity: number;
        unit_type?: 'base' | 'large';
        price?: number;
        payment_method?: 'cash' | 'bank';
    }[];
}

interface InventoryOutData {
    export_date?: string;
    note?: string;
    items: {
        inventory_id: number;
        quantity: number;
        unit_type?: 'base' | 'large';
    }[];
}

interface InventoryCheckData {
    items: { inventory_id: number; actual_quantity: number; note?: string }[];
    note?: string;
    check_date?: string;
}

interface InventoryTransactionRecord {
    id: number;
    inventory_id: number;
    transaction_type: 'in' | 'out';
    quantity: number;
    price?: number;
    note?: string;
    transaction_date: string;
    created_by?: number;
}

interface InventoryCheckRecord {
    id: number;
    check_date: string;
    note?: string;
    items: { inventory_id: number; actual_quantity: number; note?: string }[];
    created_by?: number;
}

export const inventoryAPI = {
    getAll: (params?: InventoryQueryParams): Promise<AxiosResponse<PaginatedResponse<Inventory>>> => {
        return axiosClient.get('/api/inventories', { params });
    },

    getById: (id: number): Promise<AxiosResponse<Inventory>> => {
        return axiosClient.get(`/api/inventories/${id}`);
    },

    create: (data: CreateInventoryData): Promise<AxiosResponse<Inventory>> => {
        return axiosClient.post('/api/inventories', data);
    },

    update: (id: number, data: UpdateInventoryData): Promise<AxiosResponse<Inventory>> => {
        return axiosClient.patch(`/api/inventories/${id}`, data);
    },

    delete: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/inventories/${id}`);
    },

    updateStock: (id: number, quantity: number): Promise<AxiosResponse<Inventory>> => {
        return axiosClient.patch(`/api/inventories/${id}/stock`, { quantity });
    },

    // Backward compatibility aliases
    getInventories(params?: InventoryQueryParams) {
        return this.getAll(params);
    },

    createInventory(data: CreateInventoryData) {
        return this.create(data);
    },

    updateInventory(id: number, data: UpdateInventoryData) {
        return this.update(id, data);
    },

    deleteInventory(id: number) {
        return this.delete(id);
    },

    // Transaction methods
    createInventoryIn: (data: InventoryInData): Promise<AxiosResponse<InventoryTransactionRecord>> => {
        return axiosClient.post('/api/inventory-in', data);
    },

    createInventoryOut: (data: InventoryOutData): Promise<AxiosResponse<InventoryTransactionRecord>> => {
        return axiosClient.post('/api/inventory-out', data);
    },

    getInventoryIns: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<InventoryTransactionRecord[]>> => {
        return axiosClient.get('/api/inventory-in', { params });
    },

    getInventoryOuts: (params?: { skip?: number; limit?: number }): Promise<AxiosResponse<InventoryTransactionRecord[]>> => {
        return axiosClient.get('/api/inventory-out', { params });
    },

    getInventoryChecks: (): Promise<AxiosResponse<InventoryCheckRecord[]>> => {
        return axiosClient.get('/api/inventory-checks');
    },

    createInventoryCheck: (data: InventoryCheckData): Promise<AxiosResponse<InventoryCheckRecord>> => {
        return axiosClient.post('/api/inventory-checks', data);
    },

    deleteInventoryCheck: (id: number): Promise<AxiosResponse<void>> => {
        return axiosClient.delete(`/api/inventory-checks/${id}`);
    },
};

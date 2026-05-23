import api from './api';

export interface Requisition {
    id: number;
    requisition_number: string;
    type: 'Project' | 'Department' | 'Site';
    required_date: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    justification: string | null;
    status: string;
    project?: { id: number; name: string };
    department?: { id: number; name: string };
    created_at: string;
    items?: RequisitionItem[];
    requester?: { id: number; first_name: string; last_name: string };
    approver?: { id: number; first_name: string; last_name: string };
    storekeeper?: { id: number; first_name: string; last_name: string };
}

export interface RequisitionItem {
    id: number;
    material_requisition_id: number;
    stock_id?: number;
    description: string;
    uom: string;
    quantity_requested: number;
    quantity_dispensed: number;
    specification?: string;
    status: string;
    stock?: {
        id: number;
        item_name: string;
        category: string;
    };
}

export interface RequisitionOptions {
    projects: { id: number; title: string }[];
    departments: { id: number; name: string }[];
    next_requisition_number: string;
}

export interface RequisitionPayload {
    requisition_number: string;
    type: string;
    project_id?: number;
    department_id?: number;
    required_date: string;
    priority: string;
    justification?: string;
    items: {
        stock_id?: number;
        description: string;
        uom: string;
        quantity_requested: number;
        specification?: string;
    }[];
}

export interface StockSearchItem {
    id: number;
    item_name: string;
    category: string;
    quantity: number;
    unit: string;
}

class RequisitionService {
    /**
     * Get staff requisitions
     */
    async getRequisitions(page = 1) {
        const response = await api.get(`/staff/requisitions?page=${page}`);
        return response.data;
    }

    /**
     * Get requisition form options (projects, departments, next number)
     */
    async getCreateOptions() {
        const response = await api.get('/staff/requisitions/create');
        return response.data;
    }

    /**
     * Search stock for requisition items
     */
    async searchStock(query: string) {
        const response = await api.get(`/staff/requisitions/search-stock?query=${query}`);
        return response.data;
    }

    /**
     * Store new requisition
     */
    async store(payload: RequisitionPayload) {
        const response = await api.post('/staff/requisitions', payload);
        return response.data;
    }

    /**
     * Get requisition details
     */
    async getRequisition(id: number) {
        const response = await api.get(`/staff/requisitions/${id}`);
        return response.data;
    }
}

export default new RequisitionService();

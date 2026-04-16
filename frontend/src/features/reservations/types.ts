export interface Category {
    id: number;
    name: string;
}

export interface Unit {
    id: number;
    label: string;
    status: string;
    price: number | string;
    x?: number;
    y?: number;
}

export interface ResourceMap {
    id: number;
    name: string;
    description: string;
    image: string | null;
    creator: number;
    category: number;
    units?: Unit[];
}

export interface Address {
    country: string;
    city: string;
    street: string;
    postal_code: string;
}
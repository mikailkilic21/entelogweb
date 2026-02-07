// Common Interfaces

export interface Account {
    id: number;
    name: string;
    code: string;
    cardType: number; // 1: Customer (Alıcı), 2: Supplier (Satıcı)
    town?: string;
    city?: string;
    balance: number;
    currency?: string;
    branch?: string;
    iban?: string;
}

export interface Bank {
    id: number;
    name: string;
    bankName: string;
    branch: string;
    code: string;
    iban: string;
    balance: number;
    currency: string;
}

export interface Transaction {
    id: number;
    date: string;
    type: string;
    amount: number;
    clientName?: string;
    bankAccount?: string;
    trcode: number;
    sign: number; // 0: Borç (Giriş/Alacak), 1: Alacak (Çıkış/Borç) - Muhasebe mantığına göre değişebilir
    description?: string;
}

export interface Product {
    id: number;
    name: string;
    code: string;
    brand?: string;
    stockLevel: number;
    salesAmount: number;
    unit?: string;
    stockValue?: number;
}

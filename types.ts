
export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost?: number; // Nuevo: Costo de adquisición
  currency: string; // 'CRC' | 'USD'
  stock: number;
  category: string;
}

export interface Customer {
  id: string;
  name: string; // Razón Social
  commercialName?: string; // Nombre Comercial
  email: string;
  identificationType: string; // Cédula Física, Jurídica, DIMEX, Pasaporte, etc.
  taxId: string; // El número en sí
  taxRegime?: string; // Régimen Simplificado, Tradicional, etc.
  economicActivity?: string; // Código de actividad económica
  
  // Dirección Fiscal Detallada
  country: string;
  province: string; // Provincia
  canton: string; // Cantón
  district: string; // Distrito
  zipCode?: string;
  address: string; // Señas exactas / Calle / Número
  
  phone: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  cost?: number; // Nuevo: Para guardar el costo histórico al momento de la venta
  discount?: number;
  description?: string; // Para el campo 'Detalle'
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  consecutive?: string; // Clave numérica completa de Hacienda (simulada)
  electronicKey?: string; // Clave de 50 dígitos
  haciendaStatus?: 'aceptado' | 'rechazado' | 'procesando' | 'error' | 'no_enviado' | 'anulado'; // Nuevo estado
  customerId: string;
  customerName: string;
  date: string;
  time?: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod?: string;
  saleCondition?: string; // Contado / Crédito
  notes?: string;
  reference?: string;
  currency: string; // 'CRC' | 'USD'
  exchangeRate?: number;
}

export interface Expense {
  id: string;
  date: string;
  provider: string;
  category: string; // 'Inventario', 'Servicios', 'Salarios', 'Alquiler', 'Otros', 'Costo de Ventas'
  description: string;
  amount: number;
  currency: string;
  reference?: string; // Factura del proveedor
}

export interface HaciendaConfig {
  username?: string; // CPF-...
  password?: string;
  pin?: string; // 4 digitos
  certificateUploaded?: boolean; // Si ya se subió el p12
  environment: 'staging' | 'production';
}

export interface AppSettings {
  companyName: string;
  commercialName?: string;
  companyTaxId: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  footerMessage?: string;
  currency: string;
  exchangeRate: number; // Tipo de Cambio
  taxRate: number;
  address: string; // Dirección resumida
  province?: string;
  canton?: string;
  district?: string;
  
  hacienda?: HaciendaConfig; // Credenciales API
}
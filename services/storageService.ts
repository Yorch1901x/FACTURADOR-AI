
import { Product, Customer, Invoice, AppSettings, InvoiceItem, Expense } from '../types';
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  writeBatch,
  increment
} from 'firebase/firestore';

const COLLECTIONS = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  EXPENSES: 'expenses',
  SETTINGS: 'settings',
};

const defaultSettings: AppSettings = {
  companyName: 'Mi Empresa S.A.',
  commercialName: 'Tecnología y Más',
  companyTaxId: '3-101-123456',
  companyEmail: 'facturacion@miempresa.com',
  companyPhone: '2222-0000',
  companyWebsite: 'www.miempresa.cr',
  footerMessage: 'Autorizado mediante resolución DGT-R-033-2019. Gracias por su preferencia.',
  currency: 'CRC', 
  exchangeRate: 520,
  taxRate: 13,
  address: 'San José, Mata Redonda, Sabana Norte, Edificio Principal',
  province: 'San José',
  canton: 'San José',
  district: 'Mata Redonda',
  hacienda: {
    environment: 'staging',
    username: '',
    password: '',
    pin: '',
    certificateUploaded: false
  }
};

// Helper to convert Firestore snapshot to typed array
const snapshotToData = <T>(snapshot: any): T[] => {
  return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as T[];
};

export const StorageService = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    return snapshotToData<Product>(snapshot);
  },
  
  addProduct: async (product: Product) => {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
  },

  updateProduct: async (product: Product) => {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product, { merge: true });
  },

  deleteProduct: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    return snapshotToData<Customer>(snapshot);
  },

  addCustomer: async (customer: Customer) => {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer);
  },

  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.INVOICES));
    // Sort by date descending ideally, doing it in client for simplicity
    return snapshotToData<Invoice>(snapshot).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // Modificado: Ahora acepta un Gasto Automático opcional para guardarlo en la misma transacción
  createInvoice: async (invoice: Invoice, productsToUpdate: {id: string, newStock: number}[], automaticExpense?: Expense) => {
    const batch = writeBatch(db);

    // 1. Create Invoice
    const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoice.id);
    batch.set(invoiceRef, invoice);

    // 2. Update Product Stocks atomically
    productsToUpdate.forEach(p => {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, p.id);
      batch.update(productRef, { stock: p.newStock });
    });

    // 3. Create Automatic Expense if provided (Costo de Venta)
    if (automaticExpense) {
      const expenseRef = doc(db, COLLECTIONS.EXPENSES, automaticExpense.id);
      batch.set(expenseRef, automaticExpense);
    }

    await batch.commit();
  },

  cancelInvoice: async (invoiceId: string, items: InvoiceItem[]) => {
    const batch = writeBatch(db);

    // 1. Mark Invoice as Cancelled
    const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
    batch.update(invoiceRef, { 
      status: 'cancelled',
      haciendaStatus: 'anulado' 
    });

    // 2. Restore Stock (Atomic increment)
    // Ensure items is an array to prevent crashes
    (items || []).forEach(item => {
      if (item.productId) {
        const productRef = doc(db, COLLECTIONS.PRODUCTS, item.productId);
        // Using firestore atomic increment to ensure data integrity.
        // Use set with merge: true instead of update to prevent failure if product document was deleted
        batch.set(productRef, { stock: increment(item.quantity) }, { merge: true });
      }
    });

    // Nota: Idealmente deberíamos anular el Gasto asociado también, pero requiere buscar el gasto por ID o referencia.
    // Por simplicidad en este paso, no se borra el gasto automáticamente, pero se podría implementar buscando
    // gastos donde reference == invoice.number y marcándolos o borrándolos.

    await batch.commit();
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    return snapshotToData<Expense>(snapshot).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addExpense: async (expense: Expense) => {
    await setDoc(doc(db, COLLECTIONS.EXPENSES, expense.id), expense);
  },

  deleteExpense: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id));
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      // Ensure hacienda object exists if legacy data
      if (!data.hacienda) {
        data.hacienda = defaultSettings.hacienda;
      }
      return data;
    }
    return defaultSettings;
  },

  saveSettings: async (settings: AppSettings) => {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), settings);
  },
  
  // Seeder
  seedData: async () => {
    const prodSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (prodSnap.empty) {
      const demoProducts: Product[] = [
        { id: '1', name: 'Laptop Pro X', description: 'Laptop de alto rendimiento', sku: 'LPX-001', price: 650000, cost: 450000, currency: 'CRC', stock: 10, category: 'Electrónica' },
        { id: '2', name: 'Monitor 27"', description: 'Monitor 4K UHD', sku: 'MON-002', price: 185000, cost: 120000, currency: 'CRC', stock: 25, category: 'Electrónica' },
        { id: '3', name: 'Silla Ergonómica', description: 'Silla de oficina premium', sku: 'CHR-003', price: 150, cost: 90, currency: 'USD', stock: 5, category: 'Muebles' },
      ];
      for (const p of demoProducts) {
        await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
      }
    }

    const custSnap = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    if (custSnap.empty) {
      const demoCustomers: Customer[] = [
        { 
          id: '1', 
          name: 'Juan Pérez', 
          commercialName: 'Juan Pérez',
          email: 'juan@example.com', 
          taxId: '1-1111-1111', 
          identificationType: '01 Cédula Física',
          taxRegime: 'Simplificado',
          country: 'Costa Rica',
          province: 'San José',
          canton: 'San José',
          district: 'Pavas',
          zipCode: '10109',
          address: 'De la Embajada Americana 200m Oeste', 
          phone: '8888-8888' 
        },
        { 
          id: '2', 
          name: 'Corporación ABC S.A.', 
          commercialName: 'ABC Corp',
          email: 'facturacion@abccorp.com', 
          taxId: '3-101-654321', 
          identificationType: '02 Cédula Jurídica',
          taxRegime: 'Tradicional',
          country: 'Costa Rica',
          province: 'Heredia',
          canton: 'Belén',
          district: 'La Asunción',
          zipCode: '40701',
          address: 'Centro Corporativo El Cafetal, Edificio A', 
          phone: '2299-9999' 
        },
      ];
      for (const c of demoCustomers) {
        await setDoc(doc(db, COLLECTIONS.CUSTOMERS, c.id), c);
      }
    }
  }
};

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

// --- LOCAL STORAGE HELPERS (Demo Mode) ---
// Prefixed to avoid conflicts
const LS_PREFIX = 'fai_db_';

const ls = {
  get: <T>(key: string): T[] => {
    try {
      return JSON.parse(localStorage.getItem(`${LS_PREFIX}${key}`) || '[]');
    } catch (e) { return []; }
  },
  set: (key: string, data: any) => localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(data)),
  
  add: (key: string, item: any) => {
    const items = ls.get<any>(key);
    // Update if exists, else push
    const idx = items.findIndex((i: any) => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    ls.set(key, items);
  },
  
  update: (key: string, item: any) => ls.add(key, item),
  
  delete: (key: string, id: string) => {
    const items = ls.get<any>(key);
    ls.set(key, items.filter((i: any) => i.id !== id));
  },
  
  getOne: <T>(key: string, id: string): T | undefined => {
    const items = ls.get<any>(key);
    return items.find((i: any) => i.id === id);
  }
};

// Helper to convert Firestore snapshot to typed array
const snapshotToData = <T>(snapshot: any): T[] => {
  return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as T[];
};

export const StorageService = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    if (!db) return ls.get<Product>(COLLECTIONS.PRODUCTS);
    const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    return snapshotToData<Product>(snapshot);
  },
  
  addProduct: async (product: Product) => {
    if (!db) return ls.add(COLLECTIONS.PRODUCTS, product);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
  },

  updateProduct: async (product: Product) => {
    if (!db) return ls.update(COLLECTIONS.PRODUCTS, product);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product, { merge: true });
  },

  deleteProduct: async (id: string) => {
    if (!db) return ls.delete(COLLECTIONS.PRODUCTS, id);
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    if (!db) return ls.get<Customer>(COLLECTIONS.CUSTOMERS);
    const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    return snapshotToData<Customer>(snapshot);
  },

  addCustomer: async (customer: Customer) => {
    if (!db) return ls.add(COLLECTIONS.CUSTOMERS, customer);
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), customer);
  },

  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    if (!db) {
       const invoices = ls.get<Invoice>(COLLECTIONS.INVOICES);
       return invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const snapshot = await getDocs(collection(db, COLLECTIONS.INVOICES));
    return snapshotToData<Invoice>(snapshot).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createInvoice: async (invoice: Invoice, productsToUpdate: {id: string, newStock: number}[], automaticExpense?: Expense) => {
    if (!db) {
      // Local Transaction Simulation
      ls.add(COLLECTIONS.INVOICES, invoice);
      
      const products = ls.get<Product>(COLLECTIONS.PRODUCTS);
      productsToUpdate.forEach(update => {
         const pIndex = products.findIndex(p => p.id === update.id);
         if (pIndex >= 0) {
           products[pIndex].stock = update.newStock;
         }
      });
      ls.set(COLLECTIONS.PRODUCTS, products);

      if (automaticExpense) {
        ls.add(COLLECTIONS.EXPENSES, automaticExpense);
      }
      return;
    }

    const batch = writeBatch(db);

    // 1. Create Invoice
    const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoice.id);
    batch.set(invoiceRef, invoice);

    // 2. Update Product Stocks atomically
    productsToUpdate.forEach(p => {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, p.id);
      batch.update(productRef, { stock: p.newStock });
    });

    // 3. Create Automatic Expense if provided
    if (automaticExpense) {
      const expenseRef = doc(db, COLLECTIONS.EXPENSES, automaticExpense.id);
      batch.set(expenseRef, automaticExpense);
    }

    await batch.commit();
  },

  cancelInvoice: async (invoiceId: string, items: InvoiceItem[]) => {
    if (!db) {
      // Local Cancel
      const invoices = ls.get<Invoice>(COLLECTIONS.INVOICES);
      const invIndex = invoices.findIndex(i => i.id === invoiceId);
      if (invIndex >= 0) {
         invoices[invIndex].status = 'cancelled';
         invoices[invIndex].haciendaStatus = 'anulado';
         ls.set(COLLECTIONS.INVOICES, invoices);

         const products = ls.get<Product>(COLLECTIONS.PRODUCTS);
         (items || []).forEach(item => {
           const pIndex = products.findIndex(p => p.id === item.productId);
           if (pIndex >= 0) {
             products[pIndex].stock += item.quantity;
           }
         });
         ls.set(COLLECTIONS.PRODUCTS, products);
      }
      return;
    }

    const batch = writeBatch(db);

    // 1. Mark Invoice as Cancelled
    const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
    batch.update(invoiceRef, { 
      status: 'cancelled',
      haciendaStatus: 'anulado' 
    });

    // 2. Restore Stock
    (items || []).forEach(item => {
      if (item.productId) {
        const productRef = doc(db, COLLECTIONS.PRODUCTS, item.productId);
        batch.set(productRef, { stock: increment(item.quantity) }, { merge: true });
      }
    });

    await batch.commit();
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    if (!db) {
       const expenses = ls.get<Expense>(COLLECTIONS.EXPENSES);
       return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const snapshot = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    return snapshotToData<Expense>(snapshot).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addExpense: async (expense: Expense) => {
    if (!db) return ls.add(COLLECTIONS.EXPENSES, expense);
    await setDoc(doc(db, COLLECTIONS.EXPENSES, expense.id), expense);
  },

  deleteExpense: async (id: string) => {
    if (!db) return ls.delete(COLLECTIONS.EXPENSES, id);
    await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id));
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    if (!db) {
       const saved = localStorage.getItem(`${LS_PREFIX}${COLLECTIONS.SETTINGS}`);
       if (saved) return JSON.parse(saved);
       return defaultSettings;
    }

    const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettings;
      if (!data.hacienda) {
        data.hacienda = defaultSettings.hacienda;
      }
      return data;
    }
    return defaultSettings;
  },

  saveSettings: async (settings: AppSettings) => {
    if (!db) {
       localStorage.setItem(`${LS_PREFIX}${COLLECTIONS.SETTINGS}`, JSON.stringify(settings));
       return;
    }
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), settings);
  },
  
  // Seeder
  seedData: async () => {
    const products = await StorageService.getProducts();
    if (products.length === 0) {
      const demoProducts: Product[] = [
        { id: '1', name: 'Laptop Pro X', description: 'Laptop de alto rendimiento', sku: 'LPX-001', price: 650000, cost: 450000, currency: 'CRC', stock: 10, category: 'Electrónica' },
        { id: '2', name: 'Monitor 27"', description: 'Monitor 4K UHD', sku: 'MON-002', price: 185000, cost: 120000, currency: 'CRC', stock: 25, category: 'Electrónica' },
        { id: '3', name: 'Silla Ergonómica', description: 'Silla de oficina premium', sku: 'CHR-003', price: 150, cost: 90, currency: 'USD', stock: 5, category: 'Muebles' },
      ];
      for (const p of demoProducts) {
        await StorageService.addProduct(p);
      }
    }

    const customers = await StorageService.getCustomers();
    if (customers.length === 0) {
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
        await StorageService.addCustomer(c);
      }
    }
  }
};


import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import ReceiptForm from './components/ReceiptForm'; // Nuevo
import Settings from './components/Settings';
import Login from './components/Login';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StorageService } from './services/storageService';
import { Product, Customer, Invoice, AppSettings, Expense, Payment } from './types';
import { Loader2 } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); 
  const [settings, setSettings] = useState<AppSettings>({
    companyName: '', companyTaxId: '', currency: '', taxRate: 0, address: '', exchangeRate: 520
  });

  // Initial Data Load - Only when user is present
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        // Load all data in parallel
        const [prodData, custData, invData, expData, settData] = await Promise.all([
          StorageService.getProducts(),
          StorageService.getCustomers(),
          StorageService.getInvoices(),
          StorageService.getExpenses(),
          StorageService.getSettings()
        ]);

        setProducts(prodData);
        setCustomers(custData);
        setInvoices(invData);
        setExpenses(expData);
        setSettings(settData);
      } catch (error) {
        console.error("Error loading data from Firebase:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleAddProduct = async (product: Product) => {
    setProducts(prev => [...prev, product]);
    await StorageService.addProduct(product);
  };

  const handleUpdateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    await StorageService.updateProduct(product);
  };

  const handleDeleteProduct = async (id: string) => {
    if(confirm('¿Está seguro de eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      await StorageService.deleteProduct(id);
    }
  };

  const handleAddCustomer = async (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    await StorageService.addCustomer(customer);
  };

  // Invoice Management & Automatic Cost Logic
  const handleCreateInvoice = async (invoice: Invoice) => {
    const stockUpdates: {id: string, newStock: number}[] = [];
    
    // 1. Calcular actualizaciones de stock localmente
    const updatedProducts = products.map(p => {
      const item = invoice.items.find(i => i.productId === p.id);
      if (item) {
        const newStock = p.stock - item.quantity;
        stockUpdates.push({ id: p.id, newStock });
        return { ...p, stock: newStock };
      }
      return p;
    });

    // 2. Calcular Costo
    let totalCostAmount = 0;
    invoice.items.forEach(item => {
      const unitCost = item.cost !== undefined ? item.cost : (products.find(p => p.id === item.productId)?.cost || 0);
      totalCostAmount += (unitCost * item.quantity);
    });

    let automaticExpense: Expense | undefined = undefined;

    // 3. Crear Gasto Automático
    if (totalCostAmount > 0) {
      automaticExpense = {
        id: crypto.randomUUID(),
        date: invoice.date, 
        provider: 'Inventario Interno',
        category: 'Costo de Ventas',
        description: `Costo de mercadería vendida - Fac #${invoice.number}`,
        amount: totalCostAmount,
        currency: invoice.currency,
        reference: invoice.number
      };
    }

    // 4. Actualizar Estado Local
    setInvoices(prev => [invoice, ...prev]);
    setProducts(updatedProducts);
    if (automaticExpense) {
      setExpenses(prev => [automaticExpense!, ...prev]);
    }

    // 5. Guardar
    await StorageService.createInvoice(invoice, stockUpdates, automaticExpense);
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`ADVERTENCIA: Va a anular la factura #${invoice.number}.\n\nEsto cambiará su estado a "Anulada" y devolverá automáticamente el stock de los productos al inventario.\n\n¿Está seguro de continuar?`)) {
      return;
    }

    try {
      await StorageService.cancelInvoice(invoice.id, invoice.items);

      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id 
          ? { ...inv, status: 'cancelled', haciendaStatus: 'anulado' } 
          : inv
      ));

      const stockMap = new Map<string, number>();
      invoice.items.forEach(item => {
        stockMap.set(item.productId, (stockMap.get(item.productId) || 0) + item.quantity);
      });

      setProducts(prev => prev.map(p => {
        if (stockMap.has(p.id)) {
          return { ...p, stock: p.stock + (stockMap.get(p.id) || 0) };
        }
        return p;
      }));
      
      alert("Factura anulada correctamente.");

    } catch (error) {
      console.error("Error al anular factura:", error);
      alert("Hubo un error al conectar con la base de datos.");
    }
  };

  // Payment Handler for ReceiptForm
  const handleAddPayment = async (invoiceId: string, payment: Payment) => {
      await StorageService.addPayment(invoiceId, payment);
      
      // Update local state to reflect payment immediately
      setInvoices(prev => prev.map(inv => {
          if (inv.id === invoiceId) {
             const newPayments = [...(inv.payments || []), payment];
             const currentBalance = (inv.balance !== undefined && !isNaN(inv.balance)) ? inv.balance : inv.total;
             const newBalance = Math.max(0, currentBalance - payment.amount);
             return {
                 ...inv,
                 payments: newPayments,
                 balance: newBalance,
                 status: newBalance <= 0.01 ? 'paid' : 'pending'
             };
          }
          return inv;
      }));
  };

  const handleUpdateStock = (productId: string, qty: number) => {};

  const handleAddExpense = async (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    await StorageService.addExpense(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    if(confirm('¿Seguro que desea eliminar este registro de gasto?')) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        await StorageService.deleteExpense(id);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-indigo-600">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Cargando datos de tu empresa...</p>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard invoices={invoices} products={products} />} />
          <Route 
            path="/inventory" 
            element={
              <Inventory 
                products={products} 
                onAddProduct={handleAddProduct} 
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            } 
          />
          <Route 
            path="/customers" 
            element={<Customers customers={customers} onAddCustomer={handleAddCustomer} />} 
          />
          <Route 
            path="/invoices" 
            element={<InvoiceList invoices={invoices} onCancelInvoice={handleCancelInvoice} onAddPayment={handleAddPayment} />} 
          />
          <Route 
            path="/create-invoice" 
            element={
              <InvoiceForm 
                products={products} 
                customers={customers} 
                settings={settings}
                onCreateInvoice={handleCreateInvoice}
                onUpdateStock={handleUpdateStock}
              />
            } 
          />
           <Route 
            path="/create-receipt" 
            element={
              <ReceiptForm 
                invoices={invoices}
                onAddPayment={handleAddPayment}
              />
            } 
          />
          <Route 
            path="/expenses" 
            element={<Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />} 
          />
           <Route 
            path="/reports" 
            element={<Reports invoices={invoices} expenses={expenses} products={products} />} 
          />
          <Route 
            path="/settings" 
            element={<Settings settings={settings} onSaveSettings={handleSaveSettings} />} 
          />
        </Routes>
      </Layout>
    </Router>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

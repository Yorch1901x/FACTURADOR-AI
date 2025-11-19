
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import Settings from './components/Settings';
import Login from './components/Login';
import Expenses from './components/Expenses'; // New
import Reports from './components/Reports'; // New
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StorageService } from './services/storageService';
import { Product, Customer, Invoice, AppSettings, Expense } from './types';
import { Loader2 } from 'lucide-react';

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); // New
  const [settings, setSettings] = useState<AppSettings>({
    companyName: '', companyTaxId: '', currency: '', taxRate: 0, address: '', exchangeRate: 520
  });

  // Initial Data Load - Only when user is present
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        // Opcional: StorageService.seedData(); si se necesita sembrar datos iniciales
        
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

    // 2. Calcular Costo Total de los Bienes Vendidos (COGS)
    // Usamos el costo histórico guardado en el item, o el costo actual del producto como fallback
    let totalCostAmount = 0;
    invoice.items.forEach(item => {
      // Si el ítem tiene costo guardado, úsalo. Si no, busca en productos (fallback).
      const unitCost = item.cost !== undefined ? item.cost : (products.find(p => p.id === item.productId)?.cost || 0);
      totalCostAmount += (unitCost * item.quantity);
    });

    let automaticExpense: Expense | undefined = undefined;

    // 3. Si hay costo asociado, crear el objeto Gasto
    if (totalCostAmount > 0) {
      automaticExpense = {
        id: crypto.randomUUID(),
        date: invoice.date, // Misma fecha de la factura
        provider: 'Inventario Interno',
        category: 'Costo de Ventas',
        description: `Costo de mercadería vendida - Fac #${invoice.number}`,
        amount: totalCostAmount,
        currency: invoice.currency, // Asumimos misma moneda o habría que convertir
        reference: invoice.number
      };
    }

    // 4. Actualizar Estado Local
    setInvoices(prev => [invoice, ...prev]);
    setProducts(updatedProducts);
    if (automaticExpense) {
      setExpenses(prev => [automaticExpense!, ...prev]);
    }

    // 5. Guardar todo en Base de Datos (Atómico)
    await StorageService.createInvoice(invoice, stockUpdates, automaticExpense);
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`ADVERTENCIA: Va a anular la factura #${invoice.number}.\n\nEsto cambiará su estado a "Anulada" y devolverá automáticamente el stock de los productos al inventario.\n\n¿Está seguro de continuar?`)) {
      return;
    }

    try {
      // 1. Perform DB Operation first to ensure integrity
      await StorageService.cancelInvoice(invoice.id, invoice.items);

      // 2. Update Local Invoices State
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id 
          ? { ...inv, status: 'cancelled', haciendaStatus: 'anulado' } 
          : inv
      ));

      // 3. Update Local Products Stock State
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

      // Nota: No eliminamos el gasto localmente para simplificar, pero se podría filtrar
      // expenses donde reference === invoice.number si quisiéramos limpiar el gasto también.
      
      alert("Factura anulada correctamente. El stock ha sido restaurado.");

    } catch (error) {
      console.error("Error al anular factura:", error);
      alert("Hubo un error al conectar con la base de datos. La factura no fue anulada.");
    }
  };

  const handleUpdateStock = (productId: string, qty: number) => {};

  // Expense Management
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
            element={<InvoiceList invoices={invoices} onCancelInvoice={handleCancelInvoice} />} 
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

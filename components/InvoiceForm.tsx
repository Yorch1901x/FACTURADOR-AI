
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Customer, Invoice, InvoiceItem, AppSettings } from '../types';
import { Plus, Trash2, Search, CreditCard, CheckCircle2, X, Printer, ArrowRight, FileCheck, Wallet, RefreshCw } from 'lucide-react';
import InvoicePrint from './InvoicePrint';

interface InvoiceFormProps {
  products: Product[];
  customers: Customer[];
  settings: AppSettings;
  onCreateInvoice: (invoice: Invoice) => void;
  onUpdateStock: (productId: string, qty: number) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ products, customers, settings, onCreateInvoice, onUpdateStock }) => {
  const navigate = useNavigate();
  
  // State for Success/Print View
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  // Header State
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [currency, setCurrency] = useState(settings.currency || 'CRC');
  const [saleCondition, setSaleCondition] = useState('Contado');
  
  // Initialize currency from settings when settings load
  useEffect(() => {
    if (settings.currency) {
      setCurrency(settings.currency);
    }
  }, [settings]);

  // Item Entry State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [unitPrice, setUnitPrice] = useState(0); // Nuevo estado para precio visible
  const [qty, setQty] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemDescription, setItemDescription] = useState(''); // "Detalle"
  const [isService, setIsService] = useState(false); // Radio toggles
  const [conversionInfo, setConversionInfo] = useState<string>(''); // Info visual de conversión

  // Invoice State
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  // Payment Amount State (Controlled)
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Currency symbol helper
  const getCurrencySymbol = (c: string = currency) => c === 'CRC' ? '₡' : '$';

  // --- LOGICA ROBUSTA DE CONVERSIÓN ---
  const getExchangeRate = () => {
    const rate = Number(settings.exchangeRate);
    return rate > 0 ? rate : 520;
  };

  const calculateConvertedPrice = (price: number, prodCurrency: string, invoiceCurrency: string) => {
    const from = (prodCurrency || 'CRC').toUpperCase().trim();
    const to = (invoiceCurrency || 'CRC').toUpperCase().trim();
    const rate = getExchangeRate();
    
    if (from === to) {
      setConversionInfo('');
      return price;
    }
    
    // USD to CRC
    if (from === 'USD' && to === 'CRC') {
      setConversionInfo(`Conversión: $${price} x ${rate}`);
      return price * rate;
    }
    
    // CRC to USD
    if (from === 'CRC' && to === 'USD') {
      setConversionInfo(`Conversión: ₡${price} / ${rate}`);
      return price / rate;
    }
    
    setConversionInfo('');
    return price;
  };

  // Recalcular precio si cambia la moneda de la factura y hay un producto seleccionado
  useEffect(() => {
    if (selectedProductId) {
        const prod = products.find(p => p.id === selectedProductId);
        if (prod) {
            const newPrice = calculateConvertedPrice(prod.price, prod.currency, currency);
            setUnitPrice(Number(newPrice.toFixed(2)));
        }
    }
  }, [currency, settings.exchangeRate]);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      // 1. Set description
      setItemDescription(prod.description || prod.name);
      
      // 2. Calculate and set price using robust logic
      const convertedPrice = calculateConvertedPrice(prod.price, prod.currency, currency);
      setUnitPrice(Number(convertedPrice.toFixed(2)));
    } else {
      setUnitPrice(0);
      setItemDescription('');
      setConversionInfo('');
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || qty < 1) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < qty && !isService) {
      alert(`Stock insuficiente. Solo hay ${product.stock} unidades.`);
      return;
    }

    // Usamos el unitPrice que ya está convertido y visible en el input
    const finalPrice = unitPrice;

    const baseTotal = finalPrice * qty;
    const discountAmount = (baseTotal * itemDiscount) / 100;
    const total = baseTotal - discountAmount;

    const newItem: InvoiceItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price: finalPrice,
      // Importante: Guardamos el costo original del producto para generar el Gasto Automático después
      // Si la moneda es diferente, idealmente convertimos el costo también, pero para simplificar usamos el costo base
      // o realizamos una conversión simple si es necesario.
      cost: product.cost || 0, 
      discount: itemDiscount,
      description: itemDescription,
      total: total
    };

    setItems([...items, newItem]);
    
    // Reset fields
    setSelectedProductId('');
    setUnitPrice(0);
    setQty(1);
    setItemDiscount(0);
    setItemDescription('');
    setConversionInfo('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const tax = (subtotal * settings.taxRate) / 100;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  // Auto-update payment amount when total changes
  useEffect(() => {
    setPaymentAmount(total);
  }, [total]);

  const handleSubmit = () => {
    if (!customerId || items.length === 0) {
      alert("Seleccione un cliente y agregue al menos un producto.");
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    const time = new Date().toLocaleTimeString();
    
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      number: `FAC-${Date.now().toString().slice(-6)}`,
      consecutive: `001000010100000${Date.now().toString().slice(-6)}`, // Simulación clave hacienda
      electronicKey: `506${Date.now()}12345678`, // Simulación 50 digitos
      haciendaStatus: 'aceptado', // Simulamos aceptación automática
      customerId,
      customerName: customer?.name || 'Desconocido',
      date,
      time,
      dueDate,
      items,
      subtotal,
      tax,
      total,
      status: 'paid', 
      paymentMethod,
      saleCondition,
      notes,
      reference,
      currency,
      exchangeRate: settings.exchangeRate
    };

    // 1. Update Logic (Stock & Save) handled by parent
    onCreateInvoice(newInvoice);

    // 2. Set created invoice to show print view instead of navigating
    setCreatedInvoice(newInvoice);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewInvoice = () => {
    setCreatedInvoice(null);
    setItems([]);
    setCustomerId('');
    setNotes('');
    setReference('');
    setCurrency(settings.currency || 'CRC');
    setPaymentAmount(0);
    // Keep date as today
  };

  // --- SUCCESS / PRINT VIEW ---
  if (createdInvoice) {
    const currentCustomer = customers.find(c => c.id === createdInvoice.customerId);
    
    return (
      <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
        {/* Actions Bar (No Print) */}
        <div className="no-print bg-white p-4 rounded-xl shadow-sm border border-green-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3 text-green-700">
             <div className="p-2 bg-green-100 rounded-full"><FileCheck size={24} /></div>
             <div>
               <h2 className="font-bold text-lg">¡Factura Procesada Correctamente!</h2>
               <p className="text-xs text-green-600">Documento electrónico generado. Costo de venta registrado.</p>
             </div>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => navigate('/invoices')} className="flex-1 md:flex-none px-4 py-2 text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg font-medium transition-colors text-sm">
                Ir al Historial
              </button>
              <button onClick={handleNewInvoice} className="flex-1 md:flex-none px-4 py-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Nueva Factura
              </button>
              <button onClick={handlePrint} className="flex-1 md:flex-none px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95">
                <Printer size={18} /> IMPRIMIR
              </button>
           </div>
        </div>

        {/* Printable Area Preview */}
        <div className="flex-1 overflow-auto bg-gray-500/10 p-4 md:p-8 rounded-xl border border-gray-200 shadow-inner flex justify-center">
           <div className="bg-white shadow-2xl scale-90 origin-top md:scale-100 transition-transform w-full max-w-[210mm]">
              <InvoicePrint invoice={createdInvoice} settings={settings} customer={currentCustomer} />
           </div>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Facturación / POS</h2>
           <p className="text-sm text-gray-500">Ingrese los detalles de la venta</p>
        </div>
        <div className="text-left sm:text-right flex flex-col items-end gap-1">
           <div className="bg-indigo-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
            <div className="text-xs text-gray-500 font-mono uppercase">Fecha Actual</div>
            <div className="font-bold text-gray-800">{new Date().toLocaleDateString()}</div>
          </div>
          <div className="text-xs text-indigo-600 font-medium flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded">
            <RefreshCw size={10} /> T.C. ₡{settings.exchangeRate || 520}
          </div>
        </div>
      </div>

      {/* --- SECTION 1: HEADER INFO --- */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
           <div className="md:col-span-2">
             <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cliente</label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm appearance-none"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
               >
                 <option value="">-- Buscar Cliente --</option>
                 {customers.map(c => (
                   <option key={c.id} value={c.id}>{c.name} - {c.taxId}</option>
                 ))}
               </select>
             </div>
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Moneda Factura</label>
             <div className="relative">
               <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <select 
                  className="w-full pl-9 pr-3 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-900 font-semibold rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={currency}
                  onChange={e => {
                    // If items exist, warn. If empty, just change.
                    if (items.length > 0) {
                      if(confirm('Cambiar la moneda recalculará los montos. Se recomienda limpiar los ítems. ¿Desea continuar?')) {
                        setItems([]); 
                        setCurrency(e.target.value);
                      }
                    } else {
                      setCurrency(e.target.value);
                    }
                  }}
               >
                 <option value="CRC">Colones (₡)</option>
                 <option value="USD">Dólares ($)</option>
               </select>
             </div>
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Condición Venta</label>
             <select 
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={saleCondition}
                onChange={e => setSaleCondition(e.target.value)}
             >
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
                <option value="Consignación">Consignación</option>
             </select>
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fecha Emisión</label>
             <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
           </div>
        </div>
      </div>

      {/* --- SECTION 2: ITEM ENTRY ROW --- */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
         {/* Use flex-wrap to prevent overlapping inputs on smaller screens */}
         <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end flex-wrap">
            
            {/* Radio Type */}
            <div className="flex items-center gap-4 pb-2 px-2 w-full sm:w-auto xl:w-auto justify-start h-[66px] items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" className="text-indigo-600 w-4 h-4" checked={!isService} onChange={() => setIsService(false)} />
                <span className="text-sm font-medium text-slate-700">Producto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" className="text-indigo-600 w-4 h-4" checked={isService} onChange={() => setIsService(true)} />
                <span className="text-sm font-medium text-slate-700">Servicio</span>
              </label>
            </div>

            {/* Product Select */}
            <div className="w-full sm:flex-1 xl:flex-grow xl:min-w-[280px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Producto / Servicio</label>
              <select 
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.sku} - {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full sm:w-auto gap-4 flex-wrap sm:flex-nowrap">
                {/* Unit Price (Editable/Viewable) */}
                 <div className="w-full sm:w-28">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Unit.</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">{getCurrencySymbol()}</span>
                    <input 
                      type="number" min="0" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700"
                      value={unitPrice}
                      onChange={e => setUnitPrice(parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Qty */}
                <div className="w-1/2 sm:w-20">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cant.</label>
                  <input 
                    type="number" min="1" 
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-center"
                    value={qty}
                    onChange={e => setQty(Number(e.target.value))}
                  />
                </div>
                 {/* Discount */}
                <div className="w-1/2 sm:w-24">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">% Desc.</label>
                  <div className="relative">
                    <input 
                      type="number" min="0" max="100"
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm pr-6"
                      value={itemDiscount}
                      onChange={e => setItemDiscount(Number(e.target.value))}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                </div>
            </div>

            {/* Detail */}
            <div className="w-full xl:flex-grow xl:min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Detalle / Descripción</label>
              <input 
                type="text" 
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
              />
            </div>

            {/* Add Button */}
            <div className="w-full xl:w-auto">
              <button 
                onClick={handleAddItem}
                className="w-full xl:w-auto bg-indigo-700 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-800 shadow-md transition-all flex items-center justify-center gap-2 text-sm font-bold active:scale-95 h-[42px]"
              >
                <Plus size={16} /> <span className="xl:hidden">Agregar Ítem</span><span className="hidden xl:inline">Agregar</span>
              </button>
            </div>
         </div>
         <div className="flex items-center gap-3 mt-2">
           <div className="text-xs text-slate-400 pl-1 flex items-center gap-1">
             <RefreshCw size={10} />
             Conversión auto. al T.C. del sistema.
           </div>
           {conversionInfo && (
             <div className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded animate-pulse-once">
               {conversionInfo}
             </div>
           )}
         </div>
      </div>

      {/* --- SECTION 3: ITEM LIST & COMMENTS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[200px] flex flex-col overflow-hidden">
         {/* Table Header (Hidden on small mobile, shown on md+) */}
         <div className="hidden md:grid grid-cols-12 bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
            <div className="col-span-5">Descripción / Producto</div>
            <div className="col-span-1 text-center">Cant</div>
            <div className="col-span-2 text-right">Precio Unit.</div>
            <div className="col-span-1 text-center">% Desc</div>
            <div className="col-span-2 text-right">Total Línea</div>
            <div className="col-span-1 text-center"></div>
         </div>

         {/* Table Body - Scrollable on mobile */}
         <div className="flex-1 overflow-x-auto">
           {items.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-gray-400">
               <span className="text-sm">No existen registros para mostrar.</span>
             </div>
           ) : (
             <div className="min-w-[600px] md:min-w-0">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-3 text-sm border-b border-gray-100 hover:bg-indigo-50/30 transition-colors items-center group">
                      <div className="col-span-5">
                        <div className="font-semibold text-gray-800">{item.productName}</div>
                        {item.description && item.description !== item.productName && (
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
                        )}
                      </div>
                      <div className="col-span-1 text-center text-gray-700">{item.quantity}</div>
                      <div className="col-span-2 text-right text-gray-700">{getCurrencySymbol()} {item.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="col-span-1 text-center text-gray-500">{item.discount > 0 ? `${item.discount}%` : '-'}</div>
                      <div className="col-span-2 text-right font-bold text-gray-900">{getCurrencySymbol()} {item.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="col-span-1 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
                ))}
             </div>
           )}
         </div>
         
         {/* Comments Area */}
         <div className="p-4 border-t border-gray-200 bg-gray-50/50">
           <label className="block text-xs font-bold text-gray-500 mb-1">Comentarios / Notas Adicionales:</label>
           <textarea 
             rows={2} 
             className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
             placeholder="Instrucciones de entrega, notas de garantía, etc..."
             value={notes}
             onChange={e => setNotes(e.target.value)}
           />
         </div>
      </div>

      {/* --- SECTION 4: FOOTER / TOTALS --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
        
        {/* Left Footer: Payment & Ref */}
        <div className="space-y-6 order-2 xl:order-1">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2 border-b pb-2 border-gray-100">
                <CreditCard size={16} /> Forma de Pago
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tipo Pago</label>
                    <select 
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Sinpe Movil">Sinpe Móvil</option>
                      <option value="Otros">Otros</option>
                      <option value="">No Especificado</option>
                    </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Monto Cancelación</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{getCurrencySymbol()}</span>
                     <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder="0.00" 
                        value={paymentAmount || ''}
                        onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                      />
                   </div>
                 </div>
              </div>
              
              <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">No. Referencia / Orden Compra</label>
                 <input 
                   type="text" 
                   className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" 
                   value={reference}
                   onChange={e => setReference(e.target.value)}
                   placeholder="Ej. OC-5555"
                 />
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3">
             <button 
               onClick={handleSubmit}
               className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all flex justify-center items-center gap-2 active:scale-95"
             >
               <CheckCircle2 size={20} /> PROCESAR FACTURA
             </button>
             <button 
               onClick={() => navigate('/invoices')}
               className="flex-1 bg-white text-gray-700 border border-gray-300 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-all flex justify-center items-center gap-2 active:scale-95"
             >
               <X size={20} /> CANCELAR
             </button>
           </div>
        </div>

        {/* Right Footer: Totals */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner h-fit order-1 xl:order-2">
           <div className="space-y-3">
              {/* Rows */}
              <div className="flex justify-between items-center">
                 <span className="text-sm font-bold text-gray-600">Sub Total</span>
                 <div className="w-32 sm:w-40 bg-white border border-gray-300 rounded px-3 py-1.5 text-right font-mono text-gray-800 text-sm">
                   {getCurrencySymbol()} {subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </div>
              </div>
              
              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-500">IVA ({settings.taxRate}%)</span>
                 <div className="w-32 sm:w-40 bg-white border border-gray-300 rounded px-3 py-1.5 text-right font-mono text-gray-600 text-sm">
                   {getCurrencySymbol()} {tax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </div>
              </div>

              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-500">Exonerado</span>
                 <div className="w-32 sm:w-40 bg-gray-100 border border-gray-200 rounded px-3 py-1.5 text-right font-mono text-gray-400 text-sm">
                   {getCurrencySymbol()} 0.00
                 </div>
              </div>

              <div className="h-px bg-gray-300 my-2"></div>

              <div className="flex justify-between items-center">
                 <span className="text-xl font-bold text-gray-900">TOTAL</span>
                 <div className="w-32 sm:w-40 bg-indigo-50 border border-indigo-200 rounded px-3 py-2 text-right font-mono font-bold text-xl text-indigo-700">
                   {getCurrencySymbol()} {total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceForm;

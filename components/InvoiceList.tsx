
import React, { useState } from 'react';
import { Invoice, AppSettings, Customer } from '../types';
import { Eye, Printer, FileText, X, CheckCircle, AlertTriangle, Clock, Ban, FileWarning } from 'lucide-react';
import { StorageService } from '../services/storageService';
import InvoicePrint from './InvoicePrint';

interface InvoiceListProps {
  invoices: Invoice[];
  onCancelInvoice: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onCancelInvoice }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [printSettings, setPrintSettings] = useState<AppSettings | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | undefined>(undefined);
  
  // Helper to get status styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-600 border-red-200 font-bold';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
     switch (status) {
      case 'paid': return 'Pagada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'ANULADA';
      default: return status;
    }
  }

  const getHaciendaStatusBadge = (status?: string) => {
    switch (status) {
      case 'aceptado': 
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100 w-fit">
            <CheckCircle size={12} /> ACEPTADA
          </span>
        );
      case 'rechazado': 
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-100 w-fit">
            <X size={12} /> RECHAZADA
          </span>
        );
      case 'procesando': 
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 w-fit">
            <Clock size={12} /> PROCESANDO
          </span>
        );
      case 'anulado': 
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100 w-fit">
            <FileWarning size={12} /> ANULADA
          </span>
        );
      default:
         return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200 w-fit">
            NO ENVIADA
          </span>
        );
    }
  }

  const getCurrencySymbol = (inv: Invoice) => {
    if (inv.currency === 'CRC') return '₡';
    if (inv.currency === 'USD') return '$';
    return '₡';
  };

  const handlePrint = async (invoice: Invoice) => {
    // Fetch data needed for printing if not already available in context
    const settings = await StorageService.getSettings();
    const customers = await StorageService.getCustomers();
    const customer = customers.find(c => c.id === invoice.customerId);

    setPrintSettings(settings);
    setPrintCustomer(customer);
    setSelectedInvoice(invoice);
    
    // Small timeout to allow render then print
    setTimeout(() => {
        window.print();
    }, 100);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Historial de Facturas</h2>
        <p className="text-gray-500 mt-1">Registro completo de movimientos electrónicos</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px] md:min-w-0">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Número / Hacienda</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha Emisión</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Estado Pago</th>
                  <th className="px-6 py-4 text-center rounded-tr-2xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 opacity-60">
                          <FileText size={48} strokeWidth={1} />
                          <p className="mt-2 font-medium">No hay facturas registradas</p>
                        </div>
                     </td>
                   </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className={`transition-colors group ${inv.status === 'cancelled' ? 'bg-gray-50 opacity-75' : 'hover:bg-indigo-50/40'}`}>
                      <td className="px-6 py-4">
                         <div className={`font-mono font-medium ${inv.status === 'cancelled' ? 'text-gray-500 line-through decoration-red-400' : 'text-indigo-600'}`}>{inv.number}</div>
                         <div className="mt-1">
                            {getHaciendaStatusBadge(inv.haciendaStatus)}
                         </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.customerName}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className={`px-6 py-4 text-right font-bold ${inv.status === 'cancelled' ? 'text-gray-400 line-through decoration-red-400' : 'text-gray-900'}`}>{getCurrencySymbol(inv)} {inv.total.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(inv.status)}`}>
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handlePrint(inv)}
                            className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" 
                            title="Imprimir"
                          >
                            <Printer size={18} />
                          </button>
                          
                          {inv.status !== 'cancelled' && (
                            <button 
                              onClick={() => onCancelInvoice(inv)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" 
                              title="Anular Factura (Devolver Stock)"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hidden Print Modal / Area - Only visible when printing */}
      {selectedInvoice && printSettings && (
        <div className="fixed inset-0 z-[9999] bg-white flex justify-center items-start overflow-auto p-0 md:p-10 print:p-0 print:block hidden md:flex">
           {/* Close button for the preview mode (hidden when printing) */}
           <button 
             onClick={() => setSelectedInvoice(null)} 
             className="fixed top-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg no-print z-50 hover:bg-gray-700"
           >
             <X size={20} />
           </button>
           
           {/* Container for screen preview, print area overrides this */}
           <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] print:shadow-none print:w-full print:h-auto">
             <InvoicePrint invoice={selectedInvoice} settings={printSettings} customer={printCustomer} />
           </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;

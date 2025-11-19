
import React, { useState } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Search, DollarSign, Calendar, Tag, Briefcase, Receipt } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialFormState: Partial<Expense> = {
    date: new Date().toISOString().split('T')[0],
    provider: '',
    category: 'Inventario',
    description: '',
    amount: 0,
    currency: 'CRC',
    reference: ''
  };

  const [formData, setFormData] = useState<Partial<Expense>>(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense = {
      id: crypto.randomUUID(),
      ...formData
    } as Expense;
    
    onAddExpense(newExpense);
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const filteredExpenses = expenses.filter(e => 
    e.provider.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryColors: Record<string, string> = {
    'Inventario': 'bg-blue-100 text-blue-700 border-blue-200',
    'Servicios': 'bg-green-100 text-green-700 border-green-200',
    'Salarios': 'bg-purple-100 text-purple-700 border-purple-200',
    'Alquiler': 'bg-orange-100 text-orange-700 border-orange-200',
    'Impuestos': 'bg-red-100 text-red-700 border-red-200',
    'Otros': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Control de Gastos</h2>
          <p className="text-gray-500 mt-1">Registro de compras, pagos y egresos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95"
        >
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Gastos (Mostrados)</p>
            <h3 className="text-3xl font-bold text-gray-900">₡ {totalExpenses.toLocaleString()}</h3>
         </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Buscar por proveedor o descripción..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Fecha / Ref</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                     <div className="flex flex-col items-center">
                       <Receipt size={48} className="mb-2 opacity-20" />
                       No hay gastos registrados.
                     </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{new Date(expense.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{expense.reference || 'Sin Ref.'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{expense.provider}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryColors[expense.category] || categoryColors['Otros']}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                       {expense.currency === 'USD' ? '$' : '₡'} {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onDeleteExpense(expense.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="text-xl font-bold text-gray-900">Registrar Nuevo Gasto</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Trash2 className="rotate-45" size={24}/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Calendar size={14}/> Fecha</label>
                       <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Tag size={14}/> Referencia</label>
                       <input type="text" placeholder="# Factura" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Briefcase size={14}/> Proveedor</label>
                    <input required type="text" placeholder="Nombre del proveedor" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-gray-700">Categoría</label>
                       <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white">
                          <option value="Inventario">Inventario</option>
                          <option value="Servicios">Servicios</option>
                          <option value="Salarios">Salarios</option>
                          <option value="Alquiler">Alquiler</option>
                          <option value="Impuestos">Impuestos</option>
                          <option value="Otros">Otros</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><DollarSign size={14}/> Monto</label>
                       <div className="relative">
                          <select 
                             className="absolute left-0 top-0 bottom-0 w-16 pl-2 bg-gray-50 border-r border-gray-200 rounded-l-lg text-xs font-bold outline-none"
                             value={formData.currency}
                             onChange={e => setFormData({...formData, currency: e.target.value})}
                          >
                             <option value="CRC">CRC</option>
                             <option value="USD">USD</option>
                          </select>
                          <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full pl-20 px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Descripción Detallada</label>
                    <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-lg shadow-red-200">Guardar Gasto</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
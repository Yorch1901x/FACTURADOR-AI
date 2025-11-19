
import React, { useState, useMemo } from 'react';
import { Invoice, Expense, Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Activity, FileBarChart } from 'lucide-react';

interface ReportsProps {
  invoices: Invoice[];
  expenses: Expense[];
  products: Product[];
}

const Reports: React.FC<ReportsProps> = ({ invoices, expenses, products }) => {
  const [dateRange, setDateRange] = useState('month'); // 'month', 'year', 'all'

  // --- Helper Functions ---
  const filterByDate = (items: any[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return items.filter(item => {
      if (item.status === 'cancelled') return false; // Ignore cancelled
      const itemDate = new Date(item.date);
      if (dateRange === 'month') return itemDate >= startOfMonth;
      if (dateRange === 'year') return itemDate >= startOfYear;
      return true;
    });
  };

  // --- Data Processing ---
  const filteredInvoices = useMemo(() => filterByDate(invoices), [invoices, dateRange]);
  const filteredExpenses = useMemo(() => filterByDate(expenses), [expenses, dateRange]);

  const totalSales = filteredInvoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0); // Assumes simplified single currency for demo
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  // Chart Data: Sales vs Expenses
  const comparisonData = [
    { name: 'Ingresos', amount: totalSales, fill: '#4f46e5' },
    { name: 'Gastos', amount: totalExpenses, fill: '#ef4444' },
  ];

  // Top Products Logic
  const productSales = useMemo(() => {
    const salesMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
      });
    });
    
    return Object.entries(salesMap)
      .map(([id, qty]) => {
        const prod = products.find(p => p.id === id);
        return { name: prod?.name || 'Desconocido', qty };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredInvoices, products]);

  // Expenses by Category
  const expenseCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reportes Financieros</h2>
          <p className="text-gray-500 mt-1">Análisis detallado del rendimiento del negocio</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
           <button onClick={() => setDateRange('month')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === 'month' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>Este Mes</button>
           <button onClick={() => setDateRange('year')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === 'year' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>Este Año</button>
           <button onClick={() => setDateRange('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>Todo</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={64} className="text-indigo-600"/></div>
            <p className="text-sm font-bold text-indigo-500 uppercase tracking-wide mb-2">Ventas Totales</p>
            <h3 className="text-3xl font-bold text-gray-900">₡ {totalSales.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Calendar size={12}/> {filteredInvoices.length} facturas emitidas</p>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={64} className="text-red-600"/></div>
            <p className="text-sm font-bold text-red-500 uppercase tracking-wide mb-2">Gastos Totales</p>
            <h3 className="text-3xl font-bold text-gray-900">₡ {totalExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Activity size={12}/> {filteredExpenses.length} movimientos registrados</p>
         </div>

         <div className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden group ${netProfit >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
            <div className={`absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform`}>
                <DollarSign size={64} className={netProfit >= 0 ? "text-emerald-600" : "text-red-600"}/>
            </div>
            <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Utilidad Neta
            </p>
            <h3 className={`text-3xl font-bold ${netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                ₡ {netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </h3>
            <p className={`text-xs font-bold mt-2 px-2 py-0.5 rounded w-fit ${profitMargin > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
               Margen: {profitMargin.toFixed(1)}%
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart: Income vs Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Flujo de Caja</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} width={80}/>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(value: number) => `₡ ${value.toLocaleString()}`} />
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={40}>
                            {comparisonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Chart: Expense Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
             <h3 className="text-lg font-bold text-gray-800 mb-2">Distribución de Gastos</h3>
             <div className="flex-1 min-h-[300px]">
                 {expenseCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseCategories}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {expenseCategories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `₡ ${value.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">Sin datos de gastos</div>
                 )}
             </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
             <h3 className="text-lg font-bold text-gray-800">Productos Más Vendidos</h3>
             <FileBarChart size={20} className="text-indigo-500"/>
          </div>
          <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                      <th className="px-6 py-3 font-semibold">Producto</th>
                      <th className="px-6 py-3 font-semibold text-right">Unidades Vendidas</th>
                      <th className="px-6 py-3 font-semibold text-right">Participación</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {productSales.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-medium text-gray-700">
                              <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                  </span>
                                  {item.name}
                              </div>
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-gray-900">{item.qty}</td>
                          <td className="px-6 py-3 text-right">
                             <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 max-w-[100px] ml-auto">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${(item.qty / productSales[0].qty) * 100}%`}}></div>
                             </div>
                          </td>
                      </tr>
                  ))}
                  {productSales.length === 0 && (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-400">No hay datos de ventas</td></tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Reports;
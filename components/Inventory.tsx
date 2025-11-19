
import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Edit2, Trash2, Search, Sparkles, X, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', price: 0, cost: 0, currency: 'CRC', stock: 0, category: '', description: ''
  });
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', price: 0, cost: 0, currency: 'CRC', stock: 0, category: 'General', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) return;
    setGeneratingDesc(true);
    const desc = await GeminiService.generateProductDescription(formData.name, formData.category);
    setFormData(prev => ({ ...prev, description: desc }));
    setGeneratingDesc(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      ...formData
    } as Product;

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMargin = (price: number, cost: number = 0) => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Inventario</h2>
          <p className="text-gray-500 mt-1">Gestiona tus productos, costos y existencias</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 flex justify-center items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px] md:min-w-0">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">SKU / Categoría</th>
                  <th className="px-6 py-4 text-right">Costo</th>
                  <th className="px-6 py-4 text-right">Precio Venta</th>
                  <th className="px-6 py-4 text-right">Margen</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Package size={48} className="mb-3 opacity-20" />
                        <p className="font-medium">No se encontraron productos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const margin = calculateMargin(product.price, product.cost);
                    return (
                      <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{product.description || 'Sin descripción'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700 font-mono text-xs">{product.sku}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium uppercase tracking-wide">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                           <span className="text-xs mr-1">{product.currency === 'USD' ? '$' : '₡'}</span>
                           {(product.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          <span className="text-xs text-gray-500 mr-1">{product.currency === 'USD' ? '$' : '₡'}</span>
                          {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${margin > 30 ? 'bg-green-100 text-green-700' : margin > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                             {margin.toFixed(0)}%
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${product.stock < 5 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                            {product.stock < 5 && <AlertTriangle size={10} />}
                            {product.stock}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors" title="Editar">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => onDeleteProduct(product.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors" title="Eliminar">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in transform transition-all my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Complete la información del inventario y costos</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Nombre del Producto</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Ej. Laptop Pro" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">SKU (Código)</label>
                  <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Ej. LP-001" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Categoría</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Ej. Electrónica" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Moneda</label>
                    <select 
                      value={formData.currency || 'CRC'} 
                      onChange={e => setFormData({...formData, currency: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="CRC">Colones (₡)</option>
                      <option value="USD">Dólares ($)</option>
                    </select>
                   </div>
                   <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                   </div>
                </div>
                
                {/* Price and Cost Section */}
                <div className="md:col-span-2 grid grid-cols-2 gap-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                           Costo (Adquisición)
                        </label>
                        <div className="relative">
                           <input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} className="w-full pl-3 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none transition-all text-gray-700" placeholder="0.00" />
                        </div>
                        <p className="text-[10px] text-gray-400">Se usará para generar gastos automáticos.</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-indigo-700 flex items-center gap-1">
                           <TrendingUp size={14} /> Precio Venta
                        </label>
                        <div className="relative">
                           <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full pl-3 px-4 py-2.5 border border-indigo-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-900" placeholder="0.00" />
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Descripción</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateDescription}
                    disabled={generatingDesc || !formData.name}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                  >
                    <Sparkles size={12} /> {generatingDesc ? 'Generando...' : 'Mejorar con IA'}
                  </button>
                </div>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Breve descripción del producto..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium shadow-lg shadow-slate-200 transition-all">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

import React, { useState } from 'react';
import { Customer } from '../types';
import { Plus, Mail, Phone, MapPin, X, User, Building2, Globe, FileText, Search, Loader2, Wand2 } from 'lucide-react';
import { HaciendaService } from '../services/haciendaService';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (c: Customer) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingId, setIsSearchingId] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', 
    commercialName: '',
    email: '', 
    identificationType: '01 Cédula Física',
    taxId: '', 
    taxRegime: 'Tradicional',
    economicActivity: '',
    country: 'Costa Rica',
    province: '',
    canton: '',
    district: '',
    zipCode: '',
    address: '', 
    phone: ''
  });

  const handleSearchTaxpayer = async () => {
    if (!formData.taxId) return;
    
    setIsSearchingId(true);
    try {
      const info = await HaciendaService.getTaxpayerInfo(formData.taxId);
      setFormData(prev => ({
        ...prev,
        name: info.nombre,
        identificationType: info.tipoIdentificacion,
        economicActivity: info.actividadEconomica,
        taxRegime: info.regimen
      }));
    } catch (error) {
      alert("No se pudo obtener la información. Verifique la cédula o intente manualmente.");
    } finally {
      setIsSearchingId(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer = { id: crypto.randomUUID(), ...formData } as Customer;
    onAddCustomer(newCustomer);
    setIsModalOpen(false);
    // Reset form
    setFormData({ 
      name: '', commercialName: '', email: '', identificationType: '01 Cédula Física', 
      taxId: '', taxRegime: 'Tradicional', economicActivity: '', country: 'Costa Rica', province: '', 
      canton: '', district: '', zipCode: '', address: '', phone: '' 
    });
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.taxId || '').includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-500 mt-1">Directorio para Facturación Electrónica</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
         <input 
            type="text" 
            placeholder="Buscar por nombre o cédula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map(c => (
          <div key={c.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 w-full"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner">
                  {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="text-right">
                  <div className="bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 inline-block mb-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wide">
                       {(c.identificationType || '01').split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 flex items-center justify-end gap-1">
                     <Building2 size={10} />
                     {c.taxId}
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-0 group-hover:text-indigo-600 transition-colors line-clamp-1">{c.name}</h3>
              {c.commercialName && <p className="text-sm text-gray-500 mb-1 line-clamp-1">{c.commercialName}</p>}
              
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-50 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-50 rounded-full text-gray-400"><Mail size={14} /></div> 
                  <span className="truncate">{c.email}</span>
                </div>
                {c.economicActivity && (
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-50 rounded-full text-gray-400"><FileText size={14} /></div> 
                    <span className="text-xs line-clamp-1" title={c.economicActivity}>{c.economicActivity}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-50 rounded-full text-gray-400 mt-0.5"><MapPin size={14} /></div> 
                  <span className="text-xs leading-relaxed line-clamp-2">
                    {c.province || ''} {c.canton ? `, ${c.canton}` : ''} {c.address ? ` - ${c.address}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Completo para Factura Electrónica */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in my-8 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Datos del Cliente</h3>
                <p className="text-sm text-gray-500">Información requerida para Factura Electrónica</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-2 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto p-8">
            <form id="customerForm" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Identificación */}
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} /> Identificación Fiscal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Número de Identificación (Cédula)</label>
                    <div className="relative flex gap-2">
                      <input 
                        required 
                        value={formData.taxId} 
                        onChange={e => setFormData({...formData, taxId: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                        placeholder="Ej. 101110222 (Sin guiones)" 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchTaxpayer())}
                      />
                      <button 
                        type="button"
                        onClick={handleSearchTaxpayer}
                        disabled={isSearchingId || !formData.taxId}
                        className="px-4 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Buscar en Hacienda"
                      >
                        {isSearchingId ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 pl-1">Presione la lupa para autocompletar nombre y actividad.</p>
                  </div>
                  
                   <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Tipo</label>
                    <select 
                      required 
                      value={formData.identificationType} 
                      onChange={e => setFormData({...formData, identificationType: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="01 Cédula Física">01 Cédula Física</option>
                      <option value="02 Cédula Jurídica">02 Cédula Jurídica</option>
                      <option value="03 DIMEX">03 DIMEX</option>
                      <option value="04 NITE">04 NITE</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Razón Social (Nombre Legal)</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Nombre completo registrado en Hacienda" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Nombre Comercial</label>
                    <input value={formData.commercialName} onChange={e => setFormData({...formData, commercialName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Opcional" />
                  </div>
                   <div className="space-y-1.5 md:col-span-3">
                    <label className="text-sm font-semibold text-gray-700">Actividad Económica</label>
                    <input 
                      value={formData.economicActivity} 
                      onChange={e => setFormData({...formData, economicActivity: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50" 
                      placeholder="Código y Descripción (Se llena automático)" 
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* Ubicación */}
              <div>
                 <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin size={16} /> Dirección Fiscal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">País</label>
                      <input required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Provincia</label>
                      <input required value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. San José" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Cantón</label>
                      <input required value={formData.canton} onChange={e => setFormData({...formData, canton: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. Central" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Distrito</label>
                      <input required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Ej. Pavas" />
                   </div>
                   <div className="md:col-span-2 space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Otras Señas / Dirección Exacta</label>
                      <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Barrio, Calle, Número..." />
                   </div>
                </div>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* Contacto */}
              <div>
                 <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Mail size={16} /> Datos de Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Email para Factura</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="facturacion@cliente.com" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Teléfono</label>
                      <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="+506 ..." />
                   </div>
                </div>
              </div>
              </form>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" form="customerForm" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all">Guardar Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

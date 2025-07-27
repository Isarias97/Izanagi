import React, { useState, useContext, useMemo, useCallback } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Select, Icon } from '../components/ui';
import { Product } from '../types';
import { DEFAULT_ICON } from '../constants';
import Modal from '../components/Modal';

// Tipos explícitos para edición/eliminación de categorías
interface CategoryEdit { id: number; name: string; icon: string; }
interface CategoryDelete { id: number; name: string; }

type InventoryTab = 'products' | 'categories';

// Constantes fuera del componente para evitar recreación
const productTableHeaders: {key: keyof Product | 'categoryName', label: string}[] = [
  {key: 'sku', label: 'SKU'},
  {key: 'name', label: 'Producto'},
  {key: 'categoryName', label: 'Categoría'},
  {key: 'costPrice', label: 'Costo (CUP)'},
  {key: 'price', label: 'Venta (CUP)'},
  {key: 'stock', label: 'Stock'},
];

const getStockStatus = (stock: number) => {
  if (stock === 0) return { text: 'Agotado', color: 'text-danger' };
  if (stock <= 10) return { text: 'Bajo', color: 'text-warning' };
  if (stock <= 25) return { text: 'Medio', color: 'text-yellow-400' };
  return { text: 'Alto', color: 'text-green-400' };
};

// Componente para una fila de producto
const ProductRow: React.FC<{ product: Product; categoryName: string; categoryIcon: string; onDelete: (p: Product) => void; }> = React.memo(({ product, categoryName, categoryIcon, onDelete }) => {
  const stockStatus = getStockStatus(product.stock);
  return (
    <tr className="border-b border-slate-700 bg-slate-900/30 active:scale-95 touch-manipulation no-hover space-y-2">
      <td className="px-6 py-4">{product.sku}</td>
      <td className="px-6 py-4 font-semibold flex items-center gap-3">
        <span className="text-2xl md:text-3xl">{categoryIcon || DEFAULT_ICON}</span> {product.name}
      </td>
      <td className="px-6 py-4">{categoryName || 'N/A'}</td>
      <td className="px-6 py-4">${product.costPrice.toFixed(2)}</td>
      <td className="px-6 py-4 font-bold text-accent">${product.price.toFixed(2)}</td>
      <td className="px-6 py-4">{product.stock}</td>
      <td className={`px-6 py-4 font-bold ${stockStatus.color}`}>{stockStatus.text}</td>
      <td className="px-6 py-4">
        <div className="flex gap-2 justify-end">
          <Button variant="icon" className="bg-danger/30 hover:bg-danger/60 w-10 h-10 min-w-[44px] min-h-[44px] active:scale-95 touch-manipulation no-hover" onClick={() => onDelete(product)} aria-label="Eliminar producto"><Icon name="fa-trash"/></Button>
        </div>
      </td>
    </tr>
  );
});

// Componente para tarjeta de categoría
const CategoryCard: React.FC<{ category: { id: number; name: string; icon: string }; productCount: number; onEdit: (cat: CategoryEdit) => void; onDelete: (cat: CategoryDelete) => void; }> = React.memo(({ category, productCount, onEdit, onDelete }) => (
  <div className="bg-slate-800/60 rounded-lg p-3 flex justify-between items-center border border-slate-700 hover:shadow-lg transition group">
    <div className="flex items-center gap-3">
      <span className="text-2xl bg-slate-900/60 rounded-lg px-3 py-1 border border-slate-700 group-hover:border-accent transition">{category.icon || DEFAULT_ICON}</span>
      <div>
        <p className="font-semibold text-lg text-white group-hover:text-accent transition">{category.name}</p>
        <small className="text-gray-400">{productCount} productos</small>
      </div>
    </div>
    <div className="flex gap-2">
      <Button variant="icon" icon="fa-edit" title="Editar" aria-label="Editar categoría" onClick={() => onEdit(category)} className="hover:bg-accent/30" />
      <Button variant="icon" icon="fa-trash" title="Eliminar" aria-label="Eliminar categoría" onClick={() => onDelete(category)} className="hover:bg-danger/30" />
    </div>
  </div>
));

const InventoryPage: React.FC = () => {
  const { state, setState, showNotification } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<InventoryTab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState<{ key: keyof Product | 'categoryName', order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(DEFAULT_ICON);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryEdit | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDelete | null>(null);

  // Memoizar handlers
  const handleDeleteAttempt = useCallback((product: Product) => {
    if (product.stock > 0) {
      showNotification('Aviso', 'No se recomienda eliminar productos con stock. Considere poner el stock en 0.', true);
    }
  }, [showNotification]);

  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim()) {
      showNotification('Error', 'El nombre de la categoría no puede estar vacío.', true);
      return;
    }
    if (state.categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showNotification('Error', 'Ya existe una categoría con ese nombre.', true);
      return;
    }
    const newId = state.categories.length > 0 ? Math.max(...state.categories.map(c => c.id)) + 1 : 1;
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { id: newId, name: newCategoryName.trim(), icon: newCategoryIcon }]
    }));
    showNotification('Éxito', `Categoría "${newCategoryName.trim()}" agregada.`);
    setIsAddCategoryModalOpen(false);
    setNewCategoryName('');
    setNewCategoryIcon(DEFAULT_ICON);
  }, [newCategoryName, newCategoryIcon, setState, showNotification, state.categories]);

  const handleOpenEditCategory = useCallback((cat: CategoryEdit) => {
    setEditingCategory(cat);
    setIsEditCategoryModalOpen(true);
  }, []);

  const handleEditCategory = useCallback(() => {
    if (!editingCategory || !editingCategory.name.trim()) {
      showNotification('Error', 'El nombre de la categoría no puede estar vacío.', true);
      return;
    }
    if (state.categories.some(c => c.id !== editingCategory.id && c.name.toLowerCase() === editingCategory.name.trim().toLowerCase())) {
      showNotification('Error', 'Ya existe una categoría con ese nombre.', true);
      return;
    }
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === editingCategory.id ? { ...c, name: editingCategory.name.trim(), icon: editingCategory.icon } : c)
    }));
    showNotification('Éxito', `Categoría "${editingCategory.name.trim()}" actualizada.`);
    setIsEditCategoryModalOpen(false);
    setEditingCategory(null);
  }, [editingCategory, setState, showNotification, state.categories]);

  const handleOpenDeleteCategory = useCallback((cat: CategoryDelete) => {
    setDeletingCategory(cat);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteCategory = useCallback(() => {
    if (!deletingCategory) return;
    if (state.products.some(p => p.categoryId === deletingCategory.id)) {
      showNotification('Error', 'No se puede eliminar una categoría con productos asociados.', true);
      setIsDeleteConfirmOpen(false);
      setDeletingCategory(null);
      return;
    }
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== deletingCategory.id)
    }));
    showNotification('Éxito', `Categoría "${deletingCategory.name}" eliminada.`);
    setIsDeleteConfirmOpen(false);
    setDeletingCategory(null);
  }, [deletingCategory, setState, showNotification, state.products]);

  const filteredProducts = useMemo(() => {
    let products = [...state.products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    }
    if (categoryFilter) {
      products = products.filter(p => p.categoryId === Number(categoryFilter));
    }
    products.sort((a, b) => {
      const key = sort.key;
      let valA: string | number, valB: string | number;
      if (key === 'categoryName') {
        valA = state.categories.find(c => c.id === a.categoryId)?.name || '';
        valB = state.categories.find(c => c.id === b.categoryId)?.name || '';
      } else {
        valA = a[key as keyof Product];
        valB = b[key as keyof Product];
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sort.order === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return products;
  }, [state.products, state.categories, searchTerm, categoryFilter, sort]);

  const itemsPerPage = state.config.inventory.itemsPerPage;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = useCallback((key: keyof Product | 'categoryName') => {
    setSort(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);
  
  return (
    <Card>
      <CardHeader icon="fa-boxes">Gestión de Inventario</CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover
              ${activeTab === 'products' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}
            `}
            style={{ outline: activeTab === 'products' ? '2px solid #fff' : undefined }}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover
              ${activeTab === 'categories' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}
            `}
            style={{ outline: activeTab === 'categories' ? '2px solid #fff' : undefined }}
          >
            Categorías
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup label="Buscar Producto">
                      <Input placeholder="Buscar por SKU o nombre..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="py-3" />
                  </InputGroup>
                  <InputGroup label="Filtrar por Categoría">
                      <Select value={categoryFilter} onChange={e => {setCategoryFilter(e.target.value); setCurrentPage(1);}} className="py-3">
                          <option value="">Todas</option>
                          {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                  </InputGroup>
                </div>
                <div title="Los productos ahora se agregan desde la página de Compras.">
                    <Button icon="fa-plus" disabled={true} className="min-h-[44px] px-5 py-3">Agregar Producto</Button>
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-700 no-scrollbar">
                <table className="w-full text-sm text-left text-gray-300 min-w-[900px] divide-y divide-slate-700">
                    <thead className="text-xs text-gray-300 uppercase bg-secondary">
                        <tr>
                            {productTableHeaders.map(h => (
                               <th key={h.key} scope="col" className="px-6 py-3 cursor-pointer hover:bg-accent/50" onClick={() => handleSort(h.key)}>
                                   <div className="flex items-center">
                                    {h.label}
                                    {sort.key === h.key && <Icon name={sort.order === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} className="ml-2" />}
                                   </div>
                               </th> 
                            ))}
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.length === 0 ? (
                            <tr>
                                <td colSpan={productTableHeaders.length + 2} className="text-center p-8 text-gray-500">
                                    {state.products.length === 0 
                                        ? "Aún no hay productos. Vaya a la página de Compras para agregar su primer producto."
                                        : "No se encontraron productos que coincidan con su búsqueda."}
                                </td>
                            </tr>
                        ) : paginatedProducts.map(p => {
                            const category = state.categories.find(c => c.id === p.categoryId);
                            return (
                                <ProductRow
                                    key={p.id}
                                    product={p}
                                    categoryName={category?.name || 'N/A'}
                                    categoryIcon={category?.icon || DEFAULT_ICON}
                                    onDelete={handleDeleteAttempt}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 text-sm">
                    <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Siguiente</Button>
                </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Categorías Existentes</h3>
                    <Button icon="fa-plus-circle" onClick={() => setIsAddCategoryModalOpen(true)} className="min-h-[44px] px-5 py-3 active:scale-95 touch-manipulation no-hover">
                        Agregar Nueva Categoría
                    </Button>
                </div>

                {state.categories.length === 0 ? (
                    <div className="text-center p-8 bg-slate-900/50 rounded-lg text-gray-500 border border-slate-700">
                        No hay categorías. Agregue una para empezar a organizar sus productos.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {state.categories.map(c => (
                            <CategoryCard
                                key={c.id}
                                category={c}
                                productCount={state.products.filter(p => p.categoryId === c.id).length}
                                onEdit={handleOpenEditCategory}
                                onDelete={handleOpenDeleteCategory}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}
        <Modal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} title="Agregar Nueva Categoría">
            <form onSubmit={e => { e.preventDefault(); handleAddCategory(); }} className="space-y-6">
                <div>
                    <label className="block text-accent font-semibold mb-2">Nombre de la Categoría</label>
                    <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej: Bebidas" required maxLength={30} />
                </div>
                <div>
                    <label className="block text-accent font-semibold mb-2">Icono</label>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" key={DEFAULT_ICON} className={`text-2xl p-2 rounded-lg border-2 ${newCategoryIcon === DEFAULT_ICON ? 'border-accent bg-accent/20' : 'border-slate-700 bg-slate-800/40'} focus:outline-none`} onClick={() => setNewCategoryIcon(DEFAULT_ICON)} aria-label={`Seleccionar icono ${DEFAULT_ICON}`}>{DEFAULT_ICON}</button>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="danger" onClick={() => setIsAddCategoryModalOpen(false)}>Cancelar</Button>
                    <Button type="submit" icon="fa-check">Guardar</Button>
                </div>
            </form>
        </Modal>
        <Modal isOpen={isEditCategoryModalOpen} onClose={() => { setIsEditCategoryModalOpen(false); setEditingCategory(null); }} title="Editar Categoría">
            <form onSubmit={e => { e.preventDefault(); handleEditCategory(); }} className="space-y-6">
                <div>
                    <label className="block text-accent font-semibold mb-2">Nombre de la Categoría</label>
                    <Input value={editingCategory?.name || ''} onChange={e => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)} placeholder="Ej: Bebidas" required maxLength={30} />
                </div>
                <div>
                    <label className="block text-accent font-semibold mb-2">Icono</label>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" key={DEFAULT_ICON} className={`text-2xl p-2 rounded-lg border-2 ${editingCategory?.icon === DEFAULT_ICON ? 'border-accent bg-accent/20' : 'border-slate-700 bg-slate-800/40'} focus:outline-none`} onClick={() => setEditingCategory(editingCategory ? { ...editingCategory, icon: DEFAULT_ICON } : null)} aria-label={`Seleccionar icono ${DEFAULT_ICON}`}>{DEFAULT_ICON}</button>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="danger" onClick={() => { setIsEditCategoryModalOpen(false); setEditingCategory(null); }}>Cancelar</Button>
                    <Button type="submit" icon="fa-check">Guardar Cambios</Button>
                </div>
            </form>
        </Modal>
        <Modal isOpen={isDeleteConfirmOpen} onClose={() => { setIsDeleteConfirmOpen(false); setDeletingCategory(null); }} title="Eliminar Categoría">
            <div className="space-y-6">
                <p className="text-lg text-danger font-semibold">¿Estás seguro de que deseas eliminar la categoría "{deletingCategory?.name}"?</p>
                <p className="text-gray-400 text-sm">Esta acción no se puede deshacer. No puedes eliminar una categoría que tenga productos asociados.</p>
                <div className="flex justify-end gap-2">
                    <Button type="button" onClick={() => { setIsDeleteConfirmOpen(false); setDeletingCategory(null); }}>Cancelar</Button>
                    <Button type="button" variant="danger" icon="fa-trash" onClick={handleDeleteCategory}>Eliminar</Button>
                </div>
            </div>
        </Modal>
      </CardContent>
      <style>{`
        .touch-manipulation { touch-action: manipulation; }
        .no-hover:hover { background: none !important; filter: none !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </Card>
  );
};

export default InventoryPage;
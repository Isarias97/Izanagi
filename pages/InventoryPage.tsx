import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Select, Icon } from '../components/ui';
import { Product, Category } from '../types';
import Modal from '../components/Modal';
import { AVAILABLE_ICONS, DEFAULT_ICON } from '../constants';

type InventoryTab = 'products' | 'categories';

const ProductForm: React.FC<{ product?: Product, onSave: (p: Omit<Product, 'id' | 'sku' | 'sales'>) => void, onDone?: () => void }> = ({ product, onSave, onDone }) => {
    const { state } = useContext(DataContext);
    const [name, setName] = useState(product?.name || '');
    const [categoryId, setCategoryId] = useState(product?.categoryId || (state.categories.length > 0 ? state.categories[0].id : 0));
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '');
    const [stock, setStock] = useState(product?.stock?.toString() || '');
    
    const handleSubmit = () => {
        const parsedPrice = parseFloat(price);
        const parsedCostPrice = parseFloat(costPrice);
        const parsedStock = parseInt(stock, 10);
        
        onSave({ name, categoryId, price: parsedPrice, costPrice: parsedCostPrice, stock: parsedStock });
        
        if (!product) { // Reset if it's a new product form
          setName(''); 
          setCategoryId(state.categories.length > 0 ? state.categories[0].id : 0); 
          setPrice('');
          setCostPrice('');
          setStock('');
        }
        if (onDone) onDone();
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Nombre del Producto" className="md:col-span-2"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Café Premium" /></InputGroup>
                <InputGroup label="Categoría">
                    <Select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}>
                        <option value={0} disabled>Seleccione...</option>
                        {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </InputGroup>
                <InputGroup label={product ? "Stock Actual" : "Stock Inicial"}>
                    <Input 
                        type="number" 
                        value={stock} 
                        onChange={e => setStock(e.target.value)} 
                        placeholder="0" 
                        min="0" 
                        readOnly={!!product}
                    />
                     {product && <p className="text-xs text-gray-400 mt-1">El stock se gestiona desde las páginas de Compras y Ventas.</p>}
                </InputGroup>
                <InputGroup label="Precio de Costo (CUP)"><Input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" /></InputGroup>
                <InputGroup label="Precio de Venta (CUP)"><Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" /></InputGroup>
            </div>
            <div className="flex justify-end">
                <Button icon="fa-save" onClick={handleSubmit}>Guardar Producto</Button>
            </div>
        </div>
    );
};

const CategoryForm: React.FC<{ category?: Category, onSave: (data: { name: string, icon: string }) => void, onDone?: () => void }> = ({ category, onSave, onDone }) => {
    const [name, setName] = useState(category?.name || '');
    const [icon, setIcon] = useState(category?.icon || DEFAULT_ICON);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), icon });
        if (!category) { // Reset form if new
            setName('');
            setIcon(DEFAULT_ICON);
        }
        if(onDone) onDone();
    };

    return (
        <div className="space-y-6">
            <InputGroup label="Nombre de la Categoría">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Lácteos" />
            </InputGroup>
            <InputGroup label="Ícono de la Categoría">
                <div className="p-3 bg-slate-800/50 rounded-lg flex flex-wrap gap-2">
                    {AVAILABLE_ICONS.map(i => (
                        <button key={i} onClick={() => setIcon(i)} className={`w-12 h-12 text-2xl rounded-lg transition-all duration-200 ${icon === i ? 'bg-accent ring-2 ring-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            {i}
                        </button>
                    ))}
                </div>
            </InputGroup>
            <div className="flex justify-end">
                <Button icon="fa-save" onClick={handleSave}>Guardar Categoría</Button>
            </div>
        </div>
    );
};


const InventoryPage: React.FC = () => {
  const { state, setState, showNotification } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<InventoryTab>('products');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState<{ key: keyof Product | 'categoryName', order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const generateSku = (categoryId: number, oldSku: string | null = null): string => {
    const category = state.categories.find(c => c.id === categoryId);
    const prefix = category ? category.name.substring(0, 3).toUpperCase() : 'GEN';

    if (oldSku && oldSku.startsWith(prefix)) return oldSku;

    const productsInNewCategory = state.products.filter(p => p.sku.startsWith(prefix));
    const lastNumber = productsInNewCategory.reduce((max, p) => {
        const numPart = p.sku.split('-')[1];
        return Math.max(max, numPart ? parseInt(numPart, 10) : 0);
    }, 0);
    return `${prefix}-${(lastNumber + 1).toString().padStart(3, '0')}`;
  };

  const handleUpdateProduct = (p: Omit<Product, 'id' | 'sku' | 'sales'>) => {
    if (!editingProduct) return;
    
    if (!p.name || !p.categoryId || isNaN(p.price) || p.price < 0 || isNaN(p.costPrice) || p.costPrice < 0) {
        showNotification('Error', 'Por favor, complete todos los campos correctamente.', true);
        return;
    }

    setState(prev => {
        const updatedProducts = prev.products.map(prod => {
            if (prod.id === editingProduct.id) {
                const updatedSku = prod.categoryId !== p.categoryId ? generateSku(p.categoryId, prod.sku) : prod.sku;
                return { 
                    ...prod, 
                    name: p.name,
                    categoryId: p.categoryId,
                    price: p.price,
                    costPrice: p.costPrice,
                    sku: updatedSku,
                };
            }
            return prod;
        });
        showNotification('Éxito', `Producto ${p.name} actualizado.`);
        return { ...prev, products: updatedProducts };
    });
    setEditingProduct(null);
  };

  const handleDeleteAttempt = (product: Product) => {
    if (product.stock > 0) {
      showNotification('Aviso', 'No se recomienda eliminar productos con stock. Considere poner el stock en 0.', true);
    }
    setDeletingProduct(product);
  };

  const confirmDeleteProduct = () => {
    if (!deletingProduct) return;
    setState(prevState => ({
      ...prevState,
      products: prevState.products.filter(p => p.id !== deletingProduct.id)
    }));
    showNotification('Éxito', `Producto "${deletingProduct.name}" eliminado.`);
    setDeletingProduct(null);
  };

  const handleAddCategory = ({name, icon}: {name: string, icon: string}) => {
    if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Error', 'Ya existe una categoría con ese nombre.', true);
        return;
    }
    setState(prev => {
        const newId = (prev.categories.length > 0 ? Math.max(...prev.categories.map(c => c.id)) : 0) + 1;
        return { ...prev, categories: [...prev.categories, { id: newId, name, icon }]};
    });
    showNotification('Éxito', `Categoría '${name}' agregada.`);
    setIsAddCategoryModalOpen(false);
  };

  const handleUpdateCategory = ({name, icon}: {name: string, icon: string}) => {
      if(!editingCategory) return;
      if (state.categories.some(c => c.id !== editingCategory.id && c.name.toLowerCase() === name.toLowerCase())) {
          showNotification('Error', 'Ese nombre de categoría ya existe.', true);
          return;
      }
      setState(prev => {
          const newCategories = prev.categories.map(c => c.id === editingCategory.id ? {...c, name, icon} : c);
          return {...prev, categories: newCategories};
      });
      showNotification('Éxito', `Categoría actualizada.`);
      setEditingCategory(null);
  };
  
  const handleDeleteCategoryAttempt = (category: Category) => {
      if (state.products.some(p => p.categoryId === category.id)) {
          showNotification('Error', 'No se puede eliminar. Hay productos asignados a esta categoría.', true);
          return;
      }
      setDeletingCategory(category);
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    setState(prev => ({...prev, categories: prev.categories.filter(c => c.id !== deletingCategory.id)}));
    showNotification('Éxito', `Categoría '${deletingCategory.name}' eliminada.`);
    setDeletingCategory(null);
  };

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

  const handleSort = (key: keyof Product | 'categoryName') => {
      setSort(prev => ({
          key,
          order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
      }));
  };
  
  const getStockStatus = (stock: number) => {
      if (stock === 0) return { text: 'Agotado', color: 'text-danger' };
      if (stock <= 10) return { text: 'Bajo', color: 'text-warning' };
      if (stock <= 25) return { text: 'Medio', color: 'text-yellow-400' };
      return { text: 'Alto', color: 'text-green-400' };
  };

  const productTableHeaders: {key: keyof Product | 'categoryName', label: string}[] = [
      {key: 'sku', label: 'SKU'},
      {key: 'name', label: 'Producto'},
      {key: 'categoryName', label: 'Categoría'},
      {key: 'costPrice', label: 'Costo (CUP)'},
      {key: 'price', label: 'Venta (CUP)'},
      {key: 'stock', label: 'Stock'},
  ];

  return (
    <Card>
      <CardHeader icon="fa-boxes">Gestión de Inventario</CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button onClick={() => setActiveTab('products')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'products' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-slate-700'}`}>Productos</button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === 'categories' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-slate-700'}`}>Categorías</button>
        </div>

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup label="Buscar Producto">
                      <Input placeholder="Buscar por SKU o nombre..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                  </InputGroup>
                  <InputGroup label="Filtrar por Categoría">
                      <Select value={categoryFilter} onChange={e => {setCategoryFilter(e.target.value); setCurrentPage(1);}}>
                          <option value="">Todas</option>
                          {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                  </InputGroup>
                </div>
                <div title="Los productos ahora se agregan desde la página de Compras.">
                    <Button icon="fa-plus" disabled={true}>
                    Agregar Producto
                    </Button>
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-sm text-left text-gray-300 min-w-[900px]">
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
                            const stockStatus = getStockStatus(p.stock);
                            return (
                                <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                    <td className="px-6 py-4">{p.sku}</td>
                                    <td className="px-6 py-4 font-semibold flex items-center gap-3"><span className="text-xl">{category?.icon || DEFAULT_ICON}</span> {p.name}</td>
                                    <td className="px-6 py-4">{category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">${p.costPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-bold text-accent">${p.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">{p.stock}</td>
                                    <td className={`px-6 py-4 font-bold ${stockStatus.color}`}>{stockStatus.text}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="icon" onClick={() => setEditingProduct(p)}><Icon name="fa-edit"/></Button>
                                            <Button variant="icon" className="bg-danger/30 hover:bg-danger/60" onClick={() => handleDeleteAttempt(p)}><Icon name="fa-trash"/></Button>
                                        </div>
                                    </td>
                                </tr>
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
                    <Button icon="fa-plus-circle" onClick={() => setIsAddCategoryModalOpen(true)}>
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
                            <div key={c.id} className="bg-slate-800/60 rounded-lg p-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{c.icon || DEFAULT_ICON}</span>
                                    <div>
                                        <p className="font-semibold">{c.name}</p>
                                        <small className="text-gray-400">{state.products.filter(p => p.categoryId === c.id).length} productos</small>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="icon" onClick={() => setEditingCategory(c)}><Icon name="fa-edit"/></Button>
                                    <Button variant="icon" className="bg-danger/30 hover:bg-danger/60" onClick={() => handleDeleteCategoryAttempt(c)}><Icon name="fa-trash"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </CardContent>

       <Modal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} title="Agregar Nuevo Producto">
         <p className="text-gray-400">Los productos ahora se agregan desde la página de Compras para un mejor control del inventario y los costos.</p>
       </Modal>
       <Modal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} title="Agregar Nueva Categoría">
          <CategoryForm onSave={handleAddCategory} onDone={() => setIsAddCategoryModalOpen(false)} />
       </Modal>
       <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Editar Producto">
            {editingProduct && <ProductForm product={editingProduct} onSave={handleUpdateProduct} onDone={() => setEditingProduct(null)}/>}
       </Modal>
       <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title="Editar Categoría">
            {editingCategory && (
              <CategoryForm category={editingCategory} onSave={handleUpdateCategory} onDone={() => setEditingCategory(null)} />
            )}
       </Modal>
       <Modal isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)} title="Confirmar Eliminación">
            {deletingProduct && (
                <div className="space-y-6">
                    <p>
                        ¿Está seguro de que desea eliminar el producto <strong>{deletingProduct.name}</strong>?
                        <br />
                        Esta acción es irreversible.
                    </p>
                    <div className="flex justify-end gap-4">
                        <Button onClick={() => setDeletingProduct(null)}>Cancelar</Button>
                        <Button variant="danger" icon="fa-trash" onClick={confirmDeleteProduct}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            )}
       </Modal>
       <Modal isOpen={!!deletingCategory} onClose={() => setDeletingCategory(null)} title="Confirmar Eliminación de Categoría">
            {deletingCategory && (
                <div className="space-y-6">
                    <p>
                        ¿Está seguro de que desea eliminar la categoría <strong>{deletingCategory.name}</strong>?
                        <br />
                        Esta acción es irreversible.
                    </p>
                    <div className="flex justify-end gap-4">
                        <Button onClick={() => setDeletingCategory(null)}>Cancelar</Button>
                        <Button variant="danger" icon="fa-trash" onClick={confirmDeleteCategory}>
                            Eliminar Categoría
                        </Button>
                    </div>
                </div>
            )}
       </Modal>
    </Card>
  );
};

export default InventoryPage;
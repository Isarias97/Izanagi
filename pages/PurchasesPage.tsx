
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { DataContext } from '../context';
import { Product, TransactionLogEntry, Category } from '../types';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Icon, Select } from '../components/ui';
import { DEFAULT_ICON } from '../constants';

// New interface for the complex cart item
interface PurchaseCartItem {
    id: number;
    isNew: boolean;
    name: string;
    categoryId: number;
    purchaseMode: 'package' | 'unit';
    // Package mode
    packageQuantity: string;
    unitsPerPackage: string;
    packageCost: string;
    // Unit mode
    unitQuantity: string;
    unitCostPrice: string;
    // Selling price
    sellingPrice: string;
}

// --- Calculation and Validation Helper Function ---
const calculatePurchaseItemDetails = (item: PurchaseCartItem) => {
    let totalUnits = 0, unitCost = 0, itemTotalCost = 0, suggestedSellingPrice = 0;
    let hasLowProfit = false, isAllValid = false;
    
    const sellingPrice = Number(item.sellingPrice) || 0;

    if (item.purchaseMode === 'package') {
        const packageQuantity = Number(item.packageQuantity) || 0;
        const unitsPerPackage = Number(item.unitsPerPackage) || 0;
        const packageCost = Number(item.packageCost) || 0;

        totalUnits = packageQuantity * unitsPerPackage;
        unitCost = unitsPerPackage > 0 ? packageCost / unitsPerPackage : 0;
        itemTotalCost = packageQuantity * packageCost;
        
        const isPackageQuantityValid = packageQuantity > 0 && Number.isInteger(packageQuantity);
        const isUnitsPerPackageValid = unitsPerPackage > 0 && Number.isInteger(unitsPerPackage);
        const isPackageCostValid = packageCost > 0;
        const isSellingPriceValid = sellingPrice > 0;
        const isNewProductDataValid = item.isNew ? (item.name.trim().length > 0 && item.categoryId > 0) : true;
        isAllValid = isPackageQuantityValid && isUnitsPerPackageValid && isPackageCostValid && isSellingPriceValid && isNewProductDataValid;

    } else { // 'unit' mode
        const unitQuantity = Number(item.unitQuantity) || 0;
        const unitCostPrice = Number(item.unitCostPrice) || 0;
        
        totalUnits = unitQuantity;
        unitCost = unitCostPrice;
        itemTotalCost = unitQuantity * unitCostPrice;

        const isUnitQuantityValid = unitQuantity > 0 && Number.isInteger(unitQuantity);
        const isUnitCostValid = unitCost > 0;
        const isSellingPriceValid = sellingPrice > 0;
        const isNewProductDataValid = item.isNew ? (item.name.trim().length > 0 && item.categoryId > 0) : true;
        isAllValid = isUnitQuantityValid && isUnitCostValid && isSellingPriceValid && isNewProductDataValid;
    }

    suggestedSellingPrice = unitCost > 0 ? unitCost * 1.3 : 0;
    const profitMargin = unitCost > 0 ? (sellingPrice - unitCost) / unitCost : Infinity;
    hasLowProfit = sellingPrice > 0 && unitCost > 0 && profitMargin < 0.3;

    return { totalUnits, unitCost, itemTotalCost, suggestedSellingPrice, hasLowProfit, isAllValid };
};


// --- Cart Item Component ---
const PurchaseCartItemCard: React.FC<{
    item: PurchaseCartItem;
    onUpdate: (id: number, field: keyof PurchaseCartItem, value: any) => void;
    onRemove: (id: number) => void;
    categories: Category[];
}> = ({ item, onUpdate, onRemove, categories }) => {
    const { totalUnits, unitCost, suggestedSellingPrice, hasLowProfit } = useMemo(() => calculatePurchaseItemDetails(item), [item]);

    const handleApplySuggestion = () => {
        onUpdate(item.id, 'sellingPrice', suggestedSellingPrice.toFixed(2));
    };

    return (
        <li className={`rounded-lg p-4 flex flex-col gap-4 ${item.isNew ? 'bg-green-900/30 border border-green-500' : 'bg-slate-800/60 border border-slate-700'} mb-4`}>
            <div className="flex justify-between items-start">
                <div>
                    {item.isNew ? (
                        <Input value={item.name} onChange={e => onUpdate(item.id, 'name', e.target.value)} placeholder="Nombre del nuevo producto" className="font-semibold" />
                    ) : (
                        <p className="font-semibold text-lg">{item.name}</p>
                    )}
                    {item.isNew && (
                        <Select value={item.categoryId} onChange={e => onUpdate(item.id, 'categoryId', Number(e.target.value))} className="mt-2 text-sm">
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    )}
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex rounded-lg bg-slate-900 p-1">
                        <Button onClick={() => onUpdate(item.id, 'purchaseMode', 'package')} className={`!px-3 !py-1 text-xs ${item.purchaseMode === 'package' ? 'bg-accent' : 'bg-transparent'}`}>Paquete</Button>
                        <Button onClick={() => onUpdate(item.id, 'purchaseMode', 'unit')} className={`!px-3 !py-1 text-xs ${item.purchaseMode === 'unit' ? 'bg-accent' : 'bg-transparent'}`}>Unidad</Button>
                    </div>
                    <Button variant="icon" className="bg-danger/30 hover:bg-danger/60 !w-8 !h-8" onClick={() => onRemove(item.id)}><Icon name="fa-times" /></Button>
                </div>
            </div>
            
            {/* --- INPUTS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {item.purchaseMode === 'package' ? (
                    <>
                        <InputGroup label="Cant. Paquetes"><Input type="number" value={item.packageQuantity} onChange={e => onUpdate(item.id, 'packageQuantity', e.target.value)} placeholder="0" min="1" /></InputGroup>
                        <InputGroup label="Unidades/Paquete"><Input type="number" value={item.unitsPerPackage} onChange={e => onUpdate(item.id, 'unitsPerPackage', e.target.value)} placeholder="0" min="1" /></InputGroup>
                        <InputGroup label="Costo Paquete"><Input type="number" value={item.packageCost} onChange={e => onUpdate(item.id, 'packageCost', e.target.value)} placeholder="0.00" min="0" /></InputGroup>
                    </>
                ) : (
                    <>
                        <InputGroup label="Cant. Unidades"><Input type="number" value={item.unitQuantity} onChange={e => onUpdate(item.id, 'unitQuantity', e.target.value)} placeholder="0" min="1" /></InputGroup>
                        <InputGroup label="Costo Unitario"><Input type="number" value={item.unitCostPrice} onChange={e => onUpdate(item.id, 'unitCostPrice', e.target.value)} placeholder="0.00" min="0" /></InputGroup>
                    </>
                )}
            </div>

            {/* --- CALCULATIONS & SELLING PRICE --- */}
             <div className="bg-slate-900/50 p-3 rounded-lg space-y-3">
                 <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                     <span className="text-gray-400">Total Unidades: <b className="text-white">{totalUnits.toFixed(0)}</b></span>
                     <span className="text-gray-400">Costo/Unidad: <b className="text-white">${unitCost.toFixed(2)}</b></span>
                 </div>
                 <InputGroup label="Precio Venta" className="!mb-0">
                    <div className="flex items-center gap-2">
                        <Input type="number" value={item.sellingPrice} onChange={e => onUpdate(item.id, 'sellingPrice', e.target.value)} placeholder="0.00" min="0" step="0.01" />
                        {suggestedSellingPrice > 0 && (
                            <Button onClick={handleApplySuggestion} className="!py-2 text-xs whitespace-nowrap">
                                Sugerido: ${suggestedSellingPrice.toFixed(2)}
                            </Button>
                        )}
                    </div>
                 </InputGroup>
                 {hasLowProfit && <p className="text-xs text-warning flex items-center gap-1"><Icon name="fa-exclamation-triangle"/> Ganancia baja (&lt;30%)</p>}
             </div>
        </li>
    );
};

// --- Main Page Component ---
const PurchasesPage: React.FC = () => {
    const { state, setState, showNotification } = useContext(DataContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<PurchaseCartItem[]>([]);
    
    // Memoized calculations for the entire cart
    const cartCalculations = useMemo(() => {
        return cart.map(item => ({ item, calcs: calculatePurchaseItemDetails(item) }));
    }, [cart]);

    const totalCost = useMemo(() => {
        return cartCalculations.reduce((sum, { calcs }) => sum + calcs.itemTotalCost, 0);
    }, [cartCalculations]);

    const isCartInvalid = useMemo(() => {
        if (cart.length === 0) return true;
        return cartCalculations.some(({ calcs }) => !calcs.isAllValid);
    }, [cart, cartCalculations]);

    const remainingBalance = state.investmentBalance - totalCost;
    const hasInsufficientFunds = remainingBalance < 0;
    const isPurchaseDisabled = isCartInvalid || hasInsufficientFunds;

    const getDisabledTitle = () => {
        if (isCartInvalid) return "Revise los campos requeridos en el carrito.";
        if (hasInsufficientFunds) return "Saldo insuficiente para esta compra.";
        return "";
    };
    
    const searchResults = useMemo(() => {
        if (searchTerm.length < 1) return [];
        const term = searchTerm.toLowerCase();
        return state.products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    }, [searchTerm, state.products]);

    const handleSelectProduct = (product: Product) => {
        setSearchTerm('');
        if (cart.some(item => item.id === product.id)) {
            showNotification('Aviso', 'Este producto ya está en el carrito de compra.', true);
            return;
        }
        const newCartItem: PurchaseCartItem = {
            id: product.id,
            isNew: false,
            name: product.name,
            categoryId: product.categoryId,
            purchaseMode: 'unit',
            packageQuantity: '1',
            unitsPerPackage: '',
            packageCost: '',
            unitQuantity: '1',
            unitCostPrice: String(product.costPrice),
            sellingPrice: String(product.price),
        };
        setCart(prev => [...prev, newCartItem]);
    };

    const handleCreateNewProduct = () => {
        if (!searchTerm.trim()) {
            showNotification('Error', 'Escriba un nombre para el nuevo producto.', true);
            return;
        }
        if (state.categories.length === 0) {
            showNotification('Error', 'Debe crear al menos una categoría antes de agregar productos.', true);
            return;
        }
        const tempId = - (cart.filter(item => item.id < 0).length + 1);
        const newCartItem: PurchaseCartItem = {
            id: tempId,
            isNew: true,
            name: searchTerm,
            categoryId: state.categories[0].id,
            purchaseMode: 'package',
            packageQuantity: '1',
            unitsPerPackage: '',
            packageCost: '',
            unitQuantity: '1',
            unitCostPrice: '',
            sellingPrice: '',
        };
        setCart(prev => [...prev, newCartItem]);
        setSearchTerm('');
    };

    const handleUpdateCartItem = (itemId: number, field: keyof PurchaseCartItem, value: any) => {
        setCart(prev => prev.map(item => 
            item.id === itemId 
            ? { ...item, [field]: value } 
            : item
        ));
    };
    
    const handleRemoveFromCart = (itemId: number) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const generateSku = (categoryId: number, products: Product[]): string => {
        const category = state.categories.find(c => c.id === categoryId);
        const prefix = category ? category.name.substring(0, 3).toUpperCase() : 'GEN';
        const productsInNewCategory = products.filter(p => p.sku.startsWith(prefix));
        const lastNumber = productsInNewCategory.reduce((max, p) => {
            const numPart = p.sku.split('-')[1];
            return Math.max(max, numPart ? parseInt(numPart, 10) : 0);
        }, 0);
        return `${prefix}-${(lastNumber + 1).toString().padStart(3, '0')}`;
    };

    const finalizePurchase = useCallback(() => {
        if (isPurchaseDisabled) {
            showNotification('Error', getDisabledTitle(), true);
            return;
        }
        
        setState(prev => {
            const newProducts: Product[] = [];
            const updatedProductsMap = new Map<number, Product>();
            let nextProductId = (prev.products.length > 0 ? Math.max(...prev.products.map(p => p.id)) : 0) + 1;
            
            const calculatedCart = cart.map(item => ({ item, calcs: calculatePurchaseItemDetails(item) }));

            for(const { item, calcs } of calculatedCart) {
                if (!calcs.isAllValid) {
                  showNotification('Error', `Datos inválidos para "${item.name}". Revise todos los campos.`, true);
                  return prev; // Abort update
                }
                
                const { totalUnits, unitCost } = calcs;
                const sellingPrice = Number(item.sellingPrice);

                if (item.isNew) {
                    const newProduct: Product = {
                        id: nextProductId,
                        sku: generateSku(item.categoryId, [...prev.products, ...newProducts]),
                        name: item.name,
                        categoryId: item.categoryId,
                        stock: totalUnits,
                        costPrice: unitCost,
                        price: sellingPrice,
                        sales: 0
                    };
                    newProducts.push(newProduct);
                    nextProductId++;
                } else {
                    const existingProduct = prev.products.find(p => p.id === item.id)!;
                    const updatedProduct = {
                        ...existingProduct,
                        stock: existingProduct.stock + totalUnits,
                        costPrice: unitCost,
                        price: sellingPrice,
                    };
                    updatedProductsMap.set(item.id, updatedProduct);
                }
            }

            const finalProducts = prev.products
                .map(p => updatedProductsMap.get(p.id) || p)
                .concat(newProducts);

            const newReportId = (prev.purchases.length > 0 ? Math.max(...prev.purchases.map(p => p.id)) : 0) + 1;
            const newReport = {
                id: newReportId,
                date: new Date().toISOString(),
                items: calculatedCart.map(({ item, calcs }) => ({
                    productId: item.isNew ? (newProducts.find(p => p.name === item.name)?.id || 0) : item.id,
                    name: item.name,
                    quantity: calcs.totalUnits,
                    costPrice: calcs.unitCost,
                    sellingPrice: Number(item.sellingPrice),
                })),
                itemsCount: calculatedCart.reduce((sum, { calcs }) => sum + calcs.totalUnits, 0),
                totalCost,
            };
            
            const newInvestmentBalance = prev.investmentBalance - totalCost;
            
            const nextLogId = (prev.transactionLog.length > 0 ? Math.max(...prev.transactionLog.map(t => t.id)) : 0) + 1;
            const newLogEntry: TransactionLogEntry = {
                id: nextLogId,
                date: newReport.date,
                type: 'PURCHASE',
                description: `Compra de inventario #${newReportId}`,
                amount: -totalCost,
                purchaseId: newReportId,
                investmentBalanceAfter: newInvestmentBalance,
                workerPayoutBalanceAfter: prev.workerPayoutBalance,
            };

            showNotification('Éxito', `Compra #${newReportId} registrada. Saldo actualizado.`);
            return { 
                ...prev, 
                products: finalProducts, 
                purchases: [...prev.purchases, newReport], 
                investmentBalance: newInvestmentBalance,
                transactionLog: [...prev.transactionLog, newLogEntry],
            };
        });

        setCart([]);
        setSearchTerm('');
    }, [cart, totalCost, state.investmentBalance, isPurchaseDisabled, setState, showNotification, state.categories, getDisabledTitle]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader icon="fa-shopping-basket">Registrar Compra</CardHeader>
                    <CardContent>
                        <InputGroup label="Buscar Producto o Escribir Nombre para Crear" className="relative">
                            <div className="flex gap-2">
                                <Input
                                    type="text" placeholder="Buscar producto existente..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)} autoComplete="off"
                                    className="py-3"
                                />
                                {searchTerm && searchResults.length === 0 && (
                                    <Button icon="fa-plus" onClick={handleCreateNewProduct} className="min-h-[44px] px-5 py-3 active:scale-95 touch-manipulation no-hover">Crear</Button>
                                )}
                            </div>
                            {searchResults.length > 0 && searchTerm.length > 0 && (
                                <div className="absolute w-full top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto z-30 shadow-lg">
                                    {searchResults.map(p => (
                                        <div key={p.id} onClick={() => handleSelectProduct(p)} className="suggestion-item p-3 hover:bg-accent cursor-pointer border-b border-slate-700 flex items-center gap-3">
                                            <span className="text-xl">{state.categories.find(c => c.id === p.categoryId)?.icon || DEFAULT_ICON}</span>
                                            <span>{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </InputGroup>
                        
                        <div className="mt-6">
                            <h4 className="flex items-center gap-3 text-lg font-semibold mb-3"><Icon name="fa-dolly-flatbed" /> Carrito de Compra</h4>
                            <div className="bg-slate-900/50 rounded-lg p-2 min-h-[300px] max-h-[50vh] overflow-y-auto no-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500">Agregue productos desde la barra de búsqueda</div>
                                ) : (
                                    <ul className="space-y-4">
                                        {cart.map(item => (
                                            <PurchaseCartItemCard 
                                                key={item.id} 
                                                item={item} 
                                                onUpdate={handleUpdateCartItem}
                                                onRemove={handleRemoveFromCart}
                                                categories={state.categories}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                                <span className="text-xl font-bold">Costo Total:</span>
                                <span className="text-2xl font-bold text-accent">${totalCost.toFixed(2)} CUP</span>
                            </div>
                             <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg transition-colors duration-300 ${hasInsufficientFunds ? 'bg-red-900/30' : 'bg-slate-800'}`}> 
                                <div className='mb-2 sm:mb-0'>
                                    <p className="text-sm text-gray-400">Saldo de Inversión Actual</p>
                                    <p className="text-lg font-semibold">${state.investmentBalance.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 text-left sm:text-right">Saldo Restante Post-Compra</p>
                                    <p className={`text-lg font-bold ${hasInsufficientFunds ? 'text-danger' : 'text-success'}`}> 
                                        ${remainingBalance.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            {hasInsufficientFunds && (
                                <div className="flex items-center justify-center gap-2 text-center text-danger text-sm font-semibold p-3 bg-danger/10 rounded-lg border border-danger/30">
                                    <Icon name="fa-exclamation-triangle" />
                                    <span>El costo de la compra excede su saldo disponible.</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-6" title={getDisabledTitle()}>
                             <Button variant="success" icon="fa-check-circle" className="w-full text-lg min-h-[48px] py-4 active:scale-95 touch-manipulation no-hover" onClick={finalizePurchase} disabled={isPurchaseDisabled}>
                                Finalizar Compra
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader icon="fa-history">Historial de Compras</CardHeader>
                    <CardContent className="max-h-[80vh] overflow-y-auto">
                        {state.purchases.length === 0 ? (
                             <div className="text-center p-8 text-gray-500">No hay compras registradas.</div>
                        ) : (
                            <div className="space-y-4">
                            {[...state.purchases].reverse().map(p => (
                                <div key={p.id} className="bg-slate-800/60 rounded-lg p-4 active:scale-95 touch-manipulation no-hover">
                                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                                        <h4 className="font-bold">Compra #{p.id}</h4>
                                        <span className="text-sm text-gray-400">{new Date(p.date).toLocaleString()}</span>
                                    </div>
                                    <ul className="text-sm space-y-1 mb-2">
                                        {p.items.map(i => (
                                            <li key={`${p.id}-${i.productId}`} className="flex justify-between">
                                                <span>{i.quantity} x {i.name}</span>
                                                <span className="text-gray-400">${i.costPrice.toFixed(2)} c/u</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="text-right font-bold text-accent border-t border-slate-700 pt-2 mt-2">
                                        Total: ${p.totalCost.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PurchasesPage;

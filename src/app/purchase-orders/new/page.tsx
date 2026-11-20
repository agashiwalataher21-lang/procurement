"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, Calculator, UserPlus, X, AlertCircle, Package, Image, ChevronRight, FileText, DollarSign, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GLOBAL_CURRENCIES } from "@/lib/countryRules";
import { CurrencyEngine } from "@/lib/currency";
import { toast } from "sonner";
import ItemContextPanel, { prefetchItemHistory } from "@/components/items/ItemContextPanel";

interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  currency: string;
}

interface Product {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  brand?: string;
  defaultPurchasePrice: number;
  currency: string;
  unitOfMeasurement: string;
  productPicture?: string | null;
}

interface POItem {
  productId: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  productPicture?: string | null;
}

interface NewSupplierForm {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  trn: string;
  currency: string;
  paymentTerms: string;
  bankDetails: string;
  notes: string;
}

interface NewProductForm {
  itemCode: string;
  itemName: string;
  brand: string;
  category: string;
  defaultPurchasePrice: number;
  unitOfMeasurement: string;
  currency: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [currenciesList, setCurrenciesList] = useState(GLOBAL_CURRENCIES);
  const [showCustomCurrencyPO, setShowCustomCurrencyPO] = useState(false);
  const [customCurrencyPO, setCustomCurrencyPO] = useState("");
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [duplicateCheckErrors, setDuplicateCheckErrors] = useState<string[]>([]);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [currentEditingItemIndex, setCurrentEditingItemIndex] = useState<number | null>(null);
  const [activeContextProductId, setActiveContextProductId] = useState<string | null>(null);
  const [activeContextMeta, setActiveContextMeta] = useState<{ itemName?: string; itemCode?: string }>({});

  const [formData, setFormData] = useState({
    supplierId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    currency: "AED",
    exchangeRate: 1.0,
    discountAmount: 0,
    shippingAmount: 0,
    otherExpensesAmount: 0,
    vatRate: 5,
    notes: "",
  });

  const [items, setItems] = useState<POItem[]>([
    { productId: "", itemCode: "", itemName: "", description: "", quantity: 1, unitPrice: 0, discount: 0, total: 0, productPicture: null },
  ]);
  const [itemDensity, setItemDensity] = useState<"Compact" | "Normal" | "Spacious">("Normal");

  const [newSupplierForm, setNewSupplierForm] = useState<NewSupplierForm>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    country: "UAE",
    trn: "",
    currency: "AED",
    paymentTerms: "30 Days",
    bankDetails: "",
    notes: "",
  });

  const [newProductForm, setNewProductForm] = useState<NewProductForm>({
    itemCode: "",
    itemName: "",
    brand: "",
    category: "Spare Parts",
    defaultPurchasePrice: 0,
    unitOfMeasurement: "PCS",
    currency: "AED",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/products"),
      ]);
      const supData = await supRes.json();
      const prodData = await prodRes.json();

      setSuppliers(supData.suppliers || []);
      setProducts(prodData.products || []);

      if (supData.suppliers?.length > 0) {
        setFormData((prev) => ({ ...prev, supplierId: supData.suppliers[0].id }));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load form data");
    }
  };

  // ---- Item context (purchase history) ----
  // Non-modal: selecting a product opens a docked panel without blocking the grid.
  const contextDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openItemContext = useCallback((productId: string, meta?: { itemName?: string; itemCode?: string }) => {
    if (contextDebounceRef.current) clearTimeout(contextDebounceRef.current);
    // debounce 150ms — don't flicker the panel on fast dropdown navigation
    contextDebounceRef.current = setTimeout(() => {
      setActiveContextProductId(productId);
      setActiveContextMeta(meta || {});
      prefetchItemHistory(productId);
    }, 150);
  }, []);
  const closeItemContext = useCallback(() => {
    if (contextDebounceRef.current) clearTimeout(contextDebounceRef.current);
    setActiveContextProductId(null);
  }, []);
  // prefetch neighbours on focus so the click feels instant
  const prefetchOnFocus = useCallback((productId: string) => {
    if (productId) prefetchItemHistory(productId);
  }, []);

  const handleProductSelect = (index: number, productId: string) => {
    if (productId === "__ADD_NEW_PRODUCT__") {
      setCurrentEditingItemIndex(index);
      setShowNewProductModal(true);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newItems = [...items];
    newItems[index] = {
      productId: product.id,
      itemCode: product.itemCode,
      itemName: product.itemName,
      description: product.description || "",
      quantity: newItems[index].quantity || 1,
      unitPrice: product.defaultPurchasePrice || 0,
      discount: newItems[index].discount || 0,
      total: (newItems[index].quantity || 1) * (product.defaultPurchasePrice || 0) - (newItems[index].discount || 0),
      productPicture: product.productPicture || null,
    };
    setItems(newItems);
    prefetchItemHistory(product.id);
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const qty = field === "quantity" ? parseFloat(value) || 0 : item.quantity;
      const price = field === "unitPrice" ? parseFloat(value) || 0 : item.unitPrice;
      item.total = Math.max(0, qty * price);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].description = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { productId: "", itemCode: "", itemName: "", description: "", quantity: 1, unitPrice: 0, discount: 0, total: 0, productPicture: null }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error("Purchase order must have at least one item");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSupplierSelectChange = (value: string) => {
    if (value === "__ADD_NEW_SUPPLIER__") {
      setShowNewSupplierModal(true);
    } else {
      setFormData({ ...formData, supplierId: value });
    }
  };

  const checkForDuplicates = async (): Promise<string[]> => {
    const errors: string[] = [];
    const trimmedName = newSupplierForm.name.trim();
    const trimmedTRN = newSupplierForm.trn.trim();
    const trimmedPhone = newSupplierForm.phone.trim();
    const trimmedEmail = newSupplierForm.email.trim().toLowerCase();

    if (trimmedName && suppliers.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      errors.push(`Supplier name "${trimmedName}" already exists`);
    }

    if (trimmedTRN && suppliers.some((s) => {
      return false;
    })) {
      errors.push(`TRN "${trimmedTRN}" already registered`);
    }

    if (trimmedPhone) {
      const cleanPhone = trimmedPhone.replace(/\D/g, "");
      if (cleanPhone.length > 0) {
      }
    }

    if (trimmedEmail) {
    }

    try {
      const checkRes = await fetch("/api/suppliers/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          trn: trimmedTRN,
          phone: trimmedPhone,
          email: trimmedEmail,
        }),
      });

      const checkData = await checkRes.json();
      if (checkData.duplicates && checkData.duplicates.length > 0) {
        errors.push(...checkData.duplicates);
      }
    } catch (e) {
      console.error("Duplicate check failed:", e);
    }

    return errors;
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierForm.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    if (!newSupplierForm.phone.trim() && !newSupplierForm.email.trim()) {
      toast.error("Either phone or email is required");
      return;
    }

    setCreatingSupplier(true);
    setDuplicateCheckErrors([]);

    const duplicates = await checkForDuplicates();
    if (duplicates.length > 0) {
      setDuplicateCheckErrors(duplicates);
      setCreatingSupplier(false);
      return;
    }

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplierForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create supplier");

      toast.success(`Supplier ${data.supplier.name} created successfully!`);

      const newSupplier: Supplier = {
        id: data.supplier.id,
        supplierId: data.supplier.supplierId,
        name: data.supplier.name,
        currency: data.supplier.currency,
      };
      setSuppliers([...suppliers, newSupplier]);
      setFormData({ ...formData, supplierId: newSupplier.id });

      setShowNewSupplierModal(false);
      setNewSupplierForm({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        country: "UAE",
        trn: "",
        currency: "AED",
        paymentTerms: "30 Days",
        bankDetails: "",
        notes: "",
      });
      setDuplicateCheckErrors([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create supplier");
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleCancelSupplierModal = () => {
    setShowNewSupplierModal(false);
    setNewSupplierForm({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      country: "UAE",
      trn: "",
      currency: "AED",
      paymentTerms: "30 Days",
      bankDetails: "",
      notes: "",
    });
    setDuplicateCheckErrors([]);
  };

  const handleCreateProduct = async () => {
    if (!newProductForm.itemCode.trim()) {
      toast.error("Item code is required");
      return;
    }
    if (!newProductForm.itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (products.some((p) => p.itemCode.toLowerCase() === newProductForm.itemCode.trim().toLowerCase())) {
      toast.error(`Item code "${newProductForm.itemCode}" already exists`);
      return;
    }

    setCreatingProduct(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProductForm,
          currentStock: 0,
          reorderLevel: 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      toast.success(`Product ${data.product.itemName} created successfully!`);

      const newProduct: Product = {
        id: data.product.id,
        itemCode: data.product.itemCode,
        itemName: data.product.itemName,
        brand: data.product.brand,
        defaultPurchasePrice: data.product.defaultPurchasePrice,
        currency: data.product.currency,
        unitOfMeasurement: data.product.unitOfMeasurement,
      };
      setProducts([...products, newProduct]);

      if (currentEditingItemIndex !== null) {
        const newItems = [...items];
        newItems[currentEditingItemIndex] = {
          productId: newProduct.id,
          itemCode: newProduct.itemCode,
          itemName: newProduct.itemName,
          description: newProduct.description || "",
          quantity: newItems[currentEditingItemIndex].quantity || 1,
          unitPrice: newProduct.defaultPurchasePrice || 0,
          discount: newItems[currentEditingItemIndex].discount || 0,
          total: (newItems[currentEditingItemIndex].quantity || 1) * (newProduct.defaultPurchasePrice || 0),
        };
        setItems(newItems);
      }

      setShowNewProductModal(false);
      setCurrentEditingItemIndex(null);
      setNewProductForm({
        itemCode: "",
        itemName: "",
        brand: "",
        category: "Spare Parts",
        defaultPurchasePrice: 0,
        unitOfMeasurement: "PCS",
        currency: "AED",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleCancelProductModal = () => {
    setShowNewProductModal(false);
    setCurrentEditingItemIndex(null);
    setNewProductForm({
      itemCode: "",
      itemName: "",
      brand: "",
      category: "Spare Parts",
      defaultPurchasePrice: 0,
      unitOfMeasurement: "PCS",
      currency: "AED",
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = parseFloat(String(formData.discountAmount)) || 0;
  const shipping = parseFloat(String(formData.shippingAmount)) || 0;
  const otherExp = parseFloat(String(formData.otherExpensesAmount)) || 0;
  const vatRate = parseFloat(String(formData.vatRate)) || 0;
  const principalAmount = Math.max(0, subtotal - discount);
  const vatAmount = (principalAmount * vatRate) / 100;
  const grandTotal = principalAmount + shipping + otherExp + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (items.some((i) => !i.itemCode || i.quantity <= 0)) {
      toast.error("Please ensure all items have a valid product code and quantity");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        items,
        discountAmount: discount,
        shippingAmount: shipping,
        otherExpensesAmount: otherExp,
        vatRate,
      };

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create PO");

      toast.success(`Purchase Order ${data.purchaseOrder.poNumber} created successfully!`);
      router.push(`/purchase-orders/${data.purchaseOrder.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/purchase-orders"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Purchase Order</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Order motorcycle or generator parts from suppliers</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Dates Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Order Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Supplier *
                </label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierSelectChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow appearance-none"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplierId})
                    </option>
                  ))}
                  <option value="__ADD_NEW_SUPPLIER__" className="font-bold text-blue-600">
                    + Add New Supplier
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Order Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Currency
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomCurrencyPO(!showCustomCurrencyPO)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    {showCustomCurrencyPO ? "Cancel" : "+ Add Currency"}
                  </button>
                </div>

                {!showCustomCurrencyPO ? (
                  <select
                    value={formData.currency}
                    onChange={(e) => {
                      if (e.target.value === "__ADD_NEW__") {
                        setShowCustomCurrencyPO(true);
                      } else {
                        const newCurr = e.target.value;
                        const defaultRate = CurrencyEngine.getDefaultRate(newCurr);
                        setFormData({ ...formData, currency: newCurr, exchangeRate: defaultRate });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  >
                    {currenciesList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-blue-600">
                      + Add Custom Currency...
                    </option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={5}
                      value={customCurrencyPO}
                      onChange={(e) => setCustomCurrencyPO(e.target.value.toUpperCase())}
                      placeholder="e.g. INR, MYR"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = customCurrencyPO.trim().toUpperCase();
                        if (!code || code.length < 2 || code.length > 5) {
                          toast.error("Enter a valid currency code");
                          return;
                        }
                        if (!currenciesList.some((c) => c.code === code)) {
                          setCurrenciesList((prev) => [{ code, name: `Custom (${code})`, symbol: code }, ...prev]);
                        }
                        const defaultRate = CurrencyEngine.getDefaultRate(code);
                        setFormData({ ...formData, currency: code, exchangeRate: defaultRate });
                        setCustomCurrencyPO("");
                        setShowCustomCurrencyPO(false);
                        toast.success(`Currency ${code} selected!`);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {formData.currency !== "AED" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Exchange Rate to AED *
                    </label>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      1 {formData.currency} = {formData.exchangeRate} AED
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={formData.exchangeRate}
                      onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1.0 })}
                      placeholder="e.g. 0.0438 for INR, 3.6725 for USD"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rate format: 1 {formData.currency} = X AED (used for central AED financial reporting)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Order Items</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase">Density:</span>
                <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5">
                  {["Compact", "Normal", "Spacious"].map((density) => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => setItemDensity(density as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        itemDensity === density
                          ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 w-16">Image</th>
                  <th className="px-4 py-3 w-2/5">Product / Spare Part</th>
                  <th className="px-4 py-3 w-36 text-center">Qty</th>
                  <th className="px-4 py-3 w-44 text-right">Unit Price ({formData.currency})</th>
                  <th className="px-4 py-3 w-36 text-right">Total ({formData.currency})</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((item, index) => {
                  const cellPadding =
                    itemDensity === "Compact"
                      ? "px-3 py-1.5"
                      : itemDensity === "Spacious"
                      ? "px-6 py-4"
                      : "px-4 py-2.5";
                  const inputPadding =
                    itemDensity === "Compact"
                      ? "px-2 py-1 text-xs"
                      : itemDensity === "Spacious"
                      ? "px-4 py-2.5 text-base"
                      : "px-3 py-2 text-sm";

                  return (
                    <tr key={index} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                      <td className={cellPadding}>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {item.productPicture ? (
                            <img src={item.productPicture} alt={item.itemName} className="w-full h-full object-cover" />
                          ) : (
                            <Image className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto mt-3" />
                          )}
                        </div>
                      </td>
                      <td className={cellPadding}>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            onFocus={(e) => prefetchOnFocus(e.target.value)}
                            className={`flex-1 min-w-0 ${inputPadding} bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow`}
                          >
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.itemName} ({p.brand})
                              </option>
                            ))}
                            <option value="__ADD_NEW_PRODUCT__" className="font-bold text-emerald-600">
                              + Add New Product
                            </option>
                          </select>
                          {item.productId && item.productId !== "__ADD_NEW_PRODUCT__" && (
                            <button
                              type="button"
                              title="View purchase history & pricing"
                              onClick={() => openItemContext(item.productId, { itemName: item.itemName, itemCode: item.itemCode })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-all shadow-xs shrink-0"
                              aria-label={`Purchase history for ${item.itemName || item.itemCode}`}
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>History</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={`${cellPadding} text-center`}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className={`w-full text-center ${inputPadding} bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-shadow`}
                        />
                      </td>
                      <td className={`${cellPadding} text-right`}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          className={`w-full text-right ${inputPadding} bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-shadow`}
                        />
                      </td>
                      <td className={`${cellPadding} text-right font-mono font-bold text-slate-900 dark:text-white`}>
                        {formatCurrency(item.total, formData.currency)}
                      </td>
                      <td className={`${cellPadding} text-center`}>
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Item context — professional popup modal */}
          {activeContextProductId && (
            <ItemContextPanel
              anchor="modal"
              productId={activeContextProductId}
              itemName={activeContextMeta.itemName}
              itemCode={activeContextMeta.itemCode}
              onClose={closeItemContext}
            />
          )}

          {/* Add Item Button Below Table */}
          <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Totals & Additional Charges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Additional Charges Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Additional Charges & Notes</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Discount Amount ({formData.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Shipping ({formData.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingAmount}
                    onChange={(e) => setFormData({ ...formData, shippingAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Other Expenses ({formData.currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.otherExpensesAmount}
                    onChange={(e) => setFormData({ ...formData, otherExpensesAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">VAT Rate</label>
                  <div className="flex gap-2">
                    <select
                      value={[0, 0.5, 1, 2, 3, 5, 15, 25].includes(vatRate) ? String(vatRate) : "custom"}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                    >
                      <option value="0">No VAT (0%)</option>
                      <option value="0.5">0.5%</option>
                      <option value="1">1%</option>
                      <option value="2">2%</option>
                      <option value="3">3%</option>
                      <option value="5">UAE VAT (5%)</option>
                      <option value="15">Standard VAT (15%)</option>
                      <option value="25">25%</option>
                      <option value="custom">Custom</option>
                    </select>
                    {!([0, 0.5, 1, 2, 3, 5, 15, 25].includes(vatRate)) && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                        className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Internal Notes & Instructions</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Delivery instructions, port of entry (Jebel Ali / Dubai), payment terms..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow resize-none"
                />
              </div>
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold">Order Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <span className="text-sm text-slate-300">Item Subtotal</span>
                  <span className="font-mono font-semibold text-lg">{formatCurrency(subtotal, formData.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Discount (from principal)</span>
                  <span className="font-mono text-rose-400">-{formatCurrency(discount, formData.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Principal Amount</span>
                  <span className="font-mono">{formatCurrency(principalAmount, formData.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Shipping & Freight</span>
                  <span className="font-mono">{formatCurrency(shipping, formData.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Other Expenses</span>
                  <span className="font-mono">{formatCurrency(otherExp, formData.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">VAT ({formData.vatRate}%)</span>
                  <span className="font-mono">{formatCurrency(vatAmount, formData.currency)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-200">Grand Total</span>
                <span className="font-mono font-extrabold text-2xl text-amber-400">{formatCurrency(grandTotal, formData.currency)}</span>
              </div>
              {formData.currency !== "AED" && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Base Equivalent:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(grandTotal * formData.exchangeRate, "AED")}
                  </span>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {submitting ? "Creating PO..." : "Save Purchase Order"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Add New Supplier Modal */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Add New Supplier</h2>
                  <p className="text-xs text-blue-100">Create supplier without leaving this form</p>
                </div>
              </div>
              <button
                onClick={handleCancelSupplierModal}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateCheckErrors.length > 0 && (
              <div className="mx-6 mt-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-200 mb-2">Duplicate Detected</p>
                    <ul className="text-xs text-rose-800 dark:text-rose-300 space-y-1">
                      {duplicateCheckErrors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Supplier Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplierForm.name}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                    placeholder="e.g. Honda GCC Spare Parts Trading L.L.C."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newSupplierForm.contactPerson}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactPerson: e.target.value })}
                    placeholder="e.g. Ahmed Al-Sayed"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={newSupplierForm.phone}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                    placeholder="+971-4-1234567"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newSupplierForm.email}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
                    placeholder="sales@supplier.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Country
                  </label>
                  <select
                    value={newSupplierForm.country}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, country: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  >
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="China">China</option>
                    <option value="India">India</option>
                    <option value="Japan">Japan</option>
                    <option value="Germany">Germany</option>
                    <option value="USA">USA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newSupplierForm.address}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                    placeholder="Street address, city, postal code"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Tax Registration Number (TRN)
                  </label>
                  <input
                    type="text"
                    value={newSupplierForm.trn}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, trn: e.target.value })}
                    placeholder="123456789012345"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Currency
                  </label>
                  <select
                    value={newSupplierForm.currency}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, currency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  >
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="CNY">CNY (Chinese Yuan)</option>
                    <option value="INR">INR (Indian Rupee)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={newSupplierForm.paymentTerms}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Bank Details
                  </label>
                  <input
                    type="text"
                    value={newSupplierForm.bankDetails}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, bankDetails: e.target.value })}
                    placeholder="Bank name, IBAN, SWIFT"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newSupplierForm.notes}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, notes: e.target.value })}
                    placeholder="Additional information, special agreements..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCancelSupplierModal}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSupplier}
                disabled={creatingSupplier}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                {creatingSupplier ? "Creating..." : "Create & Select Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-emerald-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Add New Product</h2>
                  <p className="text-xs text-emerald-100">Create product without leaving this form</p>
                </div>
              </div>
              <button
                onClick={handleCancelProductModal}
                className="p-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductForm.itemCode}
                    onChange={(e) => setNewProductForm({ ...newProductForm, itemCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. YAMAHA-BRK-001"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    placeholder="e.g. Yamaha, Honda, Kipor"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Item Name / Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductForm.itemName}
                    onChange={(e) => setNewProductForm({ ...newProductForm, itemName: e.target.value })}
                    placeholder="e.g. Front Brake Pad Set for YZF-R15"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  >
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Motorcycle Parts">Motorcycle Parts</option>
                    <option value="Generator Parts">Generator Parts</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Lubricants">Lubricants</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Unit of Measurement
                  </label>
                  <select
                    value={newProductForm.unitOfMeasurement}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unitOfMeasurement: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="SET">SET</option>
                    <option value="UNIT">UNIT</option>
                    <option value="BOX">BOX</option>
                    <option value="CARTON">CARTON</option>
                    <option value="PAIR">PAIR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Default Purchase Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProductForm.defaultPurchasePrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, defaultPurchasePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Currency
                  </label>
                  <select
                    value={newProductForm.currency}
                    onChange={(e) => setNewProductForm({ ...newProductForm, currency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-shadow"
                  >
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCancelProductModal}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProduct}
                disabled={creatingProduct}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package className="w-4 h-4" />
                {creatingProduct ? "Creating..." : "Create & Add to Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

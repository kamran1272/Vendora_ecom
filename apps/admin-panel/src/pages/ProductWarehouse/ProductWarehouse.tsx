import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  CheckCircle2,
  Download,
  Eye,
  ImageOff,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "../../layouts/AdminLayout";

type Product = {
  id: string;
  name: string;
  sku: string;
  category?: string;
  brand?: string;
  basePrice: number;
  stock: number;
  status: string;
  description?: string | null;
  images?: string[];
  attributes?: Array<{ name: string; value: string }>;
  variants?: Array<{ name: string; options: string[] }>;
  sourceId?: string;
  externalProductId?: string | null;
  externalSku?: string | null;
  importedAt?: string | null;
};

type ProviderProduct = Product & {
  externalProductId: string;
  images?: string[];
  description?: string | null;
  attributes?: Array<{ name: string; value: string }>;
  variants?: Array<{ name: string; options: string[] }>;
};
type Summary = {
  total: number;
  active: number;
  importedToday: number;
  providers: number;
  failedImports: number;
};
type ImportHistory = {
  id: string;
  providerId: string;
  status: string;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string | null;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  productLimit: number;
  duration: number;
  status: string;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendora.admin.access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const normalizeList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as { items?: unknown; data?: unknown };
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
  }

  return [];
};

function ProductImageGallery({
  images,
  name,
}: {
  images?: string[];
  name: string;
}) {
  if (!images?.length) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-2xl bg-slate-100">
        <ImageOff className="text-slate-400" size={28} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={`${name} image ${index + 1}`}
          className="aspect-square w-full rounded-xl bg-slate-100 object-cover"
        />
      ))}
    </div>
  );
}

export function ProductWarehouse() {
  const modalRoot = typeof document !== "undefined" ? document.body : null;
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    basePrice: "",
    stock: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [providers, setProviders] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [provider, setProvider] = useState("dummyjson");
  const [externalQuery, setExternalQuery] = useState("");
  const [externalProducts, setExternalProducts] = useState<ProviderProduct[]>(
    [],
  );
  const [externalSelected, setExternalSelected] = useState<string[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("");
  const [catalogBrand, setCatalogBrand] = useState("");
  const [catalogStatus, setCatalogStatus] = useState("");
  const [catalogProvider, setCatalogProvider] = useState("");
  const [catalogStock, setCatalogStock] = useState("");
  const [catalogImportedAfter, setCatalogImportedAfter] = useState("");
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [
        productResponse,
        planResponse,
        summaryResponse,
        providerResponse,
        historyResponse,
      ] = await Promise.all([
        api.get("/admin/product-warehouse", {
          params: {
            limit: 24,
            search: catalogSearch,
            category: catalogCategory,
            brand: catalogBrand,
            provider: catalogProvider,
            stockStatus: catalogStock,
            importedAfter: catalogImportedAfter,
            status: catalogStatus,
          },
        }),
        api.get("/admin/subscription-plans"),
        api.get("/admin/product-warehouse/summary"),
        api.get("/admin/product-warehouse/providers"),
        api.get("/admin/product-warehouse/import/history?limit=10"),
      ]);

      const normalizedProducts = normalizeList<Product>(productResponse.data);
      const normalizedPlans = normalizeList<Plan>(planResponse.data);

      setProducts(
        normalizedProducts.map((product) => ({
          ...product,
          basePrice: Number(product.basePrice ?? 0),
          stock: Number(product.stock ?? 0),
        })),
      );

      setPlans(
        normalizedPlans.map((plan) => ({
          id: String(plan.id ?? plan.name ?? "plan"),
          name: String(plan.name ?? "Plan"),
          price: Number(plan.price ?? 0),
          productLimit: Number(plan.productLimit ?? 0),
          duration: Number(plan.duration ?? 30),
          status: String(plan.status ?? "ACTIVE"),
        })),
      );
      setSummary(summaryResponse.data);
      setProviders(providerResponse.data);
      setHistory(historyResponse.data || []);
      setCategories(
        Array.from(
          new Set(
            normalizedProducts
              .map((product) => product.category)
              .filter(Boolean) as string[],
          ),
        ).sort(),
      );
      setBrands(
        Array.from(
          new Set(
            normalizedProducts
              .map((product) => product.brand)
              .filter(Boolean) as string[],
          ),
        ).sort(),
      );
      if (!provider && providerResponse.data[0]?.id)
        setProvider(providerResponse.data[0].id);

      setError("");
    } catch {
      setError("Unable to load warehouse management data.");
    } finally {
      setLoading(false);
    }
  };

  const searchExternal = async (event?: FormEvent) => {
    event?.preventDefault();
    setExternalLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/product-warehouse/import/search", {
        params: { provider, query: externalQuery, page: 1, limit: 50 },
      });
      setExternalProducts(response.data.items || []);
      setExternalSelected([]);
    } catch {
      setError("Unable to search the selected product provider.");
    } finally {
      setExternalLoading(false);
    }
  };

  const importExternal = async () => {
    if (!externalSelected.length || importing) return;
    setImporting(true);
    setError("");
    try {
      const response = await api.post("/admin/product-warehouse/import", {
        provider,
        externalIds: externalSelected,
      });
      const result = response.data as {
        createdCount: number;
        updatedCount: number;
        failedCount: number;
      };
      setExternalSelected([]);
      setExternalProducts([]);
      setError(
        result.failedCount
          ? `${result.createdCount} created, ${result.updatedCount} updated, ${result.failedCount} failed.`
          : `${result.createdCount} created and ${result.updatedCount} updated successfully.`,
      );
      await load();
    } catch {
      setError("Unable to import the selected products.");
    } finally {
      setImporting(false);
    }
  };

  const selectAllVisibleProducts = () => {
    if (!externalProducts.length) return;

    const visibleIds = externalProducts
      .map((product) => product.externalProductId)
      .filter(Boolean);

    if (!visibleIds.length) return;

    const nextSelection = Array.from(
      new Set([...externalSelected, ...visibleIds]),
    ).slice(0, 50);

    if (visibleIds.length > 50) {
      setError("Only 50 products can be imported in one bulk batch.");
    } else {
      setError("");
    }

    setExternalSelected(nextSelection);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), catalogSearch ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [
    catalogSearch,
    catalogCategory,
    catalogBrand,
    catalogProvider,
    catalogStock,
    catalogImportedAfter,
    catalogStatus,
  ]);

  useEffect(() => {
    if (!previewProduct && !editingProduct && !confirmImport && !pendingDelete)
      return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewProduct, editingProduct, confirmImport, pendingDelete]);

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/admin/product-warehouse", {
        ...form,
        basePrice: Number(form.basePrice),
        stock: Number(form.stock),
        status: "PUBLISHED",
      });

      setForm({
        name: "",
        sku: "",
        category: "",
        brand: "",
        basePrice: "",
        stock: "",
      });
      await load();
    } catch {
      setError("Unable to create warehouse product.");
    }
  };

  const toggle = async (product: Product) => {
    try {
      await api.patch(`/admin/product-warehouse/${product.id}`, {
        status: product.status === "PUBLISHED" ? "INACTIVE" : "PUBLISHED",
      });
      await load();
    } catch {
      setError("Unable to update warehouse product status.");
    }
  };

  const archive = async (product: Product) => {
    try {
      await api.patch(`/admin/product-warehouse/${product.id}`, {
        status: "ARCHIVED",
      });
      await load();
    } catch {
      setError("Unable to archive warehouse product.");
    }
  };

  const resync = async (product: Product) => {
    if (
      !product.sourceId ||
      !product.externalProductId ||
      product.sourceId === "manual"
    )
      return;
    try {
      await api.post("/admin/product-warehouse/import", {
        provider: product.sourceId,
        externalIds: [product.externalProductId],
      });
      await load();
    } catch {
      setError("Unable to re-sync this warehouse product.");
    }
  };

  const updateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct || savingProduct) return;
    setSavingProduct(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      const parseJsonField = (name: string, fallback: unknown) => {
        const value = String(formData.get(name) || "").trim();
        if (!value) return fallback;
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error(`${name} must be an array`);
        return parsed;
      };
      await api.patch(`/admin/product-warehouse/${editingProduct.id}`, {
        name: String(formData.get("name") || "").trim(),
        sku: String(formData.get("sku") || "").trim(),
        description: String(formData.get("description") || "").trim() || null,
        category: String(formData.get("category") || "").trim() || null,
        brand: String(formData.get("brand") || "").trim() || null,
        basePrice: Number(formData.get("basePrice") || 0),
        stock: Number(formData.get("stock") || 0),
        status: String(formData.get("status") || "PUBLISHED"),
        images: parseJsonField("images", editingProduct.images || []),
        attributes: parseJsonField(
          "attributes",
          editingProduct.attributes || [],
        ),
        variants: parseJsonField("variants", editingProduct.variants || []),
      });
      setEditingProduct(null);
      await load();
    } catch (updateError) {
      setError(
        updateError instanceof SyntaxError
          ? "Images, attributes, and variants must be valid JSON arrays."
          : "Unable to update warehouse product.",
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/admin/product-warehouse/${id}`);
      await load();
    } catch {
      setError("Unable to delete warehouse product.");
    }
    setPendingDelete(null);
  };

  const previewOverlay =
    previewProduct && modalRoot
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPreviewProduct(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="warehouse-preview-title"
              className="relative z-[201] max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Warehouse preview
                  </p>
                  <h2
                    id="warehouse-preview-title"
                    className="mt-1 text-xl font-bold text-slate-900"
                  >
                    {previewProduct.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {previewProduct.sourceId || "manual"} ·{" "}
                    {previewProduct.externalProductId || previewProduct.sku}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[220px_1fr]">
                <ProductImageGallery
                  images={previewProduct.images}
                  name={previewProduct.name}
                />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">SKU</p>
                    <p className="font-semibold text-slate-900">
                      {previewProduct.sku}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <p className="font-semibold text-slate-900">
                      {previewProduct.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Category</p>
                    <p className="font-semibold text-slate-900">
                      {previewProduct.category || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Brand</p>
                    <p className="font-semibold text-slate-900">
                      {previewProduct.brand || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Price</p>
                    <p className="font-semibold text-slate-900">
                      ${Number(previewProduct.basePrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Stock</p>
                    <p className="font-semibold text-slate-900">
                      {previewProduct.stock}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {previewProduct.description || "No description available."}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewProduct(null);
                    setEditingProduct(previewProduct);
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Edit product
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const confirmImportOverlay =
    confirmImport && modalRoot
      ? createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setConfirmImport(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-[2001] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Confirm warehouse import
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Import {externalSelected.length} normalized product
                {externalSelected.length === 1 ? "" : "s"} from {provider}.
                Existing source/external ID matches will be updated, not
                duplicated.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmImport(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={externalSelected.length > 50 || importing}
                  onClick={() => {
                    setConfirmImport(false);
                    void importExternal();
                  }}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
                >
                  Confirm import
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <AdminLayout>
      {previewOverlay}
      {confirmImportOverlay}
      <div className="space-y-6 p-1 sm:p-2 lg:p-3">
        <header className="admin-page-header overflow-hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-orange-700">
                Catalog operations
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  Product Warehouse
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Manage approved catalog inventory, import products from trusted providers,
                  and keep sellers ready-to-activate assortment updated.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Live inventory
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                {summary?.providers ?? 0} providers
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {([
            ["Total warehouse products", summary?.total ?? 0, "#102451", "bg-indigo-50 text-indigo-700"],
            ["Active products", summary?.active ?? 0, "#ff7612", "bg-orange-50 text-orange-700"],
            ["Imported today", summary?.importedToday ?? 0, "#0f766e", "bg-teal-50 text-teal-700"],
            ["Providers", summary?.providers ?? 0, "#7c3aed", "bg-violet-50 text-violet-700"],
            ["Failed imports", summary?.failedImports ?? 0, "#dc2626", "bg-rose-50 text-rose-700"],
          ] as Array<[string, number, string, string]>).map(([label, value, accent, tone]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}
                  style={{ borderColor: accent, borderWidth: 1 }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(255,118,18,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#1f2937_100%)] p-5 text-white shadow-[0_18px_42px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                Provider import
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Search approved external catalogs
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Pull inventory from trusted supplier sources and normalize it for your seller storefronts.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className="h-11 min-w-[220px] appearance-none rounded-2xl border border-orange-400/40 bg-slate-950/80 px-3 pr-10 text-sm text-white shadow-[0_0_0_1px_rgba(255,118,18,0.18)] outline-none transition duration-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-500/20"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, transparent 50%, #ff7612 50%), linear-gradient(135deg, #ff7612 50%, transparent 50%)',
                backgroundPosition: 'calc(100% - 18px) calc(50% - 2px), calc(100% - 12px) calc(50% - 2px)',
                backgroundSize: '6px 6px, 6px 6px',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <option value="">Select provider</option>
              {providers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <form
              onSubmit={(event) => void searchExternal(event)}
              className="flex w-full min-w-0 flex-col gap-2 sm:flex-row"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3">
                <Search size={16} className="shrink-0 text-slate-300" />
                <input
                  value={externalQuery}
                  onChange={(event) => setExternalQuery(event.target.value)}
                  placeholder="Search provider products..."
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={externalLoading || !provider}
                className="h-11 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(255,118,18,0.35)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {externalLoading ? "Searching..." : "Search"}
              </button>
            </form>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">
                {externalSelected.length} selected · batches are limited to 50
                products
              </span>
              <button
                type="button"
                onClick={selectAllVisibleProducts}
                disabled={!externalProducts.length || importing}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setExternalSelected([])}
                disabled={!externalSelected.length || importing}
                className="rounded-lg border border-white/15 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!externalSelected.length) {
                  setError("Select at least one product before importing.");
                  return;
                }
                setConfirmImport(true);
              }}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              <Download size={16} />
              {importing
                ? "Importing..."
                : externalSelected.length > 1
                  ? "Bulk Import"
                  : "Import"}
            </button>
          </div>
          {externalProducts.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {externalProducts.map((product) => {
                const selected = externalSelected.includes(
                  product.externalProductId,
                );
                return (
                  <button
                    type="button"
                    key={product.externalProductId}
                    onClick={() =>
                      setExternalSelected((current) =>
                        selected
                          ? current.filter(
                              (id) => id !== product.externalProductId,
                            )
                          : [...current, product.externalProductId],
                      )
                    }
                    className={`rounded-2xl border p-3 text-left transition ${selected ? "border-sky-300 bg-sky-400/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="line-clamp-2 text-sm font-semibold">
                        {product.name}
                      </span>
                      {selected ? (
                        <CheckCircle2
                          size={18}
                          className="shrink-0 text-sky-300"
                        />
                      ) : null}
                    </div>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="mt-3 aspect-[4/3] w-full rounded-xl object-cover"
                      />
                    ) : null}
                    <p className="mt-2 text-xs text-slate-300">
                      {product.brand || "Unbranded"} ·{" "}
                      {product.category || "Uncategorized"}
                    </p>
                    <p className="mt-2 font-semibold">
                      ${Number(product.basePrice || 0).toFixed(2)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        · stock {product.stock}
                      </span>
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                      {product.description || "No description available."}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {product.attributes?.length || 0} attributes ·{" "}
                      {product.variants?.length || 0} variants
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form
            onSubmit={createProduct}
            className="admin-card self-start p-5 xl:sticky xl:top-24"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Create warehouse product
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add catalog items that sellers can later select.
              </p>
            </div>

            <div className="space-y-3">
              {(
                [
                  "name",
                  "sku",
                  "category",
                  "brand",
                  "basePrice",
                  "stock",
                ] as const
              ).map((field) => (
                <label key={field} className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    {field === "basePrice"
                      ? "Base price"
                      : field === "stock"
                        ? "Stock"
                        : field}
                  </span>
                  <input
                    required={
                      field === "name" ||
                      field === "sku" ||
                      field === "basePrice"
                    }
                    value={form[field]}
                    onChange={(event) =>
                      setForm({ ...form, [field]: event.target.value })
                    }
                    type={
                      field === "basePrice" || field === "stock"
                        ? "number"
                        : "text"
                    }
                    placeholder={
                      field === "basePrice"
                        ? "149.99"
                        : field === "stock"
                          ? "100"
                          : ""
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-[#102451] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b2d5d]"
            >
              Create Product
            </button>
          </form>

          <section className="admin-card min-w-0 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Warehouse catalog
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Approved products available for seller activation.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                {products.length} items
              </span>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <label className="sm:col-span-2 xl:col-span-2">
                <span className="sr-only">Search warehouse catalog</span>
                <input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <select
                value={catalogCategory}
                onChange={(event) => setCatalogCategory(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                value={catalogBrand}
                onChange={(event) => setCatalogBrand(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">All brands</option>
                {brands.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                value={catalogProvider}
                onChange={(event) => setCatalogProvider(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">All providers</option>
                {providers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={catalogStock}
                onChange={(event) => setCatalogStock(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">All stock</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <select
                value={catalogStatus}
                onChange={(event) => setCatalogStatus(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="">All statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <label className="xl:col-span-2">
                <span className="sr-only">Imported after</span>
                <input
                  type="date"
                  value={catalogImportedAfter}
                  onChange={(event) =>
                    setCatalogImportedAfter(event.target.value)
                  }
                  aria-label="Imported after"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>

            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="h-32 rounded-xl bg-slate-100" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                    <div className="mt-4 h-9 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : (
              false && (
                <div className="hidden">
                  <table className="warehouse-catalog-table text-left text-sm text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">SKU</th>
                        <th className="px-4 py-3 font-semibold">
                          Source / External ID
                        </th>
                        <th className="px-4 py-3 font-semibold">
                          Category / Brand
                        </th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold">Stock</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Imported</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length ? (
                        products.map((product) => (
                          <tr
                            key={product.id}
                            className="border-b border-slate-100 align-top transition hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              <div className="flex min-w-[210px] items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                                  {product.images?.[0] ? (
                                    <img
                                      src={product.images[0]}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <ImageOff size={16} />
                                  )}
                                </span>
                                <span className="line-clamp-2">
                                  {product.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {product.sku}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              <div className="font-semibold text-slate-700">
                                {product.sourceId || "manual"}
                              </div>
                              <div>{product.externalProductId || "—"}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              <div>{product.category || "Uncategorized"}</div>
                              <div>{product.brand || "Unbranded"}</div>
                            </td>
                            <td className="px-4 py-3">
                              ${Number(product.basePrice ?? 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">{product.stock}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  product.status === "PUBLISHED"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {product.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {product.importedAt
                                ? new Date(
                                    product.importedAt,
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="warehouse-product-actions-cell px-4 py-3 align-middle">
                              <div className="warehouse-product-actions">
                                <button
                                  type="button"
                                  onClick={() => setPreviewProduct(product)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                >
                                  <Eye size={14} /> Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct(product)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                {product.sourceId &&
                                product.externalProductId &&
                                product.sourceId !== "manual" ? (
                                  <button
                                    type="button"
                                    onClick={() => void resync(product)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700"
                                  >
                                    <RefreshCw size={14} /> Re-sync
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => void toggle(product)}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                >
                                  {product.status === "PUBLISHED"
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                                {product.status !== "ARCHIVED" ? (
                                  <button
                                    type="button"
                                    onClick={() => void archive(product)}
                                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700"
                                  >
                                    Archive
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete(product)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                              <div className="hidden">
                                {products.map((product) => (
                                  <article
                                    key={product.id}
                                    className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                                  >
                                    <div className="flex gap-3">
                                      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                                        {product.images?.[0] ? (
                                          <img
                                            src={product.images[0]}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <ImageOff size={18} />
                                        )}
                                      </span>
                                      <div className="min-w-0">
                                        <h3 className="line-clamp-2 font-semibold text-slate-900">
                                          {product.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                          {product.sku} ·{" "}
                                          {product.sourceId || "manual"}
                                        </p>
                                        <span
                                          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${product.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                                        >
                                          {product.status}
                                        </span>
                                      </div>
                                    </div>
                                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <dt className="text-slate-500">
                                          Price
                                        </dt>
                                        <dd className="font-semibold text-slate-800">
                                          $
                                          {Number(
                                            product.basePrice ?? 0,
                                          ).toFixed(2)}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-slate-500">
                                          Stock
                                        </dt>
                                        <dd className="font-semibold text-slate-800">
                                          {product.stock}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-slate-500">
                                          Category
                                        </dt>
                                        <dd className="truncate font-semibold text-slate-800">
                                          {product.category || "—"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-slate-500">
                                          Imported
                                        </dt>
                                        <dd className="font-semibold text-slate-800">
                                          {product.importedAt
                                            ? new Date(
                                                product.importedAt,
                                              ).toLocaleDateString()
                                            : "—"}
                                        </dd>
                                      </div>
                                    </dl>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewProduct(product)
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                      >
                                        <Eye size={14} /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingProduct(product)
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                      >
                                        <Pencil size={14} /> Edit
                                      </button>
                                      {product.sourceId &&
                                      product.externalProductId &&
                                      product.sourceId !== "manual" ? (
                                        <button
                                          type="button"
                                          onClick={() => void resync(product)}
                                          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700"
                                        >
                                          <RefreshCw size={14} /> Re-sync
                                        </button>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={() => void toggle(product)}
                                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                      >
                                        {product.status === "PUBLISHED"
                                          ? "Deactivate"
                                          : "Activate"}
                                      </button>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-sm text-slate-500"
                          >
                            No warehouse products available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )
            )}
            <div className="grid gap-3 p-4">
              {products.map((product) => (
                <article
                  key={`mobile-${product.id}`}
                  className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ImageOff size={18} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.sku} · {product.sourceId || "manual"}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${product.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {product.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <span className="text-slate-500">SKU</span>
                      <p className="truncate font-semibold text-slate-800">
                        {product.sku}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Source</span>
                      <p className="truncate font-semibold text-slate-800">
                        {product.sourceId || "manual"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">External ID</span>
                      <p className="truncate font-semibold text-slate-800">
                        {product.externalProductId || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category</span>
                      <p className="truncate font-semibold text-slate-800">
                        {product.category || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Brand</span>
                      <p className="truncate font-semibold text-slate-800">
                        {product.brand || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Price</span>
                      <p className="font-semibold text-slate-800">
                        ${Number(product.basePrice ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Stock</span>
                      <p className="font-semibold text-slate-800">
                        {product.stock}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Imported</span>
                      <p className="font-semibold text-slate-800">
                        {product.importedAt
                          ? new Date(product.importedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    {product.sourceId &&
                    product.externalProductId &&
                    product.sourceId !== "manual" ? (
                      <button
                        type="button"
                        onClick={() => void resync(product)}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700"
                      >
                        <RefreshCw size={14} /> Re-sync
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void toggle(product)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {product.status === "PUBLISHED"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                    {product.status !== "ARCHIVED" ? (
                      <button
                        type="button"
                        onClick={() => void archive(product)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700"
                      >
                        Archive
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {plans.length ? (
          <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Subscription plans
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Seller limits and upgrade options for warehouse access.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {plan.name}
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">
                    ${plan.price}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {plan.productLimit < 0
                      ? "Unlimited"
                      : `${plan.productLimit} products`}{" "}
                    • {plan.duration} days
                  </div>
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {plan.status}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Import history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent provider batches and their normalized results.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Failed</th>
                  <th className="px-3 py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {history.length ? (
                  history.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {item.providerId}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.failedCount ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-emerald-700">
                        {item.createdCount}
                      </td>
                      <td className="px-3 py-3 text-sky-700">
                        {item.updatedCount}
                      </td>
                      <td className="px-3 py-3 text-rose-700">
                        {item.failedCount}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-slate-500"
                    >
                      No provider imports recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {editingProduct && modalRoot
          ? createPortal(
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4">
            <form
              onSubmit={(event) => void updateProduct(event)}
              role="dialog"
              aria-modal="true"
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Warehouse product
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Update catalog record
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close editor"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Name
                  </span>
                  <input
                    name="name"
                    defaultValue={editingProduct.name}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    SKU
                  </span>
                  <input
                    name="sku"
                    defaultValue={editingProduct.sku}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={editingProduct.status}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Category
                  </span>
                  <input
                    name="category"
                    defaultValue={editingProduct.category || ""}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Brand
                  </span>
                  <input
                    name="brand"
                    defaultValue={editingProduct.brand || ""}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Base price
                  </span>
                  <input
                    name="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingProduct.basePrice}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Stock
                  </span>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={editingProduct.stock}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Description
                  </span>
                  <textarea
                    name="description"
                    defaultValue={editingProduct.description || ""}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Product images
                  </span>
                  <ProductImageGallery
                    images={editingProduct.images}
                    name={editingProduct.name}
                  />
                </div>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Images JSON array
                  </span>
                  <textarea
                    name="images"
                    defaultValue={JSON.stringify(
                      editingProduct.images || [],
                      null,
                      2,
                    )}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Attributes JSON
                  </span>
                  <textarea
                    name="attributes"
                    defaultValue={JSON.stringify(
                      editingProduct.attributes || [],
                      null,
                      2,
                    )}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Variants JSON
                  </span>
                  <textarea
                    name="variants"
                    defaultValue={JSON.stringify(
                      editingProduct.variants || [],
                      null,
                      2,
                    )}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs"
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingProduct ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
              </div>,
              modalRoot,
            )
          : null}

        {pendingDelete && modalRoot
          ? createPortal(
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Delete warehouse product?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This is allowed only when no seller assignments reference{" "}
                <strong>{pendingDelete.name}</strong>. Assigned products should
                be deactivated instead.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void remove(pendingDelete.id)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
              </div>,
              modalRoot,
            )
          : null}
      </div>
    </AdminLayout>
  );
}

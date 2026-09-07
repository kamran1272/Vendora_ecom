import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  ImageOff,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { SellerLayout } from "../../components/layout/SellerLayout";
import { showSellerToast } from "../../components/feedback/SellerToast";
import {
  addWarehouseProducts,
  addAllWarehouseProducts,
  getSellerState,
  getWarehouseProducts,
  removeWarehouseProduct,
  type SellerState,
  type WarehouseProduct,
} from "../../services/storehouse.service";

type LimitError = {
  currentCount: number;
  productLimit: number;
  requestedCount: number;
  remainingSlots: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function stockTone(stock: number) {
  if (stock <= 0) return "text-red-600";
  if (stock <= 5) return "text-amber-600";
  return "text-emerald-600";
}

function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(src));

  useEffect(() => {
    setFailed(false);
    setLoading(Boolean(src));
  }, [src]);

  if (!src || failed) {
    return (
      <span
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        aria-label={`${alt} image unavailable`}
      >
        <ImageOff size={16} />
      </span>
    );
  }

  return (
    <span className={`relative block overflow-hidden bg-slate-100 ${className}`}>
      {loading ? <span className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" /> : null}
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} className={`h-full w-full object-cover transition-opacity ${loading ? "opacity-0" : "opacity-100"}`} />
    </span>
  );
}

export function ProductStorehousePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [state, setState] = useState<SellerState | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [limitError, setLimitError] = useState<LimitError | null>(null);
  const [viewProduct, setViewProduct] = useState<WarehouseProduct | null>(null);
  const [pendingRemove, setPendingRemove] = useState<WarehouseProduct | null>(null);
  const [confirmAddAll, setConfirmAddAll] = useState(false);

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const data = await getWarehouseProducts({
        page,
        limit: 24,
        search,
        category,
        brand,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        stockStatus,
        sort,
      }, signal);
      setProducts((current) => {
        if (page === 1) return data.items;
        const merged = new Map(current.map((product) => [product.id, product]));
        data.items.forEach((product) => merged.set(product.id, product));
        return [...merged.values()];
      });
      setTotalPages(data.totalPages);
      setTotalResults(data.total);
      setCategories(data.categories);
      setBrands(data.brands);
    } catch (loadError: any) {
      if (loadError?.code === "ERR_CANCELED" || signal?.aborted) return;
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load warehouse products.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    void getSellerState()
      .then(setState)
      .catch((loadError: any) =>
        setError(
          loadError?.response?.data?.message ||
            "Unable to load seller package information.",
        ),
      );
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, category, brand, minPrice, maxPrice, stockStatus, sort]);

  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const availableSelected = products.filter(
    (product) =>
      selected.includes(product.id) &&
      !product.addedToStore &&
      product.stock > 0 &&
      product.status === "PUBLISHED",
  );

  const addSelected = async (
    productIds = availableSelected.map((product) => product.id),
  ) => {
    if (!productIds.length || submitting) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await addWarehouseProducts(productIds);
      if (result.code === "PRODUCT_LIMIT_EXCEEDED") {
        setLimitError({
          currentCount: result.currentCount || 0,
          productLimit: result.productLimit || 0,
          requestedCount: result.requestedCount || productIds.length,
          remainingSlots: result.remainingSlots || 0,
        });
        return;
      }
      if (!result.success)
        throw new Error(result.message || "Unable to add products.");
      setSelected([]);
      const successMessage = result.message || `${result.createdCount || 0} product${result.createdCount === 1 ? "" : "s"} added. ${result.alreadyExistsCount || 0} already existed in your store.`;
      setMessage(successMessage);
      showSellerToast({ tone: "success", title: "Storehouse updated", message: successMessage });
      await load();
      void getSellerState().then(setState);
    } catch (submitError: any) {
      const errorMessage = submitError?.response?.data?.message || submitError?.message || "Unable to add products.";
      setError(errorMessage);
      showSellerToast({ tone: "error", title: "Unable to add products", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const addAllFiltered = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await addAllWarehouseProducts({ search, category, brand, minPrice, maxPrice, stockStatus, sort });
      if (!result.success) throw new Error(result.message || "Refine your filters before adding products.");
      const successMessage = result.message || `${result.createdCount || 0} products added. ${result.alreadyExistsCount || 0} already existed in your store.`;
      setMessage(successMessage);
      showSellerToast({ tone: "success", title: "Filtered products added", message: successMessage });
      await load();
      void getSellerState().then(setState);
    } catch (submitError: any) {
      const errorMessage = submitError?.response?.data?.message || submitError?.message || "Unable to add filtered products.";
      setError(errorMessage);
      showSellerToast({ tone: "error", title: "Bulk add failed", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (product: WarehouseProduct) => {
    if (!product.sellerProductId) return;
    setSubmitting(true);
    setError("");
    try {
      await removeWarehouseProduct(product.id);
      setMessage("Product removed from your store.");
      await load();
      void getSellerState().then(setState);
      setPendingRemove(null);
      showSellerToast({ tone: "success", title: "Product removed", message: "The seller assignment was removed. The warehouse product remains available." });
    } catch (removeError: any) {
      const errorMessage = removeError?.response?.data?.message || removeError?.message || "Unable to remove product.";
      setError(errorMessage);
      showSellerToast({ tone: "error", title: "Unable to remove product", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const usage =
    state?.plan.productLimit && state.plan.productLimit > 0
      ? Math.min(100, (state.currentCount / state.plan.productLimit) * 100)
      : 0;

  return (
    <SellerLayout
      title="Product storehouse"
      subtitle="Browse available warehouse inventory and connect products to your seller store."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      }
    >
      <div className="space-y-5">
        {state && state.plan.productLimit > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                Store catalog usage
              </span>
              <span className="text-slate-500">
                {state.currentCount} / {state.plan.productLimit}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${usage >= 80 ? "bg-amber-500" : "bg-[#2d80d8]"}`}
                style={{ width: `${usage}%` }}
              />
            </div>
          </section>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(140px,1fr))]">
            <label className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search warehouse products..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2d80d8]"
              />
            </label>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={brand}
              onChange={(event) => {
                setBrand(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All brands</option>
              {brands.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              value={minPrice}
              onChange={(event) => {
                setMinPrice(event.target.value);
                setPage(1);
              }}
              type="number"
              min="0"
              step="0.01"
              placeholder="Min price"
              aria-label="Minimum price"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            />
            <input
              value={maxPrice}
              onChange={(event) => {
                setMaxPrice(event.target.value);
                setPage(1);
              }}
              type="number"
              min="0"
              step="0.01"
              placeholder="Max price"
              aria-label="Maximum price"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            />
            <select
              value={stockStatus}
              onChange={(event) => {
                setStockStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">Any stock</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_low">Seller price low-high</option>
              <option value="price_high">Seller price high-low</option>
            </select>
          </div>
        </section>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Available products</p><p className="mt-1 text-sm text-slate-600">{products.length} loaded from the admin warehouse</p></div>
            <button type="button" disabled={loading || !products.length || submitting} onClick={() => setConfirmAddAll(true)} className="inline-flex items-center gap-2 rounded-lg border border-[#2d80d8] px-4 py-2 text-sm font-semibold text-[#1d5fb9] disabled:opacity-40">Add all filtered</button>
          </div>
          {loading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-xl border border-slate-200 p-3"><div className="aspect-[4/3] rounded-lg bg-slate-100" /><div className="mt-3 h-4 rounded bg-slate-100" /><div className="mt-2 h-3 w-2/3 rounded bg-slate-100" /></div>
              ))}
            </div>
          ) : !products.length ? (
            <div className="p-14 text-center">
              <Package className="mx-auto text-slate-300" size={36} />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                No warehouse products found.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => { const isSelected = selected.includes(product.id); const unavailable = product.status !== "PUBLISHED" || product.stock <= 0 || product.addedToStore; const sellerMargin = Number(product.sellerMargin || 0); return <article key={product.id} className={`relative overflow-hidden rounded-xl border bg-white transition ${isSelected ? "border-[#2d80d8] ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}>
                <button type="button" disabled={unavailable || submitting} onClick={() => toggleSelected(product.id)} className="block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"><div className="relative"><ProductImage src={product.images?.[0]} alt={product.name} className="aspect-[4/3] w-full object-cover" /><span className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[10px] font-bold text-white ${product.status !== "PUBLISHED" ? "bg-slate-600" : product.stock > 0 ? "bg-emerald-600" : "bg-red-500"}`}>{product.status !== "PUBLISHED" ? product.status : product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}</span>{product.discountPercentage ? <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">-{product.discountPercentage}%</span> : null}{isSelected ? <span className="absolute bottom-3 right-3 rounded-full bg-[#2d80d8] px-2 py-1 text-xs font-bold text-white">Selected</span> : null}</div><div className="p-3"><h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.brand || "Unbranded"} · {product.category || "Uncategorized"}</p><div className="mt-2 flex items-center gap-2 text-xs">{product.rating != null ? <span className="font-semibold text-amber-600">★ {Number(product.rating).toFixed(1)}</span> : null}<span className={stockTone(product.stock)}>Stock {product.stock}</span></div><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-lg font-bold text-slate-900">{money(product.sellerPrice ?? product.basePrice + sellerMargin)}</p><p className="text-xs text-slate-500">Warehouse {money(product.basePrice)}</p></div><span className="text-xs font-semibold text-slate-500">SKU {product.sku}</span></div></div></button>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2"><button type="button" onClick={() => setViewProduct(product)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"><Eye size={14} /> Preview</button>{product.addedToStore ? <><button type="button" onClick={() => navigate(`/seller/products/${product.sellerProductId}/edit`)} className="text-xs font-semibold text-[#1d5fb9] hover:underline">Manage listing</button><button type="button" disabled={submitting} onClick={() => setPendingRemove(product)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 disabled:opacity-40"><Trash2 size={14} /> Remove</button></> : <button type="button" disabled={unavailable || submitting} onClick={() => void addSelected([product.id])} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d5fb9] disabled:opacity-40"><ShoppingBag size={14} /> Select</button>}</div>
              </article> })}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            <span>Showing {products.length} of {totalResults} warehouse products</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">{loading ? "Loading more products..." : page >= totalPages ? "All products loaded" : "Load more"}</button>
          </div>
        </section>
        <aside className="flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4 xl:h-fit">
          <div className="flex-1 divide-y divide-slate-100 px-4">{selected.length ? selected.map((id) => { const product = products.find((item) => item.id === id); if (!product) return null; const sellerMargin = Number(product.sellerMargin || 0); return <div key={id} className="flex items-center gap-3 py-3"><ProductImage src={product.images?.[0]} alt={product.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="text-xs text-slate-500">{money(product.sellerPrice ?? product.basePrice + sellerMargin)}</p></div><button type="button" onClick={() => setSelected((current) => current.filter((item) => item !== id))} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Remove ${product.name} from selection`}><X size={16} /></button></div> }) : <div className="flex min-h-[240px] flex-col items-center justify-center text-center"><Package className="text-slate-300" size={32} /><p className="mt-3 text-sm font-semibold text-slate-700">No products selected yet</p><p className="mt-1 max-w-[220px] text-xs text-slate-500">Select products from the warehouse to prepare them for your store.</p></div>}</div>
          <div className="grid gap-2 border-t border-slate-200 p-4"><button type="button" disabled={!availableSelected.length || submitting} onClick={() => void addSelected()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2d80d8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><ShoppingBag size={15} />{submitting ? "Adding..." : `Add selected${availableSelected.length ? ` (${availableSelected.length})` : ""}`}</button><button type="button" disabled={loading || !products.length || submitting} onClick={() => setConfirmAddAll(true)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40">Add all filtered</button></div>
        </aside>
        </div>
      </div>
      {confirmAddAll ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-slate-900">Add filtered products?</h2><p className="mt-2 text-sm text-slate-600">This will process up to 50 products matching the current warehouse filters. The server will apply the filters again before changing your store.</p><div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Current result</p><p className="mt-1 text-2xl font-bold text-slate-900">{totalResults} products</p>{totalResults > 50 ? <p className="mt-1 text-xs text-amber-700">Refine the filters. Bulk operations are limited to 50 products.</p> : null}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmAddAll(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={totalResults > 50 || submitting} onClick={() => { setConfirmAddAll(false); void addAllFiltered(); }} className="rounded-lg bg-[#2d80d8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{submitting ? "Adding..." : "Confirm add all"}</button></div></div></div> : null}
      {viewProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {viewProduct.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{viewProduct.sku}</p>
              </div>
              <button
                type="button"
                aria-label="Close product details"
                onClick={() => setViewProduct(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <ProductImage src={viewProduct.images?.[0]} alt={viewProduct.name} className="mt-4 h-48 w-full rounded-xl object-cover" />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Category</span>
                <div className="font-semibold">
                  {viewProduct.category || "—"}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Brand</span>
                <div className="font-semibold">{viewProduct.brand || "—"}</div>
              </div>
              <div>
                <span className="text-slate-500">Warehouse stock</span>
                <div className="font-semibold">{viewProduct.stock}</div>
              </div>
              <div>
                <span className="text-slate-500">Seller price</span>
                <div className="font-semibold">
                  {money(
                    viewProduct.sellerPrice ??
                      viewProduct.basePrice + Number(viewProduct.sellerMargin || 0),
                  )}
                </div>
              </div>
              {viewProduct.rating != null ? <div><span className="text-slate-500">Rating</span><div className="font-semibold text-amber-600">★ {Number(viewProduct.rating).toFixed(1)}</div></div> : null}
              {viewProduct.discountPercentage ? <div><span className="text-slate-500">Discount</span><div className="font-semibold text-emerald-600">{viewProduct.discountPercentage}%</div></div> : null}
            </div>
          </div>
        </div>
      ) : null}
      {limitError ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Product limit reached</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your plan allows {limitError.productLimit} products and{" "}
              {limitError.remainingSlots} slots remain.
            </p>
            <button
              type="button"
              onClick={() => setLimitError(null)}
              className="mt-5 rounded-lg bg-[#2d80d8] px-4 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      {pendingRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-bold text-slate-900">Remove from Storehouse?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This removes <strong>{pendingRemove.name}</strong> from your seller assignment only. The master warehouse product remains available.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingRemove(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={() => void remove(pendingRemove)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Remove</button>
            </div>
          </div>
        </div>
      ) : null}
    </SellerLayout>
  );
}

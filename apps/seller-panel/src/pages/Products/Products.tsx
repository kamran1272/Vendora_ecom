import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Edit3,
  Eye,
  ImageOff,
  MoreHorizontal,
  Package,
  Plus,
  Power,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { SellerLayout } from "../../components/layout/SellerLayout";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import {
  deleteSellerProduct,
  updateSellerProduct,
} from "../../services/products.service";
import {
  bulkUpdateSellerProducts,
  getSellerProducts,
  type WarehouseProduct,
} from "../../services/product-warehouse.service";

type StockFilter = "" | "in_stock" | "low_stock" | "out_of_stock";
type SortKey =
  "newest" | "oldest" | "name" | "price_low" | "price_high" | "sales";

const pageSize = 10;
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function statusTone(status: string) {
  return status.toUpperCase() === "ACTIVE"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-slate-100 text-slate-600 ring-slate-200";
}

function stockTone(stock: number) {
  if (stock <= 0) return "text-red-600";
  if (stock <= 5) return "text-amber-600";
  return "text-emerald-600";
}

function ProductCard({
  product,
  selected,
  working,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: {
  product: WarehouseProduct;
  selected: boolean;
  working: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const price = Number(product.salePrice ?? product.basePrice);
  const oldPrice =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    Number(product.basePrice) > price
      ? Number(product.basePrice)
      : null;
  const stockLabel =
    product.stock <= 0
      ? "Out of stock"
      : product.stock <= 5
        ? `Low stock (${product.stock})`
        : `In stock (${product.stock})`;
  const image = product.thumbnail || product.images?.[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-slate-400"
            aria-label={`${product.name} image unavailable`}
          >
            <ImageOff size={30} />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusTone(product.status)}`}
        >
          {product.status}
        </span>
        <input
          type="checkbox"
          aria-label={`Select ${product.name}`}
          checked={selected}
          onChange={onSelect}
          className="absolute right-3 top-3 h-4 w-4 rounded border-slate-300 bg-white"
        />
      </div>
      <div className="p-4">
        <h3
          className="truncate text-base font-bold text-slate-900"
          title={product.name}
        >
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-black text-slate-900">
            {money.format(price)}
          </span>
          {oldPrice !== null ? (
            <span className="text-xs text-slate-400 line-through">
              {money.format(oldPrice)}
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-500">Rating</p>
            <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-700">
              {product.rating !== null && product.rating !== undefined ? (
                <>
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {Number(product.rating).toFixed(1)}
                </>
              ) : (
                "No rating data"
              )}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Stock</p>
            <p className={`mt-1 font-semibold ${stockTone(product.stock)}`}>
              {stockLabel}
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Sales:{" "}
          <span className="font-semibold text-slate-700">
            {product.sales !== null && product.sales !== undefined
              ? product.sales
              : "No data available"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={13} /> View
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-200 px-2 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            type="button"
            disabled={working}
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState<StockFilter>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WarehouseProduct | null>(
    null,
  );

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await getSellerProducts());
    } catch (loadError: any) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load your products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [search, status, category, brand, stock, minPrice, maxPrice, sort]);

  const options = useMemo(
    () => ({
      categories: [
        ...new Set(products.map((product) => product.category).filter(Boolean)),
      ] as string[],
      brands: [
        ...new Set(products.map((product) => product.brand).filter(Boolean)),
      ] as string[],
    }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const low = minPrice === "" ? 0 : Number(minPrice);
    const high = maxPrice === "" ? Number.POSITIVE_INFINITY : Number(maxPrice);
    return products
      .filter((product) => {
        const price = Number(product.salePrice ?? product.basePrice ?? 0);
        const matchesSearch =
          !query ||
          [product.name, product.sku, product.brand, product.category].some(
            (value) => value?.toLowerCase().includes(query),
          );
        const matchesStock =
          !stock ||
          (stock === "in_stock"
            ? product.stock > 5
            : stock === "low_stock"
              ? product.stock > 0 && product.stock <= 5
              : product.stock <= 0);
        return (
          matchesSearch &&
          (!status || product.status === status) &&
          (!category || product.category === category) &&
          (!brand || product.brand === brand) &&
          matchesStock &&
          price >= low &&
          price <= high
        );
      })
      .sort((left, right) => {
        if (sort === "name") return left.name.localeCompare(right.name);
        if (sort === "oldest")
          return (
            new Date(left.createdAt || 0).getTime() -
            new Date(right.createdAt || 0).getTime()
          );
        if (sort === "price_low")
          return (
            Number(left.salePrice ?? left.basePrice) -
            Number(right.salePrice ?? right.basePrice)
          );
        if (sort === "price_high")
          return (
            Number(right.salePrice ?? right.basePrice) -
            Number(left.salePrice ?? left.basePrice)
          );
        if (sort === "sales")
          return Number(right.sales || 0) - Number(left.sales || 0);
        return (
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
        );
      });
  }, [
    products,
    search,
    status,
    category,
    brand,
    stock,
    minPrice,
    maxPrice,
    sort,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const visibleIds = visibleProducts.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const updateProduct = async (
    product: WarehouseProduct,
    payload: Record<string, unknown>,
  ) => {
    setWorking(true);
    setError("");
    try {
      if (payload._delete) await deleteSellerProduct(product.id);
      else await updateSellerProduct(product.id, payload);
      setMessage("Product updated successfully.");
      await loadProducts();
    } catch (actionError: any) {
      setError(
        actionError?.response?.data?.message ||
          actionError?.message ||
          "Unable to update product.",
      );
    } finally {
      setWorking(false);
    }
  };

  const runBulk = async (
    action: "activate" | "deactivate" | "delete" | "stock",
  ) => {
    if (!selected.length || working) return;
    let stockValue: number | undefined;
    if (action === "delete") {
      setError(
        "Delete products one at a time so each destructive action can be confirmed safely.",
      );
      return;
    }
    if (action === "stock") {
      const input = window.prompt(
        "Enter the new stock quantity for the selected products.",
      );
      if (input === null || !/^\d+$/.test(input)) return;
      stockValue = Number(input);
    }
    setWorking(true);
    setError("");
    try {
      await bulkUpdateSellerProducts({
        ids: selected,
        action,
        stock: stockValue,
      });
      setMessage(`${selected.length} product(s) updated.`);
      await loadProducts();
    } catch (actionError: any) {
      setError(
        actionError?.response?.data?.message ||
          actionError?.message ||
          "Bulk action failed.",
      );
    } finally {
      setWorking(false);
    }
  };

  const exportProducts = () => {
    const header = [
      "Name",
      "SKU",
      "Category",
      "Brand",
      "Price",
      "Sale Price",
      "Stock",
      "Status",
      "Sales",
      "Rating",
      "Created Date",
    ];
    const rows = filteredProducts.map((product) => [
      product.name,
      product.sku,
      product.category || "",
      product.brand || "",
      product.basePrice,
      product.salePrice ?? "",
      product.stock,
      product.status,
      product.sales || 0,
      product.rating || 0,
      product.createdAt || "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).split('"').join('""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "seller-products.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SellerLayout
      title="Products"
      subtitle="Manage your seller catalog, inventory, and product visibility."
      actions={
        <button
          type="button"
          onClick={() => navigate("/seller/products/create")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2d80d8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6dc5]"
        >
          <Plus size={15} /> Add Product
        </button>
      }
    >
      <div className="space-y-5">
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.7fr)_repeat(4,minmax(130px,1fr))]">
            <label className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, SKU, brand..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2d80d8] focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All categories</option>
              {options.categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">All brands</option>
              {options.brands.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={stock}
              onChange={(event) => setStock(event.target.value as StockFilter)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">Any stock</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <label className="text-xs text-slate-500">
              Price from{" "}
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="ml-1 w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs text-slate-500">
              to{" "}
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="ml-1 w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
              />
            </label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="price_low">Price low-high</option>
              <option value="price_high">Price high-low</option>
              <option value="sales">Best selling</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setCategory("");
                setBrand("");
                setStock("");
                setMinPrice("");
                setMaxPrice("");
                setSort("newest");
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="product-catalog-surface rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? "" : "s"}
              </span>
              {selected.length ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {selected.length} selected
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!selected.length || working}
                onClick={() => void runBulk("activate")}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-40"
              >
                Activate selected
              </button>
              <button
                type="button"
                disabled={!selected.length || working}
                onClick={() => void runBulk("deactivate")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
              >
                Deactivate selected
              </button>
              <button
                type="button"
                disabled={!selected.length || working}
                onClick={() => void runBulk("stock")}
                className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 disabled:opacity-40"
              >
                Update stock
              </button>
              <button
                type="button"
                disabled={!selected.length || working}
                onClick={() => void runBulk("delete")}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"
              >
                Delete selected
              </button>
              <button
                type="button"
                onClick={exportProducts}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <Download size={14} /> Export
              </button>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : !visibleProducts.length ? (
            <div className="p-14 text-center">
              <Package className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-medium text-slate-600">
                {products.length
                  ? "No products match the current filters."
                  : "No products found"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {products.length
                  ? "Try clearing a filter or changing your search."
                  : "The seller catalog has no records."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select visible products"
                        checked={allVisibleSelected}
                        onChange={() =>
                          setSelected((current) =>
                            allVisibleSelected
                              ? current.filter((id) => !visibleIds.includes(id))
                              : [...new Set([...current, ...visibleIds])],
                          )
                        }
                      />
                    </th>
                    {[
                      "Product",
                      "SKU",
                      "Category",
                      "Price",
                      "Discount",
                      "Stock",
                      "Status",
                      "Sales",
                      "Rating",
                      "Created",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const price = Number(product.basePrice || 0);
                    const salePrice = Number(
                      product.salePrice ?? product.basePrice,
                    );
                    const discount =
                      product.discount ??
                      (price > salePrice
                        ? Math.round((1 - salePrice / price) * 100)
                        : 0);
                    return (
                      <tr
                        key={product.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${product.name}`}
                            checked={selected.includes(product.id)}
                            onChange={() =>
                              setSelected((current) =>
                                current.includes(product.id)
                                  ? current.filter((id) => id !== product.id)
                                  : [...current, product.id],
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex min-w-[220px] items-center gap-3">
                            {product.thumbnail || product.images?.[0] ? <img src={product.thumbnail || product.images?.[0] || undefined} alt={product.name} loading="lazy" decoding="async" className="h-11 w-11 rounded-lg border border-slate-200 object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400"><ImageOff size={16} /></span>}
                            <div>
                              <div className="font-semibold text-slate-800">
                                {product.name}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {product.subcategory || "Catalog product"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">
                          {product.sku}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {product.category || "—"}
                          <div className="text-xs text-slate-400">
                            {product.brand || ""}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {money.format(salePrice)}
                          {salePrice !== price ? (
                            <div className="text-xs font-normal text-slate-400 line-through">
                              {money.format(price)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          {discount ? (
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                              -{discount}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td
                          className={`px-3 py-3 font-semibold ${stockTone(product.stock)}`}
                        >
                          {product.stock}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusTone(product.status)}`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {product.sales || 0}
                        </td>
                        <td className="px-3 py-3 text-amber-500">
                          {product.rating
                            ? `${product.rating.toFixed(1)} ★`
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                          {product.createdAt
                            ? new Date(product.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="View product"
                              onClick={() =>
                                navigate(`/seller/products/${product.id}/edit`)
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              title="Edit product"
                              onClick={() =>
                                navigate(`/seller/products/${product.id}/edit`)
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              title={
                                product.status === "ACTIVE"
                                  ? "Deactivate product"
                                  : "Activate product"
                              }
                              disabled={working}
                              onClick={() =>
                                void updateProduct(product, {
                                  status:
                                    product.status === "ACTIVE"
                                      ? "INACTIVE"
                                      : "ACTIVE",
                                })
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Power size={15} />
                            </button>
                            <button
                              type="button"
                              title="Delete product"
                              disabled={working}
                              onClick={() =>
                                window.confirm("Delete this product?") &&
                                void updateProduct(product, { _delete: true })
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                            <MoreHorizontal
                              size={16}
                              className="text-slate-300"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && visibleProducts.length ? (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
              <span>
                Page {page} of {pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
        {!loading && visibleProducts.length ? (
          <section
            aria-label="Product cards"
            className="grid gap-4 sm:grid-cols-2 lg:hidden"
          >
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selected.includes(product.id)}
                working={working}
                onSelect={() =>
                  setSelected((current) =>
                    current.includes(product.id)
                      ? current.filter((id) => id !== product.id)
                      : [...current, product.id],
                  )
                }
                onView={() => navigate(`/seller/products/${product.id}/edit`)}
                onEdit={() => navigate(`/seller/products/${product.id}/edit`)}
                onDelete={() => setDeleteTarget(product)}
              />
            ))}
          </section>
        ) : null}
        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete product?"
          description={
            deleteTarget
              ? `This will remove ${deleteTarget.name} from your seller catalog.`
              : ""
          }
          confirmLabel="Delete product"
          loading={working}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              const product = deleteTarget;
              setDeleteTarget(null);
              void updateProduct(product, { _delete: true });
            }
          }}
        />
      </div>
    </SellerLayout>
  );
}

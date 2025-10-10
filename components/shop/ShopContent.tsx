"use client";

import ProductCard from "@/components/shop/ProductCard";
import products from "@/data/products.json";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ShopContent() {
  const searchParams = useSearchParams();
  const categoryFromURL = searchParams.get("category") || "all";

  const [filters, setFilters] = useState({
    category: categoryFromURL,
    sort: "default",
  });

  useEffect(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      category: categoryFromURL,
    }));
  }, [categoryFromURL]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredProducts = products
    .filter((product) =>
      filters.category === "all" ? true : product.category === filters.category
    )
    .sort((a, b) => {
      if (filters.sort === "price_asc") return a.price - b.price;
      if (filters.sort === "price_desc") return b.price - a.price;
      return a.id - b.id;
    });

  return (
    <div className="container mx-auto px-6 py-10 mb-12 rounded-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Our Products</h2>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center mb-10">
        <div className="w-full md:w-auto">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1 md:mb-1 md:mr-2"
          >
            Filter by Category
          </label>
          <select
            name="category"
            id="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm text-sm"
          >
            <option value="all">All</option>
            <option value="Tech">Tech</option>
            <option value="Fashion">Fashion</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div className="w-full md:w-auto">
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700 mb-1 md:mb-1 md:mr-2"
          >
            Sort by
          </label>
          <select
            name="sort"
            id="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm text-sm"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

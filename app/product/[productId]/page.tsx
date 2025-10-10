"use client";
import ProductGallery from "@/components/product/ProductGallery";
import { useCart } from "@/context/CartContext";
import products from "@/data/products.json";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";

export default function Product() {
  const { addToCart } = useCart();
  const { productId } = useParams();

  const product = products.find((p) => p.id === parseInt(productId as string));

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    redirect("/cart");
  };

  return (
    <div className="container mx-auto p-6">
      <Link
        href="/shop"
        className="text-gray-600 hover:text-black text-sm font-medium flex items-center gap-1 mb-4"
      >
        ← Return to Shop
      </Link>

      <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 shadow-lg rounded-xl p-8">
        <ProductGallery images={product.images} />

        <div className="w-full md:w-1/2 flex flex-col">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {product.name}
          </h1>
          <p className="text-lg text-gray-600 mb-6">{product.description}</p>

          <p className="text-2xl font-semibold text-black mb-6">
            ${product.price}
          </p>

          <button
            className="px-6 py-3 bg-black cursor-pointer hover:bg-gray-900 text-white text-lg font-medium rounded-lg transition-all duration-200"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  image: string;
  name: string;
  price: number;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow transition-transform duration-300 transform hover:scale-101">
      <Link href={`/product/${product.id}`}>
        <div className="cursor-pointer">
          <Image
            src={product.image}
            alt={product.name}
            className="w-full h-100 object-cover"
            width={500}
            height={500}
          />
          <div className="p-4">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-600">${product.price.toFixed(2)}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

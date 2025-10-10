import Image from "next/image";
import Link from "next/link";

export default function BestSellersSection() {
  return (
    <section className="mt-8 m-4 p-8 rounded-xl">
      <h2 className="text-2xl font-semibold mb-4">Best Sellers</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 bg-white rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105">
          <Link href={`/product/1`}>
            <div className="overflow-hidden rounded-lg">
              {" "}
              <Image
                src="/images/products/backpack.jpg"
                alt="backpack image"
                width={500}
                height={500}
                className="rounded-lg w-full h-100 object-cover transition-transform duration-300 transform hover:scale-110"
              />
            </div>
            <h3 className="mt-2 text-lg font-medium">Modern Backpack</h3>
            <p className="text-gray-600">$49.99</p>
          </Link>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105">
          <Link href={`/product/5`}>
            <div className="overflow-hidden rounded-lg">
              {" "}
              <Image
                src="/images/products/shoes.jpg"
                alt="shoes image"
                width={500}
                height={500}
                className="rounded-lg w-full h-100 object-cover transition-transform duration-300 transform hover:scale-110"
              />
            </div>
            <h3 className="mt-2 text-lg font-medium">Running Shoes</h3>
            <p className="text-gray-600">$99.99</p>
          </Link>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105">
          <Link href={`/product/2`}>
            <div className="overflow-hidden rounded-lg">
              {" "}
              <Image
                src="/images/products/smartwatch.jpg"
                alt="smartwatch image"
                width={500}
                height={500}
                className="rounded-lg w-full h-100 object-cover transition-transform duration-300 transform hover:scale-110"
              />
            </div>
            <h3 className="mt-2 text-lg font-medium">Smart Watch</h3>
            <p className="text-gray-600">$129.99</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

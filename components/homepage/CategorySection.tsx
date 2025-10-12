import Image from "next/image";
import Link from "next/link";

export default function CategorySection() {
  return (
    <section className="mt-8 m-4 p-8 rounded-xl">
      <h1 className="text-4xl font-bold text-gray-800 text-center mb-12">
        Vehículos
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="relative rounded-lg shadow-md transition-transform duration-300 transform hover:scale-101">
          <Link href={`/shop?category=${encodeURIComponent("Tech")}`}>
            <div className="overflow-hidden rounded-lg relative">
              <Image
                src="/images/main/CategorySection/new.jpg"
                alt="Tech Image"
                width={500}
                height={500}
                className="w-full h-100 object-cover"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <span className="text-white text-3xl font-semibold mb-2">
                  Nuevos
                </span>

                <button className="px-4 py-2 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-200 transition cursor-pointer">
                  Visitar catálogo
                </button>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative rounded-lg shadow-md transition-transform duration-300 transform hover:scale-101">
          <Link href={`/shop?category=${encodeURIComponent("Fashion")}`}>
            <div className="overflow-hidden rounded-lg relative">
              <Image
                src="/images/main/CategorySection/trato.jpg"
                alt="Fashion Image"
                width={500}
                height={500}
                className="w-full h-100 object-cover"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <span className="text-white text-3xl font-semibold mb-2">
                  Usados
                </span>

                <button className="px-4 py-2 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-200 transition cursor-pointer">
                  Visitar catálogo
                </button>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative rounded-lg shadow-md transition-transform duration-300 transform hover:scale-101">
          <Link href="/comparativa">
            <div className="overflow-hidden rounded-lg relative">
              <Image
                src="/images/main/CategorySection/comparativa.jpg"
                alt="Accessories Image"
                width={500}
                height={500}
                className="w-full h-100 object-cover"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <span className="text-white text-3xl font-semibold mb-2">
                  Comparativa
                </span>

                <button className="px-4 py-2 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-200 transition cursor-pointer">
                  Comparar
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

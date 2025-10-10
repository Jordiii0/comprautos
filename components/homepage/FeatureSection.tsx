import Image from "next/image";

export default function FeatureSection() {
  return (
    <section className="mt-4 m-4 p-8 bg-white rounded-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="overflow-hidden">
          <Image
            src="/images/main/phone.jpg"
            alt="Service 1"
            width={1000}
            height={1000}
            className="w-full h-150 object-cover rounded-lg"
          />
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Download Our App</h3>
            <p className="text-gray-600 mb-4">
              Get the best experience on your mobile device. Download our app
              now !
            </p>
            <a
              href=""
              className="inline-block px-6 py-2 bg-black text-white rounded-lg transition-transform duration-300 transform hover:scale-102"
            >
              Download Now
            </a>
          </div>
        </div>

        <div className="overflow-hidden">
          <Image
            src="/images/main/shop.jpg"
            alt="Service 2"
            width={1000}
            height={1000}
            className="w-full h-150 object-cover rounded-lg"
          />
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Explore Our Products</h3>
            <p className="text-gray-600 mb-4">
              Discover our exclusive collection of high-quality products.
            </p>
            <a
              href="/shop"
              className="inline-block px-6 py-2 bg-black text-white rounded-lg transition-transform duration-300 transform hover:scale-102"
            >
              Shop Now
            </a>
          </div>
        </div>

        <div className="overflow-hidden">
          <Image
            src="/images/main/contact.jpg"
            alt="Service 3"
            width={1000}
            height={1000}
            className="w-full h-150 object-cover rounded-lg"
          />
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              We&apos;re here to help. Reach out to us for any questions or
              support.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-2 bg-black text-white rounded-lg transition-transform duration-300 transform hover:scale-102"
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="overflow-hidden">
          <Image
            src="/images/main/team.jpg"
            alt="Service 4"
            width={1000}
            height={1000}
            className="w-full h-150 object-cover rounded-lg"
          />
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">About Us</h3>
            <p className="text-gray-600 mb-4">
              Learn more about our mission, our team, and what drives us.
            </p>
            <a
              href="/about"
              className="inline-block px-6 py-2 bg-black text-white rounded-lg transition-transform duration-300 transform hover:scale-102"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

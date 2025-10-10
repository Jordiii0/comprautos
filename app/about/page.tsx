import Image from "next/image";

export default function AboutUs() {
  return (
    <div className="bg-white py-12">
      <div className="mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We are a passionate team dedicated to providing high-quality
            products and exceptional customer service. Our mission is to make
            your shopping experience seamless and enjoyable.
          </p>
        </div>

        <section className="relative w-full bg-[url(/images/about/team.jpg)] bg-cover bg-center bg-no-repeat">
          <div className="relative flex items-center justify-end h-screen px-6 sm:px-12 lg:px-24">
            <div className="max-w-xl p-8 rounded-lg text-white">
              <h1 className="text-3xl font-extrabold sm:text-5xl">Our Story</h1>

              <p className="mt-4 sm:text-xl">
                Founded in 2023, Bloom started as a small online store with a
                big dream: to revolutionize the way people shop for fashion and
                tech accessories.
              </p>

              <p className="mt-4 sm:text-xl">
                Our journey has been fueled by our love for innovation and our
                desire to create a community of happy customers.
              </p>
            </div>
          </div>
        </section>

        <section className="relative w-full bg-[url(/images/about/work.jpg)] bg-cover bg-center bg-no-repeat">
          <div className="absolute inset-0 bg-gray-900/75 sm:bg-transparent sm:from-gray-900/95 sm:to-gray-900/25 ltr:sm:bg-gradient-to-r rtl:sm:bg-gradient-to-l"></div>
          <div className="relative flex items-center justify-start h-screen px-6 sm:px-12 lg:px-24">
            <div className="max-w-xl p-8 rounded-lg text-white">
              <h1 className="text-3xl font-extrabold sm:text-5xl">
                Our Mission
              </h1>

              <p className="mt-4 sm:text-xl">
                At Bloom, our mission is simple: to provide you with the best
                products at the best prices, while delivering an unparalleled
                shopping experience. We carefully select every item in our store
                to ensure it meets our high standards of quality and style.
              </p>

              <p className="mt-4 sm:text-xl">
                We are committed to sustainability and ethical practices. From
                our supply chain to our packaging, we strive to minimize our
                environmental impact and support fair labor practices.
              </p>
            </div>
          </div>
        </section>

        <div className="mb-16 m-8">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Image
                src="/images/team/ceo.jpg"
                alt="Team Member 1"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">John Doe</h3>
              <p className="text-gray-600">CEO & Founder</p>
            </div>

            <div className="text-center">
              <Image
                src="/images/team/marketing.jpg"
                alt="Team Member 2"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">
                Jane Smith
              </h3>
              <p className="text-gray-600">Head of Marketing</p>
            </div>

            <div className="text-center">
              <Image
                src="/images/team/dev.jpg"
                alt="Team Member 3"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">
                Mike Johnson
              </h3>
              <p className="text-gray-600">Lead Developer</p>
            </div>

            <div className="text-center">
              <Image
                src="/images/team/support.jpg"
                alt="Team Member 4"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">Sarah Lee</h3>
              <p className="text-gray-600">Customer Support</p>
            </div>
          </div>
        </div>

        <div className="text-center mx-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Quality
              </h3>
              <p className="text-gray-600">
                We are committed to offering only the best products, carefully
                curated to meet your needs.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sustainability
              </h3>
              <p className="text-gray-600">
                We prioritize eco-friendly practices and sustainable sourcing in
                everything we do.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Customer Focus
              </h3>
              <p className="text-gray-600">
                Your satisfaction is our top priority. We go above and beyond to
                ensure you have a great experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

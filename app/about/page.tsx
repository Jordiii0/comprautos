import Image from "next/image";

export default function AboutUs() {
  return (
    <div className="bg-white py-12">
      <div className="mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sobre Nosotros</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
           En carNETwork: La Mejor Asesoría en Automóviles, nos apasiona ayudarte a encontrar el vehículo ideal para tus necesidades. Somos una plataforma dedicada a centralizar y comparar la oferta automotriz de distintos concesionarios y vendedores del país, brindándote información clara, actualizada y confiable para tomar la mejor decisión de compra.
          </p>
        </div>

        <section className="relative w-full bg-[url(/images/about/team.jpg)] bg-cover bg-center bg-no-repeat">
          <div className="relative flex items-center justify-end h-screen px-6 sm:px-12 lg:px-24">
            <div className="max-w-xl p-8 rounded-lg text-white">
              <h1 className="text-3xl font-extrabold sm:text-5xl">Nuestra Historia</h1>

              <p className="mt-4 sm:text-xl">
                carNETwork nació con el propósito de simplificar la búsqueda y compra de automóviles. Detectamos la necesidad de una plataforma que reuniera en un solo lugar la oferta de distintos concesionarios y vendedores, permitiendo comparar precios, modelos y condiciones de forma clara y segura.

              </p>

              <p className="mt-4 sm:text-xl">
                Desde entonces, trabajamos para ofrecer una experiencia confiable, transparente y moderna, ayudando a cada persona a encontrar el vehículo ideal según sus necesidades.
              </p>
            </div>
          </div>
        </section>

        <section className="relative w-full bg-[url(/images/about/work.jpg)] bg-cover bg-center bg-no-repeat">
          <div className="absolute inset-0 bg-gray-900/75 sm:bg-transparent sm:from-gray-900/95 sm:to-gray-900/25 ltr:sm:bg-gradient-to-r rtl:sm:bg-gradient-to-l"></div>
          <div className="relative flex items-center justify-start h-screen px-6 sm:px-12 lg:px-24">
            <div className="max-w-xl p-8 rounded-lg text-white">
              <h1 className="text-3xl font-extrabold sm:text-5xl">
                Nuestra Misión
              </h1>

              <p className="mt-4 sm:text-xl">
                Nuestra misión es facilitar la elección del vehículo perfecto para cada persona, ofreciendo una plataforma digital confiable que centraliza, compara y asesora en la compra de automóviles nuevos y usados en todo el país.
              </p>

              <p className="mt-4 sm:text-xl">
                Buscamos simplificar el proceso de búsqueda y decisión, brindando información transparente, actualizada y objetiva, que permita a nuestros usuarios ahorrar tiempo, dinero y esfuerzo, asegurando siempre una experiencia de compra segura y satisfactoria.
              </p>
            </div>
          </div>
        </section>

        <div className="mb-16 m-8">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
            EL EQUIPO
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Image
                src="/images/team/javier.jpg"
                alt="Team Member 1"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">Javier Veloso</h3>
              <p className="text-gray-600">CEO & Founder</p>
            </div>

            <div className="text-center">
              <Image
                src="/images/team/tomas.jpg"
                alt="Team Member 2"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">
                Tomás Mariscal
              </h3>
              <p className="text-gray-600">Head of Marketing</p>
            </div>

            <div className="text-center">
              <Image
                src="/images/team/matias.jpg"
                alt="Team Member 3"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">
                Matías Pardo
              </h3>
              <p className="text-gray-600">Lead Developer</p>
            </div>

            <div className="text-center">
              <Image
                src="/images/team/felipe.jpg"
                alt="Team Member 4"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                width={300}
                height={300}
              />
              <h3 className="text-xl font-semibold text-gray-900">Felipe Catalán</h3>
              <p className="text-gray-600">Customer Support</p>
            </div>
          </div>
        </div>

        <div className="text-center mx-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Calidad
              </h3>
              <p className="text-gray-600">
                Nos comprometemos a ofrecer información precisa, actualizada y confiable, garantizando una experiencia de comparación y compra de vehículos con los más altos estándares de excelencia.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sustentabilidad
              </h3>
              <p className="text-gray-600">
                Promovemos prácticas responsables y sostenibles dentro del sector automotriz, fomentando la elección de vehículos eficientes y el uso de tecnologías que contribuyan al cuidado del medio ambiente.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Enfoque al Cliente
              </h3>
              <p className="text-gray-600">
                Nuestros usuarios son el centro de todo lo que hacemos. Escuchamos sus necesidades y trabajamos constantemente para brindar un servicio cercano, transparente y orientado a su satisfacción.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

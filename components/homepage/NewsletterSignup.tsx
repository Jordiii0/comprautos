export default function NewsletterSignup() {
  return (
    <section className="mt-12 text-center py-12 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Mantente actualizado</h2>
      <p className="text-gray-600">
        Suscribete a nuestro boletín de correo para enterarte de novedades.
      </p>
      <div className="mt-4 flex justify-center">
        <input
          type="email"
          placeholder="Ingresa tu email"
          className="p-3 border rounded-l-lg"
        />
        <button className="px-6 py-3 bg-black text-white rounded-r-lg cursor-pointer">
          Suscribirse
        </button>
      </div>
    </section>
  );
}

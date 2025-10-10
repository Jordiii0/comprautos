export default function NewsletterSignup() {
  return (
    <section className="mt-12 text-center py-12 bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Stay Updated</h2>
      <p className="text-gray-600">
        Subscribe to our newsletter for the latest offers.
      </p>
      <div className="mt-4 flex justify-center">
        <input
          type="email"
          placeholder="Enter your email"
          className="p-3 border rounded-l-lg"
        />
        <button className="px-6 py-3 bg-black text-white rounded-r-lg cursor-pointer">
          Subscribe
        </button>
      </div>
    </section>
  );
}

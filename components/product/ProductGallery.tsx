"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="w-full max-w-[500px] mx-auto flex flex-col items-center px-4">
      <div className="rounded-xl shadow-lg overflow-hidden mb-4 w-full">
        <Image
          src={selectedImage}
          alt="Selected product"
          width={600}
          height={600}
          className="rounded-xl object-cover w-full h-auto max-h-[500px]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(img)}
            className={`border-2 ${
              selectedImage === img ? "border-black" : "border-transparent"
            } rounded-md cursor-pointer`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${index + 1}`}
              width={60}
              height={60}
              className="object-cover rounded-md w-[60px] h-[60px] transition-transform transform hover:scale-101"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

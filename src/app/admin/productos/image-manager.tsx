import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IMAGE_ACCEPT } from "@/lib/catalog/images";
import { deleteImage, uploadImage } from "./actions";

export type ProductImage = { id: string; url: string };

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <p className="text-sm text-ink-muted">Este producto no tiene fotos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li
              key={image.id}
              className="flex flex-col gap-2 rounded-lg border border-rule bg-surface p-2"
            >
              {/* Public bucket URL on the Supabase host: no optimizer needed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-md bg-surface-2 object-cover"
              />
              <form action={deleteImage}>
                <input type="hidden" name="product_id" value={productId} />
                <input type="hidden" name="image_id" value={image.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  className="w-full"
                >
                  Eliminar
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        action={uploadImage}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="product_id" value={productId} />
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="file">Agregar foto</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept={IMAGE_ACCEPT}
            required
            className="min-h-11 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-ink file:mr-3 file:font-semibold"
          />
          <p className="text-sm text-ink-muted">JPG, PNG o WebP, hasta 5 MB.</p>
        </div>
        <Button type="submit" variant="outline">
          <ImagePlus aria-hidden="true" />
          Subir foto
        </Button>
      </form>
    </div>
  );
}

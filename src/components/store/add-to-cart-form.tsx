import { addToCart } from "@/app/tienda/carrito/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Quantity + "Agregar". A plain form posting to a server action, so it works
 * without JavaScript. `returnTo` is where the buyer lands afterwards.
 */
export function AddToCartForm({
  productId,
  sku,
  returnTo,
  orderable,
  className,
}: {
  productId: string;
  sku: string;
  returnTo: string;
  /** False when the product has no stock or no price to order against. */
  orderable: boolean;
  className?: string;
}) {
  if (!orderable) {
    return (
      <p className={cn("text-sm font-semibold text-ink-muted", className)}>
        No disponible para pedir
      </p>
    );
  }
  const inputId = `qty-${productId}`;
  return (
    <form action={addToCart} className={cn("flex items-end gap-2", className)}>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm text-ink-muted">
          Cantidad<span className="sr-only"> de {sku}</span>
        </label>
        <Input
          id={inputId}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={9999}
          step={1}
          defaultValue={1}
          required
          className="w-20 tabular-nums"
        />
      </div>
      <Button type="submit">Agregar</Button>
    </form>
  );
}

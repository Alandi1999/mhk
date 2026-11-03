import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

export function LogoutButton({
  variant = "outline",
}: {
  variant?: "outline" | "inverse";
}) {
  return (
    <form action={logout}>
      <Button type="submit" variant={variant}>
        Cerrar sesión
      </Button>
    </form>
  );
}

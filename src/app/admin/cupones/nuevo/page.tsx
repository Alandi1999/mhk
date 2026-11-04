import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/shell/page-container";
import { requireProfile } from "@/lib/auth/session";
import { CouponForm } from "../coupon-form";

export const metadata: Metadata = {
  title: "Nuevo cupón | MHK Moto Repuestos",
};

export default async function NewCouponPage() {
  await requireProfile({ role: "admin" });
  return (
    <PageContainer title="Nuevo cupón" width="narrow">
      <Link
        href="/admin/cupones"
        className="-mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-ink underline underline-offset-4"
      >
        Volver a cupones
      </Link>
      <CouponForm
        initial={{
          code: "",
          discount: "",
          min_order: "",
          max_uses: "",
          starts_at: "",
          ends_at: "",
        }}
      />
    </PageContainer>
  );
}

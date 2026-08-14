import { CapsuleDetail } from "./capsule-detail";

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CapsuleDetail id={id} />;
}

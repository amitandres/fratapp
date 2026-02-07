import { redirect } from "next/navigation";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params?.code;

  if (!code) {
    redirect("/");
  }

  redirect(`/signup?code=${encodeURIComponent(code)}`);
}

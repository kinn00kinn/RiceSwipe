import { createServerComponentClient } from "@/lib/supabase/utils";
import { redirect } from "next/navigation";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createServerComponentClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return <PageClient user={user} />;
}

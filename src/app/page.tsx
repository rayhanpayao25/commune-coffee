import { LandingPage } from "@/components/LandingPage";
import { getStore } from "@/lib/store";

export default async function Home() {
  const store = await getStore();
  return <LandingPage menu={store.menu} />;
}


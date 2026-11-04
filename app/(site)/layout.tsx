import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/** Public site chrome. The admin (/admin) has its own layout. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}

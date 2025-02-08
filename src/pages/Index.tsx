
import { ThemeToggle } from "@/components/ThemeToggle";
import { CrawlForm } from "@/components/CrawlForm";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      <ThemeToggle />
      
      <main className="container max-w-7xl mx-auto px-4 py-16 space-y-16">
        <section className="space-y-4 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary">
            Compare Prices Instantly
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Find the Best Deals
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter a product URL to compare prices across multiple stores and find the best deals available.
          </p>
        </section>

        <div className="max-w-2xl mx-auto glass rounded-xl p-6 animate-fade-in">
          <CrawlForm />
        </div>
      </main>
    </div>
  );
};

export default Index;


import { CrawlForm } from "@/components/CrawlForm";
import { ChatSupport } from "@/components/ChatSupport";
import { Button } from "@/components/ui/button";
import { BarChart3, Globe, Search, Zap, Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.2),transparent_50%)]">
      <div className="container flex justify-between items-center py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-float" />
          <h1 className="text-2xl font-bold text-gradient">CumPair</h1>
        </div>
      </div>
      
      <main className="space-y-32 py-12">
        {/* Hero Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-16">
          <div className="space-y-6 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary">
              Compare Prices Like Never Before
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gradient">
              Find the Best Deals
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enter a product URL, name, or scan its barcode to compare prices across multiple stores and find the best deals available instantly.
            </p>
          </div>

          <div className="max-w-2xl mx-auto glass rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20">
            <CrawlForm />
          </div>
        </section>

        {/* Features Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gradient">Why Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get the best deals with our powerful price comparison tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-8 h-8" />,
                title: "Smart Search",
                description: "Find products across multiple stores instantly"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Price History",
                description: "Track price changes over time to make informed decisions"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Global Coverage",
                description: "Compare prices from stores worldwide"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="card-gradient p-8 rounded-2xl space-y-6 hover:scale-105 transition-transform duration-300"
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-accent/5 -skew-y-3" />
          <div className="container max-w-7xl mx-auto px-4 py-32 space-y-16 relative">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gradient">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Finding the best deals has never been easier
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  step: "1",
                  title: "Enter Details",
                  description: "Enter URL, name, or scan barcode"
                },
                {
                  step: "2",
                  title: "Compare Prices",
                  description: "We search multiple stores for the best deals"
                },
                {
                  step: "3",
                  title: "Save Money",
                  description: "Choose the best price and save instantly"
                }
              ].map((step, index) => (
                <div 
                  key={index}
                  className="text-center space-y-6 animate-hover"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16">
          <div className="glass p-16 rounded-3xl text-center space-y-8">
            <h2 className="text-4xl font-bold text-gradient">Start Saving Today</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of smart shoppers who save money every day using our price comparison tool.
            </p>
            <Button 
              size="lg"
              className="animate-hover group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Zap className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Compare Prices Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>
      </main>

      {/* AI Chat Support */}
      <ChatSupport />
    </div>
  );
};

export default Index;

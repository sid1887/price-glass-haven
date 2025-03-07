
import { CrawlForm } from "@/components/CrawlForm";
import { ChatSupport } from "@/components/ChatSupport";
import { Button } from "@/components/ui/button";
import { CountrySelector } from "@/components/CountrySelector";
import { BarChart3, Globe, Search, Zap, Sparkles, ArrowRight, Music, Flame, Star, Scan } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  // Initialize the global countries array for use across the app
  useEffect(() => {
    // This is a simplified approach - in a larger app we would use context
    import('@/components/CountrySelector').then(module => {
      window.COUNTRIES = module.COUNTRIES;
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden relative">
      {/* Noise texture overlay */}
      <div className="fixed inset-0 w-full h-full noise-bg pointer-events-none"></div>
      
      <div className="container flex justify-between items-center py-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-6 w-6 text-primary animate-float" />
            <div className="absolute inset-0 animate-glow blur-md opacity-70"></div>
          </div>
          <h1 className="text-2xl font-bold text-gradient">CumPair</h1>
        </div>
        
        {/* Add Country Selector here */}
        <div className="flex items-center gap-4">
          <CountrySelector />
        </div>
      </div>
      
      <main className="space-y-32 py-4 relative z-10">
        {/* Hero Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-16">
          <div className="space-y-6 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/20 text-primary backdrop-blur-sm border border-primary/20 animate-pulse-subtle">
              <Flame className="w-4 h-4 mr-2" />
              AI-Powered Price Comparison
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gradient">
              Find the Best Deals
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enter a product URL, name, or scan its barcode to compare prices across multiple stores with AI-enhanced search.
            </p>
          </div>

          <div className="max-w-2xl mx-auto glass rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 neo-glow">
            <CrawlForm />
          </div>
        </section>

        {/* Features Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gradient">Why Choose Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get the best deals with our powerful AI-enhanced price comparison tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-8 h-8" />,
                title: "AI Smart Search",
                description: "Gemini AI helps find products across multiple stores instantly",
                color: "from-purple-600/20 to-pink-500/20"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Price History",
                description: "Track price changes over time to make informed decisions",
                color: "from-cyan-600/20 to-blue-500/20"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Global Coverage",
                description: "Compare prices from stores worldwide in your local currency",
                color: "from-green-500/20 to-emerald-600/20"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`card-gradient p-8 rounded-2xl space-y-6 hover:scale-105 transition-transform duration-300 backdrop-blur-md border border-white/10`}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-primary`}>
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 -skew-y-3"></div>
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
                  icon: <Scan className="w-6 h-6" />,
                  title: "Enter Details",
                  description: "Enter URL, name, or scan barcode"
                },
                {
                  step: "2",
                  icon: <Star className="w-6 h-6" />,
                  title: "Compare Prices",
                  description: "We search multiple stores for the best deals"
                },
                {
                  step: "3",
                  icon: <Zap className="w-6 h-6" />,
                  title: "Save Money",
                  description: "Choose the best price and save instantly"
                }
              ].map((step, index) => (
                <div 
                  key={index}
                  className="text-center space-y-6 animate-hover"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto relative group">
                    <span className="absolute inset-0 rounded-full animate-glow opacity-70 blur-sm group-hover:opacity-100"></span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-primary">{step.step}</span>
                      {step.icon}
                    </div>
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
          <div className="glass p-16 rounded-3xl text-center space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-accent/10"></div>
            <h2 className="text-4xl font-bold text-gradient relative z-10">Start Saving Today</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto relative z-10">
              Join thousands of smart shoppers who save money every day using our price comparison tool.
            </p>
            <Button 
              size="lg"
              className="animate-hover group relative z-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-none"
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

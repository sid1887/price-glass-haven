
import { ThemeToggle } from "@/components/ThemeToggle";
import { CrawlForm } from "@/components/CrawlForm";
import { Button } from "@/components/ui/button";
import { BarChart3, Globe, Search, Zap, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <div className="container flex justify-between items-center py-4">
        <ThemeToggle />
        <Button variant="outline" onClick={() => navigate("/auth")}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </div>
      
      <main className="space-y-24">
        {/* Hero Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-16">
          <div className="space-y-4 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary">
              Compare Prices Instantly
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Find the Best Deals
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter a product URL to compare prices across multiple stores and find the best deals available.
            </p>
          </div>

          <div className="max-w-2xl mx-auto glass rounded-xl p-6 animate-fade-in">
            <CrawlForm />
          </div>
        </section>

        {/* Features Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Why Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get the best deals with our powerful price comparison tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-6 h-6" />,
                title: "Smart Search",
                description: "Find products across multiple stores instantly"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Price History",
                description: "Track price changes over time to make informed decisions"
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Global Coverage",
                description: "Compare prices from stores worldwide"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="glass p-6 rounded-xl space-y-4 hover:scale-105 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16 space-y-12 bg-muted/50">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Finding the best deals has never been easier
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Enter URL",
                description: "Paste the product URL you want to compare"
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
                className="text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container max-w-7xl mx-auto px-4 py-16">
          <div className="glass p-12 rounded-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold">Start Saving Today</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of smart shoppers who save money every day using our price comparison tool.
            </p>
            <Button 
              size="lg"
              className="animate-fade-in"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Zap className="mr-2 h-4 w-4" />
              Compare Prices Now
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;

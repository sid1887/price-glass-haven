
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, Check } from "lucide-react";
import { toast } from "sonner";

export interface Country {
  name: string;
  code: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: "United States", code: "US", currency: { code: "USD", symbol: "$", name: "US Dollar" }, flag: "🇺🇸" },
  { name: "China", code: "CN", currency: { code: "CNY", symbol: "¥", name: "Chinese Yuan" }, flag: "🇨🇳" },
  { name: "Japan", code: "JP", currency: { code: "JPY", symbol: "¥", name: "Japanese Yen" }, flag: "🇯🇵" },
  { name: "Germany", code: "DE", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇩🇪" },
  { name: "India", code: "IN", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, flag: "🇮🇳" },
  { name: "United Kingdom", code: "GB", currency: { code: "GBP", symbol: "£", name: "British Pound" }, flag: "🇬🇧" },
  { name: "France", code: "FR", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇫🇷" },
  { name: "Italy", code: "IT", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇮🇹" },
  { name: "Canada", code: "CA", currency: { code: "CAD", symbol: "C$", name: "Canadian Dollar" }, flag: "🇨🇦" },
  { name: "Brazil", code: "BR", currency: { code: "BRL", symbol: "R$", name: "Brazilian Real" }, flag: "🇧🇷" },
  { name: "Russia", code: "RU", currency: { code: "RUB", symbol: "₽", name: "Russian Ruble" }, flag: "🇷🇺" },
  { name: "South Korea", code: "KR", currency: { code: "KRW", symbol: "₩", name: "South Korean Won" }, flag: "🇰🇷" },
  { name: "Australia", code: "AU", currency: { code: "AUD", symbol: "A$", name: "Australian Dollar" }, flag: "🇦🇺" },
  { name: "Mexico", code: "MX", currency: { code: "MXN", symbol: "Mex$", name: "Mexican Peso" }, flag: "🇲🇽" },
  { name: "Spain", code: "ES", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇪🇸" },
  { name: "Indonesia", code: "ID", currency: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" }, flag: "🇮🇩" },
  { name: "Netherlands", code: "NL", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇳🇱" },
  { name: "Saudi Arabia", code: "SA", currency: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" }, flag: "🇸🇦" },
  { name: "Turkey", code: "TR", currency: { code: "TRY", symbol: "₺", name: "Turkish Lira" }, flag: "🇹🇷" },
  { name: "Switzerland", code: "CH", currency: { code: "CHF", symbol: "Fr", name: "Swiss Franc" }, flag: "🇨🇭" },
  { name: "Taiwan", code: "TW", currency: { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" }, flag: "🇹🇼" },
  { name: "Poland", code: "PL", currency: { code: "PLN", symbol: "zł", name: "Polish Złoty" }, flag: "🇵🇱" },
  { name: "Sweden", code: "SE", currency: { code: "SEK", symbol: "kr", name: "Swedish Krona" }, flag: "🇸🇪" },
  { name: "Belgium", code: "BE", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇧🇪" },
  { name: "Thailand", code: "TH", currency: { code: "THB", symbol: "฿", name: "Thai Baht" }, flag: "🇹🇭" },
  { name: "Argentina", code: "AR", currency: { code: "ARS", symbol: "Arg$", name: "Argentine Peso" }, flag: "🇦🇷" },
  { name: "Austria", code: "AT", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇦🇹" },
  { name: "United Arab Emirates", code: "AE", currency: { code: "AED", symbol: "د.إ", name: "UAE Dirham" }, flag: "🇦🇪" },
  { name: "Norway", code: "NO", currency: { code: "NOK", symbol: "kr", name: "Norwegian Krone" }, flag: "🇳🇴" },
  { name: "Israel", code: "IL", currency: { code: "ILS", symbol: "₪", name: "Israeli New Shekel" }, flag: "🇮🇱" },
  { name: "Ireland", code: "IE", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇮🇪" },
  { name: "Nigeria", code: "NG", currency: { code: "NGN", symbol: "₦", name: "Nigerian Naira" }, flag: "🇳🇬" },
  { name: "South Africa", code: "ZA", currency: { code: "ZAR", symbol: "R", name: "South African Rand" }, flag: "🇿🇦" },
  { name: "Hong Kong", code: "HK", currency: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" }, flag: "🇭🇰" },
  { name: "Denmark", code: "DK", currency: { code: "DKK", symbol: "kr", name: "Danish Krone" }, flag: "🇩🇰" },
  { name: "Singapore", code: "SG", currency: { code: "SGD", symbol: "S$", name: "Singapore Dollar" }, flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", currency: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" }, flag: "🇲🇾" },
  { name: "Colombia", code: "CO", currency: { code: "COP", symbol: "Col$", name: "Colombian Peso" }, flag: "🇨🇴" },
  { name: "Philippines", code: "PH", currency: { code: "PHP", symbol: "₱", name: "Philippine Peso" }, flag: "🇵🇭" },
  { name: "Pakistan", code: "PK", currency: { code: "PKR", symbol: "₨", name: "Pakistani Rupee" }, flag: "🇵🇰" },
  { name: "Chile", code: "CL", currency: { code: "CLP", symbol: "CL$", name: "Chilean Peso" }, flag: "🇨🇱" },
  { name: "Finland", code: "FI", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇫🇮" },
  { name: "Bangladesh", code: "BD", currency: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" }, flag: "🇧🇩" },
  { name: "Egypt", code: "EG", currency: { code: "EGP", symbol: "E£", name: "Egyptian Pound" }, flag: "🇪🇬" },
  { name: "Vietnam", code: "VN", currency: { code: "VND", symbol: "₫", name: "Vietnamese Đồng" }, flag: "🇻🇳" },
  { name: "Portugal", code: "PT", currency: { code: "EUR", symbol: "€", name: "Euro" }, flag: "🇵🇹" },
  { name: "Czech Republic", code: "CZ", currency: { code: "CZK", symbol: "Kč", name: "Czech Koruna" }, flag: "🇨🇿" },
  { name: "Romania", code: "RO", currency: { code: "RON", symbol: "lei", name: "Romanian Leu" }, flag: "🇷🇴" },
  { name: "Peru", code: "PE", currency: { code: "PEN", symbol: "S/", name: "Peruvian Sol" }, flag: "🇵🇪" },
  { name: "New Zealand", code: "NZ", currency: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" }, flag: "🇳🇿" },
];

export const CountrySelector = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [open, setOpen] = useState(false);

  // Initialize with stored country or default to India
  useEffect(() => {
    const storedCountryCode = localStorage.getItem('selectedCountry');
    if (storedCountryCode) {
      const country = COUNTRIES.find(c => c.code === storedCountryCode);
      if (country) {
        setSelectedCountry(country);
      } else {
        // Default to India if saved country not found
        const defaultCountry = COUNTRIES.find(c => c.code === 'IN');
        setSelectedCountry(defaultCountry || COUNTRIES[0]);
      }
    } else {
      // Default to India first time
      const defaultCountry = COUNTRIES.find(c => c.code === 'IN');
      setSelectedCountry(defaultCountry || COUNTRIES[0]);
    }
  }, []);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    localStorage.setItem('selectedCountry', country.code);
    setOpen(false);
    
    // Publish event for other components to listen to
    window.dispatchEvent(new CustomEvent('country-changed', { detail: country }));
    
    toast.success(`Country set to ${country.name}`, {
      description: `Prices will now display in ${country.currency.name} (${country.currency.symbol})`,
      duration: 3000,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 py-6 px-4 animate-hover transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary"
        >
          {selectedCountry ? (
            <>
              <span className="text-lg mr-1">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.name}</span>
              <span className="text-muted-foreground ml-1">({selectedCountry.currency.symbol})</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span>Select Country</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[300px]">
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.currency.code}`}
                  onSelect={() => handleSelectCountry(country)}
                  className="flex items-center gap-2 py-2 cursor-pointer hover:bg-accent"
                >
                  <span className="text-lg mr-1">{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="text-muted-foreground ml-auto">{country.currency.symbol}</span>
                  {selectedCountry?.code === country.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelector;

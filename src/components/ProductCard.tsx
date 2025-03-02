
import React from 'react';
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ArrowUpIcon, ArrowDownIcon, StarIcon, ShoppingCartIcon, ExternalLinkIcon } from "lucide-react";

interface StorePrice {
  store: string;
  price: string;
  url?: string;
  regular_price?: number;
  discount_percentage?: number;
  vendor_rating?: number;
  available?: boolean;
  availability_count?: number;
}

interface ProductCardProps {
  storePrices: StorePrice[];
}

const formatPrice = (price: string) => {
  if (!price) return 'N/A';
  
  // Check if price already has a currency symbol
  if (price.includes('$') || price.includes('€') || price.includes('£')) {
    return price;
  }

  // Default to USD if no currency symbol is present
  return `$${price}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ storePrices }) => {
  if (!storePrices || storePrices.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No pricing information available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by price (numerically)
  const sortedPrices = [...storePrices].sort((a, b) => {
    const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
    const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
    return priceA - priceB;
  });

  const lowestPrice = sortedPrices[0];
  const highestPrice = sortedPrices[sortedPrices.length - 1];

  return (
    <Card className="w-full max-w-xl mx-auto shadow-lg bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-6 py-4">
        <CardTitle className="text-xl font-bold">Price Comparison Results</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2 flex items-center">
              <ArrowDownIcon className="mr-1 h-4 w-4" />
              Best Deal
            </h3>
            <div className="space-y-2">
              <div className="font-bold text-xl">{formatPrice(lowestPrice.price)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{lowestPrice.store}</div>
              {lowestPrice.discount_percentage && (
                <Badge variant="success" className="mt-1">
                  {lowestPrice.discount_percentage}% Off
                </Badge>
              )}
              {lowestPrice.vendor_rating && (
                <div className="flex items-center mt-2">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm">{lowestPrice.vendor_rating}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              {lowestPrice.url && (
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => window.open(lowestPrice.url, '_blank')}
                >
                  <ShoppingCartIcon className="mr-1 h-4 w-4" />
                  Shop Now
                </Button>
              )}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2 flex items-center">
              <ArrowUpIcon className="mr-1 h-4 w-4" />
              Highest Price
            </h3>
            <div className="space-y-2">
              <div className="font-bold text-xl">{formatPrice(highestPrice.price)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{highestPrice.store}</div>
              {highestPrice.discount_percentage && (
                <Badge variant="secondary" className="mt-1">
                  {highestPrice.discount_percentage}% Off
                </Badge>
              )}
              {highestPrice.vendor_rating && (
                <div className="flex items-center mt-2">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm">{highestPrice.vendor_rating}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              {highestPrice.url && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => window.open(highestPrice.url, '_blank')}
                >
                  <ExternalLinkIcon className="mr-1 h-4 w-4" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">All Available Prices</h3>
          <div className="space-y-3">
            {sortedPrices.map((item, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-md flex justify-between items-center 
                  ${index === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 
                    index === sortedPrices.length - 1 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' : 
                    'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800'}`}>
                <div>
                  <div className="font-medium">{item.store}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.available === false ? 
                      <Badge variant="destructive" className="mt-1">Out of Stock</Badge> : 
                      item.availability_count ? 
                        <Badge variant="secondary" className="mt-1">{item.availability_count} in stock</Badge> : 
                        null
                    }
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-bold">{formatPrice(item.price)}</div>
                  {item.discount_percentage && (
                    <Badge variant="success" className="mt-1">
                      {item.discount_percentage}% Off
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-700 px-6 py-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Prices updated recently. Click on "Shop Now" to view the current price at the retailer's website.
        </p>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

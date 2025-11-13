/**
 * Listing Card Example - Easy Islanders
 *
 * A complete example showing how to create a beautiful listing card
 * using multiple shadcn components together.
 *
 * This demonstrates:
 * - Card layout with CardAction
 * - Badges for status
 * - Dropdown menu for actions
 * - Tooltips for info
 * - Avatar for seller
 * - Button variants
 */

import * as React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Euro,
  Bed,
  Bath,
  MoreVertical,
  Heart,
  Share2,
  Flag,
  Eye,
  Calendar
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  image_url?: string;
  seller: {
    name: string;
    avatar?: string;
  };
  status: 'available' | 'booked' | 'pending';
  views: number;
}

interface ListingCardProps {
  listing: Listing;
  onView?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onReport?: (id: string) => void;
  onBook?: (id: string) => void;
}

export function ListingCardExample({
  listing,
  onView,
  onFavorite,
  onShare,
  onReport,
  onBook
}: ListingCardProps) {
  const [isFavorited, setIsFavorited] = React.useState(false);

  const statusConfig = {
    available: { variant: "default" as const, label: "Available", color: "text-success" },
    booked: { variant: "secondary" as const, label: "Booked", color: "text-muted-foreground" },
    pending: { variant: "secondary" as const, label: "Pending", color: "text-warning" },
  };

  const status = statusConfig[listing.status];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/30 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-16 w-16 text-primary/30" />
          </div>
        )}

        {/* Favorite Button Overlay */}
        <button
          onClick={() => {
            setIsFavorited(!isFavorited);
            onFavorite?.(listing.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors"
        >
          <Heart
            className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        {/* Status Badge Overlay */}
        <div className="absolute bottom-3 left-3">
          <Badge variant={status.variant} className={status.color}>
            {status.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="relative">
        <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {listing.description}
        </CardDescription>

        {/* Actions Menu */}
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(listing.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare?.(listing.id)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onReport?.(listing.id)}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{listing.location}</span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{listing.bedrooms}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bedrooms</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{listing.bathrooms}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bathrooms</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{listing.views}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total views</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <Euro className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold text-primary">{listing.price}</span>
          <span className="text-sm text-muted-foreground">/night</span>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-3 pt-3 border-t">
          <Avatar className="h-8 w-8">
            {listing.seller.avatar ? (
              <img src={listing.seller.avatar} alt={listing.seller.name} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-sm font-semibold">
                {listing.seller.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{listing.seller.name}</p>
            <p className="text-xs text-muted-foreground">Property owner</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onView?.(listing.id)}
        >
          View Details
        </Button>
        <Button
          className="flex-1"
          onClick={() => onBook?.(listing.id)}
          disabled={listing.status !== 'available'}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {listing.status === 'available' ? 'Book Now' : 'Not Available'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Example usage in a grid
export function ListingGridExample() {
  const exampleListings: Listing[] = [
    {
      id: '1',
      title: 'Luxury Beachfront Villa',
      description: 'Beautiful 3-bedroom villa with stunning ocean views and private beach access.',
      price: 250,
      location: 'Ayia Napa, Cyprus',
      bedrooms: 3,
      bathrooms: 2,
      seller: { name: 'Maria Georgiou' },
      status: 'available',
      views: 142,
    },
    {
      id: '2',
      title: 'Modern City Apartment',
      description: 'Stylish apartment in the heart of Limassol with all amenities.',
      price: 120,
      location: 'Limassol, Cyprus',
      bedrooms: 2,
      bathrooms: 1,
      seller: { name: 'Nikos Papadopoulos' },
      status: 'booked',
      views: 98,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exampleListings.map((listing) => (
          <ListingCardExample
            key={listing.id}
            listing={listing}
            onView={(id) => console.log('View:', id)}
            onFavorite={(id) => console.log('Favorite:', id)}
            onBook={(id) => console.log('Book:', id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ListingCardExample;

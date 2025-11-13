import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ExternalLink, Phone, Mail, MapPin, Info, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Calendar } from '../../../components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { DateRange } from 'react-day-picker';
import axios from 'axios';
import { format } from 'date-fns';

interface ShortTermRecommendationCardProps {
  item: {
    id: string | number;
    title: string;
    description?: string;
    area?: string;
    location?: string;
    price: string;
    imageUrl?: string;
    photos?: string[];
    amenities?: string[];
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
  };
}

export const ShortTermRecommendationCard: React.FC<ShortTermRecommendationCardProps> = ({ item }) => {
  const [isBooking, setIsBooking] = useState(false);
  const [openDates, setOpenDates] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const handleCheckAvailability = async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      alert('Please select check-in and check-out dates');
      return false;
    }

    try {
      const response = await axios.post('/api/shortterm/check-availability/', {
        listing_id: item.id,
        check_in: format(dateRange.from, 'yyyy-MM-dd'),
        check_out: format(dateRange.to, 'yyyy-MM-dd'),
      });

      const available = response.data.available;
      setIsAvailable(available);
      setAvailabilityChecked(true);

      if (!available) {
        alert('Selected dates are not available. Please choose different dates.');
      }
      return available;
    } catch (err) {
      console.error('Availability check failed:', err);
      alert('Failed to check availability. Please try again.');
      return false;
    }
  };

  const handleBookNow = async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      alert('Please select dates first');
      setOpenDates(true);
      return;
    }

    let available = isAvailable;
    if (!availabilityChecked) {
      available = await handleCheckAvailability();
    }
    if (!available) return;

    setIsBooking(true);
    try {
      const response = await axios.post('/api/shortterm/bookings/', {
        listing_id: item.id,
        check_in: format(dateRange.from, 'yyyy-MM-dd'),
        check_out: format(dateRange.to, 'yyyy-MM-dd'),
      });

      console.log('Booking success:', response.data);
      alert(`Booking created! ID: ${response.data.id}. Status: ${response.data.status}`);
      // TODO: Redirect to payment flow here
    } catch (err: any) {
      console.error('Booking failed:', err);
      alert(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Card className="w-72 overflow-hidden hover:shadow-lg transition-all duration-300">
          {/* IMAGE */}
          <div
            className="relative cursor-pointer group"
            onClick={() => setGalleryOpen(true)}
          >
            <div className="h-44 w-full overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={item.imageUrl || '/placeholder-property.jpg'}
                  alt={item.title}
                  className="h-44 w-full object-cover"
                />
              </motion.div>
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <Badge variant="premium" className="absolute top-3 right-3">
              {item.price}
            </Badge>
          </div>

          {/* CONTENT */}
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg line-clamp-1 mb-1">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {item.area || item.location || 'North Cyprus'}
            </p>

            {dateRange?.from && dateRange?.to && (
              <div className="mt-2 text-xs text-primary flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
              </div>
            )}
          </CardContent>

          {/* BUTTONS */}
          <div className="flex flex-col gap-2 p-4 pt-0">
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInfoOpen(true)}
                      className="flex-1"
                    >
                      <Info className="w-4 h-4 mr-1" />
                      Info
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View property details</p>
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDates(true)}
                  className="flex-1"
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Dates
                </Button>
              </div>
            </TooltipProvider>
            <Button
              onClick={handleBookNow}
              disabled={isBooking}
              variant="premium"
              className="w-full"
            >
              {isBooking ? 'Booking...' : 'Book Now'}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* DATE PICKER MODAL */}
      <Dialog open={openDates} onOpenChange={setOpenDates}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Select Dates</DialogTitle>
            <DialogDescription>
              Choose your check-in and check-out dates
            </DialogDescription>
          </DialogHeader>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range: DateRange | undefined) => {
              setDateRange(range);
              setAvailabilityChecked(false);
            }}
            numberOfMonths={1}
            disabled={(date) => date < new Date()}
          />
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpenDates(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                await handleCheckAvailability();
                if (isAvailable) {
                  setOpenDates(false);
                }
              }}
              disabled={!dateRange?.from || !dateRange?.to}
            >
              Check Availability
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GALLERY MODAL */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{item.title} — Photos</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-[600px] overflow-y-auto">
            {item.photos && item.photos.length > 0 ? (
              item.photos.map((src, i) => (
                <div key={i} className="rounded-lg overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img
                      src={src}
                      alt={`${item.title}-${i}`}
                      className="rounded-lg object-cover h-48 w-full"
                    />
                  </motion.div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>No photos available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* INFO MODAL */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              {item.area || item.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {item.description || 'No description available.'}
              </p>
            </div>

            {item.amenities && item.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {item.amenities.map((amenity, i) => (
                    <Badge key={i} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Price</h4>
              <p className="text-lg font-bold text-primary">{item.price}</p>
            </div>

            {item.contactInfo && (
              <div>
                <h4 className="font-semibold mb-2">Contact</h4>
                <div className="flex flex-wrap gap-3">
                  {item.contactInfo.phone && (
                    <a href={`tel:${item.contactInfo.phone}`} className="flex items-center gap-1 text-sm text-primary hover:text-primary/90">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Phone className="w-4 h-4" />
                        {item.contactInfo.phone}
                      </motion.div>
                    </a>
                  )}
                  {item.contactInfo.email && (
                    <a href={`mailto:${item.contactInfo.email}`} className="flex items-center gap-1 text-sm text-primary hover:text-primary/90">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Mail className="w-4 h-4" />
                        {item.contactInfo.email}
                      </motion.div>
                    </a>
                  )}
                  {item.contactInfo.website && (
                    <a href={item.contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:text-primary/90">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Website
                      </motion.div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShortTermRecommendationCard;

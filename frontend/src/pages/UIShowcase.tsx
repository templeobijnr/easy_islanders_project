import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui';
import {
  AnimatedWrapper,
  StaggerContainer,
  StaggerItem,
  AnimatedCard
} from '@/components/ui/animated-wrapper';
import {
  Sparkles,
  Zap,
  Heart,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Award,
  CheckCircle2
} from 'lucide-react';

/**
 * Premium UI Showcase Page
 * Demonstrates all the beautiful new components with animations
 */
export default function UIShowcase() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <AnimatedWrapper animation="fadeInUp" className="text-center mb-16">
          <div className="inline-block mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Sparkles className="w-16 h-16 text-brand-500" />
            </motion.div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent mb-4">
            Premium UI Components
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Beautiful, modern, and animated components powered by shadcn/ui and Framer Motion
          </p>
        </AnimatedWrapper>

        {/* Buttons Section */}
        <AnimatedWrapper animation="fadeInUp" delay={0.2} className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-brand-500" />
                Buttons
              </CardTitle>
              <CardDescription>
                Multiple variants with smooth animations and hover effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="premium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Premium
                </Button>
                <Button variant="glass">
                  Glass Effect
                </Button>
                <Button size="lg">Large</Button>
                <Button size="sm">Small</Button>
                <Button size="icon">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Cards Section */}
        <AnimatedWrapper animation="fadeInUp" delay={0.3} className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-200">
            Animated Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerContainer>
              {[
                {
                  icon: TrendingUp,
                  title: 'Performance',
                  desc: 'Lightning fast with optimized animations',
                  badge: 'New'
                },
                {
                  icon: Award,
                  title: 'Premium Design',
                  desc: 'Beautiful UI that makes an impression',
                  badge: 'Featured'
                },
                {
                  icon: CheckCircle2,
                  title: 'Type Safe',
                  desc: 'Built with TypeScript for reliability',
                  badge: 'Pro'
                }
              ].map((item, index) => (
                <StaggerItem key={index}>
                  <AnimatedCard glow className="h-full">
                    <Card className="h-full hover:border-brand-300 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <item.icon className="w-8 h-8 text-brand-500 mb-2" />
                          <Badge variant="premium">{item.badge}</Badge>
                        </div>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.desc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">
                          Learn More
                        </Button>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimatedWrapper>

        {/* Badges Section */}
        <AnimatedWrapper animation="fadeInUp" delay={0.4} className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Badges & Status Indicators</CardTitle>
              <CardDescription>
                Colorful badges for status, categories, and highlights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="premium">Premium ✨</Badge>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Interactive Section */}
        <AnimatedWrapper animation="fadeInUp" delay={0.5} className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Components</CardTitle>
              <CardDescription>
                Dialogs, tooltips, and form inputs with smooth animations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dialog Demo */}
              <div>
                <h3 className="font-semibold mb-3">Dialog Modal</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="premium">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Open Premium Dialog
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Welcome to Premium UI! 🎉</DialogTitle>
                      <DialogDescription>
                        This is a beautiful modal dialog with smooth entrance animations
                        and backdrop blur effects.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="Enter your email" type="email" />
                      <Input placeholder="Choose a username" />
                      <Button className="w-full" variant="premium">
                        Get Started
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tooltip Demo */}
              <div>
                <h3 className="font-semibold mb-3">Tooltips</h3>
                <TooltipProvider>
                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">
                          <Heart className="w-4 h-4 mr-2" />
                          Hover me
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Beautiful tooltip with animation!</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">
                          <Star className="w-4 h-4 mr-2" />
                          Me too
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Smooth entrance and exit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>

              {/* Input Demo */}
              <div>
                <h3 className="font-semibold mb-3">Form Inputs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Search properties..." />
                  <Input placeholder="Location" type="text" />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Avatar Section */}
        <AnimatedWrapper animation="fadeInUp" delay={0.6} className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Avatars</CardTitle>
              <CardDescription>
                User avatars with hover effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Avatar>
                  <AvatarFallback className="bg-brand-500 text-white">
                    JD
                  </AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-cyan-500 text-white">
                    AB
                  </AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-purple-500 text-white">
                    CD
                  </AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-r from-brand-500 to-cyan-500 text-white text-lg">
                    EI
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Real Estate Example */}
        <AnimatedWrapper animation="fadeInUp" delay={0.7}>
          <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-200">
            Real Estate Example
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StaggerContainer>
              {[
                {
                  title: 'Luxury Villa',
                  location: 'North Cyprus',
                  price: '€450,000',
                  image: '🏠'
                },
                {
                  title: 'Modern Apartment',
                  location: 'Kyrenia',
                  price: '€280,000',
                  image: '🏢'
                },
                {
                  title: 'Beach House',
                  location: 'Famagusta',
                  price: '€650,000',
                  image: '🏖️'
                }
              ].map((property, index) => (
                <StaggerItem key={index}>
                  <AnimatedCard glow>
                    <Card className="overflow-hidden hover:border-brand-300 transition-colors">
                      <div className="aspect-video bg-gradient-to-br from-brand-100 to-cyan-100 flex items-center justify-center text-6xl">
                        {property.image}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-xl">{property.title}</CardTitle>
                          <Badge variant="premium">{property.price}</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {property.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button variant="premium" className="flex-1">
                            View Details
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Heart className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Save to favorites</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </AnimatedWrapper>

        {/* Footer */}
        <AnimatedWrapper animation="fadeIn" delay={0.8} className="mt-16 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Built with ❤️ using shadcn/ui, Framer Motion, and Tailwind CSS
          </p>
        </AnimatedWrapper>
      </div>
    </div>
  );
}

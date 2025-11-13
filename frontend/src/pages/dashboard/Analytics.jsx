import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, ShoppingBag, MessageCircle, Star, Calendar, Target, Sparkles } from 'lucide-react';
import { useSellerAnalytics } from '../../hooks/useSellerDashboard';
import { CATEGORY_DESIGN } from '../../lib/categoryDesign';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const Analytics = () => {
  const { analytics, loading, error, refetch } = useSellerAnalytics();

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
        <p className="text-slate-600 mb-8">Track your business performance</p>
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <TrendingUp className="w-8 h-8 text-lime-600" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
        <p className="text-slate-600 mb-8">Track your business performance</p>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const categoryBreakdown = analytics?.category_breakdown || {};
  const trends = analytics?.trends || {};
  const insights = analytics?.insights || [];

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
          <p className="text-slate-600">Track your business performance</p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div>
        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10 border-primary/30 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-foreground"
                    >
                      {insight}
                    </motion.p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">Total Views</p>
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="text-3xl font-bold text-foreground mt-1"
                    >
                      {stats.total_views || 0}
                    </motion.p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center shadow-lg">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-primary font-medium">Across all listings</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-success">Total Listings</p>
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      className="text-3xl font-bold text-foreground mt-1"
                    >
                      {stats.total_listings || 0}
                    </motion.p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-success to-success/90 rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-success font-semibold">
                    {stats.active_listings || 0} active
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-accent-foreground">Pending Requests</p>
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                      className="text-3xl font-bold text-foreground mt-1"
                    >
                      {stats.pending_requests || 0}
                    </motion.p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/90 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-accent-foreground font-medium">Waiting for response</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-warning">Average Rating</p>
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                      className="text-3xl font-bold text-foreground mt-1"
                    >
                      {stats.avg_rating?.toFixed(1) || '0.0'}
                    </motion.p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-warning to-warning/90 rounded-xl flex items-center justify-center shadow-lg">
                    <Star className="w-7 h-7 text-white fill-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-warning font-medium">Out of 5.0</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.conversion_rate?.toFixed(1) || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Requests to listings ratio</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Broadcasts</p>
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total_broadcasts || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.active_broadcasts || 0} active · {stats.broadcast_views || 0} views
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Broadcast Responses</p>
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.broadcast_responses || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Total engagement</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown - Enhanced with Multi-Domain Design */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-sm mb-8 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-muted to-muted">
                <CardTitle>Category Distribution</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Your listings across different categories</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {Object.entries(categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([categoryName, count], index) => {
                      const total = Object.values(categoryBreakdown).reduce((sum, c) => sum + c, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;

                      // Find matching category design (case-insensitive match)
                      const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
                      const categoryDesign = Object.values(CATEGORY_DESIGN).find(
                        cat => cat.name.toLowerCase() === categoryName.toLowerCase() ||
                               cat.slug === categorySlug
                      );

                      const CategoryIcon = categoryDesign?.icon || ShoppingBag;
                      const gradient = categoryDesign?.gradient || 'from-gray-500 to-gray-600';
                      const badgeBg = categoryDesign?.badgeBg || 'bg-gray-100';
                      const badgeText = categoryDesign?.badgeText || 'text-gray-700';

                      return (
                        <motion.div
                          key={categoryName}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                                <CategoryIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="font-semibold text-foreground">{categoryName}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="text-xs">
                                    {count} {count === 1 ? 'listing' : 'listings'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground font-medium">{percentage.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: 0.7 + index * 0.1, ease: "easeOut" }}
                              className={`h-full bg-gradient-to-r ${gradient} rounded-full shadow-sm`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Performance Trends */}
        {trends && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last {trends.period_days || 30} days
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">New Listings</p>
                  <p className="text-3xl font-bold text-foreground">{trends.new_listings || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Added this period</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">New Broadcasts</p>
                  <p className="text-3xl font-bold text-foreground">{trends.new_broadcasts || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Created this period</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Total Views</p>
                  <p className="text-3xl font-bold text-foreground">{trends.current_total_views || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Summary */}
        <Card className="mt-8 bg-muted border-border">
          <CardHeader>
            <CardTitle>Recent Activity (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{stats.recent_listings_30d || 0} New Listings</h4>
                    <p className="text-sm text-muted-foreground">Added in the last month</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{stats.pending_requests || 0} Pending Requests</h4>
                    <p className="text-sm text-muted-foreground">Waiting for your response</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

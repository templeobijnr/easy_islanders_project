/**
 * Enhanced Projects section for developments
 * - Off-plan development tracking
 * - Timeline with milestones
 * - Construction progress tracking
 * - Investor management
 * - Budget tracking and pre-sales
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Target,
  Hammer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock projects data
const mockProjects = [
  {
    id: '1',
    name: 'Seaside Residences Phase 2',
    location: 'Kyrenia, North Cyprus',
    status: 'in-progress',
    progress: 65,
    start_date: '2024-01-15',
    expected_completion: '2025-06-30',
    total_units: 48,
    sold_units: 32,
    total_budget: 8500000,
    spent_budget: 5525000,
    investors: 12,
    developer: 'Cyprus Developments Ltd',
    description: 'Luxury beachfront apartments with panoramic sea views',
  },
  {
    id: '2',
    name: 'Downtown Commercial Plaza',
    location: 'Nicosia, Cyprus',
    status: 'planning',
    progress: 15,
    start_date: '2024-08-01',
    expected_completion: '2026-12-31',
    total_units: 24,
    sold_units: 8,
    total_budget: 12000000,
    spent_budget: 1800000,
    investors: 5,
    developer: 'Urban Estates Group',
    description: 'Mixed-use development with retail and office spaces',
  },
  {
    id: '3',
    name: 'Garden Villas Collection',
    location: 'Limassol, Cyprus',
    status: 'completed',
    progress: 100,
    start_date: '2023-03-01',
    expected_completion: '2024-05-15',
    total_units: 16,
    sold_units: 16,
    total_budget: 6400000,
    spent_budget: 6100000,
    investors: 8,
    developer: 'Green Homes Cyprus',
    description: 'Eco-friendly villas with private gardens',
  },
];

// Mock milestones
const mockMilestones = [
  { id: '1', project_id: '1', title: 'Foundation Complete', date: '2024-02-28', status: 'completed' },
  { id: '2', project_id: '1', title: 'Structure to 3rd Floor', date: '2024-04-30', status: 'completed' },
  { id: '3', project_id: '1', title: 'Roof Complete', date: '2024-06-15', status: 'completed' },
  { id: '4', project_id: '1', title: 'Interior Finishes', date: '2024-09-30', status: 'in-progress' },
  { id: '5', project_id: '1', title: 'Final Inspection', date: '2025-05-31', status: 'pending' },
  { id: '6', project_id: '1', title: 'Handover', date: '2025-06-30', status: 'pending' },
];

// Budget breakdown
const budgetData = [
  { category: 'Land Acquisition', amount: 2000000, spent: 2000000 },
  { category: 'Construction', amount: 4500000, spent: 2925000 },
  { category: 'Materials', amount: 1200000, spent: 780000 },
  { category: 'Labor', amount: 600000, spent: 390000 },
  { category: 'Marketing', amount: 200000, spent: 130000 },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    case 'in-progress':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Hammer };
    case 'planning':
      return { label: 'Planning', color: 'bg-purple-100 text-purple-800', icon: FileText };
    case 'on-hold':
      return { label: 'On Hold', color: 'bg-amber-100 text-amber-800', icon: Clock };
    case 'delayed':
      return { label: 'Delayed', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-800', icon: Building2 };
  }
};

export const ProjectsPageEnhanced = () => {
  const [selectedProject, setSelectedProject] = useState<any>(mockProjects[0]);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter((p) => p.status === 'in-progress' || p.status === 'planning').length;
  const totalUnits = mockProjects.reduce((sum, p) => sum + p.total_units, 0);
  const soldUnits = mockProjects.reduce((sum, p) => sum + p.sold_units, 0);
  const totalInvestment = mockProjects.reduce((sum, p) => sum + p.total_budget, 0);
  const presaleRate = totalUnits > 0 ? ((soldUnits / totalUnits) * 100).toFixed(1) : 0;

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    setProjectDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Development Projects
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Track construction and off-plan developments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">All developments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Hammer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress/planning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pre-sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presaleRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{soldUnits} of {totalUnits} sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">EUR {(totalInvestment / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">Total budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Overview of development projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Pre-sales</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProjects.map((project) => {
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const presales = ((project.sold_units / project.total_units) * 100).toFixed(0);

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{project.name}</div>
                          <div className="text-xs text-muted-foreground">{project.developer}</div>
                        </div>
                      </TableCell>
                      <TableCell>{project.location}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress value={project.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{project.progress}%</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{project.total_units}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            parseInt(presales) >= 70
                              ? 'bg-green-100 text-green-800'
                              : parseInt(presales) >= 40
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }
                        >
                          {presales}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        EUR {(project.total_budget / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(project.expected_completion).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleProjectClick(project)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Project Details Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>
              <Badge className={getStatusConfig(selectedProject?.status).color}>
                {getStatusConfig(selectedProject?.status).label}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Location</div>
                    <div className="font-semibold">{selectedProject.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Developer</div>
                    <div className="font-semibold">{selectedProject.developer}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Description</div>
                  <div className="text-sm">{selectedProject.description}</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                    <div className="font-semibold">
                      {new Date(selectedProject.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Expected Completion</div>
                    <div className="font-semibold">
                      {new Date(selectedProject.expected_completion).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Investors</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedProject.investors}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Overall Progress</div>
                  <Progress value={selectedProject.progress} className="h-4" />
                  <div className="text-sm text-muted-foreground mt-1">{selectedProject.progress}% Complete</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{selectedProject.total_units}</div>
                      <div className="text-xs text-muted-foreground">Total Units</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{selectedProject.sold_units}</div>
                      <div className="text-xs text-muted-foreground">Units Sold</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                <div className="text-sm font-medium mb-4">Project Milestones</div>
                <div className="space-y-3">
                  {mockMilestones
                    .filter((m) => m.project_id === selectedProject.id)
                    .map((milestone) => {
                      const isPast = new Date(milestone.date) < new Date();
                      const isCompleted = milestone.status === 'completed';

                      return (
                        <div
                          key={milestone.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border ${
                            isCompleted
                              ? 'bg-green-50 border-green-200'
                              : milestone.status === 'in-progress'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="mt-1">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : milestone.status === 'in-progress' ? (
                              <Clock className="h-5 w-5 text-blue-600" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-300"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{milestone.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(milestone.date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                          <Badge
                            className={
                              isCompleted
                                ? 'bg-green-100 text-green-800'
                                : milestone.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                            }
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </TabsContent>

              {/* Budget Tab */}
              <TabsContent value="budget" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">EUR {(selectedProject.total_budget / 1000000).toFixed(2)}M</div>
                      <div className="text-xs text-muted-foreground">Total Budget</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        EUR {(selectedProject.spent_budget / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-xs text-muted-foreground">Spent</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Budget Utilization</div>
                  <Progress
                    value={(selectedProject.spent_budget / selectedProject.total_budget) * 100}
                    className="h-4"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {((selectedProject.spent_budget / selectedProject.total_budget) * 100).toFixed(1)}% of budget used
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-4">Budget Breakdown</div>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={budgetData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => entry.category}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {budgetData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `EUR ${(value / 1000000).toFixed(2)}M`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-4">Spending Details</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Budget</TableHead>
                          <TableHead className="text-right">Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetData.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right">EUR {(item.amount / 1000).toFixed(0)}K</TableCell>
                            <TableCell className="text-right">EUR {(item.spent / 1000).toFixed(0)}K</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold">{selectedProject.total_units}</div>
                      <div className="text-xs text-muted-foreground">Total Units</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-green-600">{selectedProject.sold_units}</div>
                      <div className="text-xs text-muted-foreground">Sold</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedProject.total_units - selectedProject.sold_units}
                      </div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Pre-sales Progress</div>
                  <Progress value={(selectedProject.sold_units / selectedProject.total_units) * 100} className="h-4" />
                  <div className="text-sm text-muted-foreground mt-1">
                    {((selectedProject.sold_units / selectedProject.total_units) * 100).toFixed(1)}% sold
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm text-green-900 mb-1">Strong Pre-sales Performance</h4>
                      <p className="text-xs text-green-700">
                        {selectedProject.sold_units} units sold out of {selectedProject.total_units} total. Excellent
                        demand for this development.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPageEnhanced;

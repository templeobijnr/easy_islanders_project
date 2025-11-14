/**
 * Enhanced Sales Pipeline CRM section
 * - Kanban board for lead stages (Inquiry → Viewing → Offer → Closed)
 * - Lead details and contact information
 * - Conversion funnel metrics
 * - Agent performance tracking
 * - Automated follow-up reminders
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Lead stages
type LeadStage = 'inquiry' | 'viewing' | 'offer' | 'closed-won' | 'closed-lost';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  property_id: string;
  stage: LeadStage;
  value: number;
  source: string;
  created_at: string;
  last_contact: string;
  next_follow_up?: string;
  notes: string;
  agent?: string;
}

// Mock leads data
const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Emma Johnson',
    email: 'emma.j@email.com',
    phone: '+357 99 111 222',
    property: 'Seaside Apartment 2B',
    property_id: 'prop_1',
    stage: 'inquiry',
    value: 350000,
    source: 'Website',
    created_at: '2024-06-15',
    last_contact: '2024-06-15',
    next_follow_up: '2024-06-17',
    notes: 'Interested in 2-bedroom apartment near the beach. Budget up to EUR 400k.',
    agent: 'John Smith',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+357 99 222 333',
    property: 'Downtown Villa',
    property_id: 'prop_2',
    stage: 'viewing',
    value: 750000,
    source: 'Airbnb Inquiry',
    created_at: '2024-06-10',
    last_contact: '2024-06-14',
    next_follow_up: '2024-06-16',
    notes: 'Scheduled viewing for June 16. Very interested, cash buyer.',
    agent: 'Sarah Williams',
  },
  {
    id: '3',
    name: 'Sophia Martinez',
    email: 'sophia.m@email.com',
    phone: '+357 99 333 444',
    property: 'Beach House Studio',
    property_id: 'prop_3',
    stage: 'offer',
    value: 280000,
    source: 'Referral',
    created_at: '2024-06-05',
    last_contact: '2024-06-14',
    notes: 'Made offer at EUR 275k. Negotiating terms.',
    agent: 'John Smith',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'dbrown@email.com',
    phone: '+357 99 444 555',
    property: 'Coastal Retreat',
    property_id: 'prop_4',
    stage: 'closed-won',
    value: 620000,
    source: 'Booking.com',
    created_at: '2024-05-20',
    last_contact: '2024-06-12',
    notes: 'Deal closed at asking price. Completion in 30 days.',
    agent: 'Sarah Williams',
  },
  {
    id: '5',
    name: 'Olivia Taylor',
    email: 'olivia.t@email.com',
    phone: '+357 99 555 666',
    property: 'Sunset Penthouse',
    property_id: 'prop_5',
    stage: 'inquiry',
    value: 890000,
    source: 'Direct',
    created_at: '2024-06-14',
    last_contact: '2024-06-14',
    next_follow_up: '2024-06-18',
    notes: 'High-value lead. Interested in luxury properties.',
    agent: 'John Smith',
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'jwilson@email.com',
    phone: '+357 99 666 777',
    property: 'Downtown Villa',
    property_id: 'prop_2',
    stage: 'closed-lost',
    value: 750000,
    source: 'Website',
    created_at: '2024-05-15',
    last_contact: '2024-06-01',
    notes: 'Went with competitor. Price too high.',
    agent: 'Sarah Williams',
  },
];

const stageConfig: Record<LeadStage, { label: string; color: string; icon: any }> = {
  inquiry: { label: 'Inquiry', color: 'bg-blue-100 text-blue-800', icon: Mail },
  viewing: { label: 'Viewing Scheduled', color: 'bg-purple-100 text-purple-800', icon: Calendar },
  offer: { label: 'Offer Made', color: 'bg-amber-100 text-amber-800', icon: DollarSign },
  'closed-won': { label: 'Closed Won', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'closed-lost': { label: 'Closed Lost', color: 'bg-slate-100 text-slate-800', icon: AlertCircle },
};

export const SalesPipelinePageEnhanced = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [newLeadDialogOpen, setNewLeadDialogOpen] = useState(false);

  // Calculate metrics
  const totalLeads = mockLeads.length;
  const activeLeads = mockLeads.filter((l) => !l.stage.startsWith('closed')).length;
  const wonDeals = mockLeads.filter((l) => l.stage === 'closed-won').length;
  const totalValue = mockLeads
    .filter((l) => l.stage === 'closed-won')
    .reduce((sum, l) => sum + l.value, 0);
  const pipelineValue = mockLeads
    .filter((l) => !l.stage.startsWith('closed'))
    .reduce((sum, l) => sum + l.value, 0);
  const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : 0;

  // Funnel data
  const funnelData = [
    { stage: 'Inquiry', count: mockLeads.filter((l) => l.stage === 'inquiry').length, value: 100 },
    {
      stage: 'Viewing',
      count: mockLeads.filter((l) => l.stage === 'viewing').length,
      value: (mockLeads.filter((l) => l.stage === 'viewing').length / mockLeads.length) * 100,
    },
    {
      stage: 'Offer',
      count: mockLeads.filter((l) => l.stage === 'offer').length,
      value: (mockLeads.filter((l) => l.stage === 'offer').length / mockLeads.length) * 100,
    },
    {
      stage: 'Closed Won',
      count: mockLeads.filter((l) => l.stage === 'closed-won').length,
      value: (mockLeads.filter((l) => l.stage === 'closed-won').length / mockLeads.length) * 100,
    },
  ];

  const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDialogOpen(true);
  };

  const getLeadsByStage = (stage: LeadStage) => {
    return mockLeads.filter((l) => l.stage === stage);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Sales Pipeline
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Track and manage your sales leads</p>
          </div>
          <Button onClick={() => setNewLeadDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">In pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{wonDeals}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">EUR {(totalValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">Closed deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Lead to close</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sales Funnel</CardTitle>
          <CardDescription>Conversion through each stage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="stage" type="category" width={100} />
              <Tooltip
                formatter={(value: number, name: string, props: any) =>
                  name === 'value' ? `${value.toFixed(0)}%` : `${props.payload.count} leads`
                }
              />
              <Legend />
              <Bar dataKey="value" name="Conversion %" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {funnelData.map((stage, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200">
                <div className="text-xs text-muted-foreground mb-1">{stage.stage}</div>
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-xs text-muted-foreground mt-1">{stage.value.toFixed(0)}% of total</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Pipeline Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(Object.keys(stageConfig) as LeadStage[]).map((stage) => {
            const config = stageConfig[stage];
            const leads = getLeadsByStage(stage);
            const stageValue = leads.reduce((sum, l) => sum + l.value, 0);
            const Icon = config.icon;

            return (
              <Card key={stage} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-sm font-semibold">{leads.length}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    EUR {(stageValue / 1000).toFixed(0)}K
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 pt-0">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleLeadClick(lead)}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">{lead.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">{lead.property}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">EUR {(lead.value / 1000).toFixed(0)}K</span>
                        {lead.next_follow_up && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(lead.next_follow_up).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {leads.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">No leads in this stage</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              {selectedLead && (
                <Badge className={stageConfig[selectedLead.stage].color}>
                  {stageConfig[selectedLead.stage].label}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Contact Name</Label>
                  <div className="font-semibold">{selectedLead.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Property</Label>
                  <div className="font-semibold">{selectedLead.property}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedLead.email}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedLead.phone}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Deal Value</Label>
                  <div className="font-semibold text-green-600">EUR {selectedLead.value.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <div className="font-semibold">{selectedLead.source}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Agent</Label>
                  <div className="font-semibold">{selectedLead.agent || 'Unassigned'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <div className="text-sm">{new Date(selectedLead.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Contact</Label>
                  <div className="text-sm">{new Date(selectedLead.last_contact).toLocaleDateString()}</div>
                </div>
              </div>

              {selectedLead.next_follow_up && (
                <div>
                  <Label className="text-xs text-muted-foreground">Next Follow-up</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-600">
                      {new Date(selectedLead.next_follow_up).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  {selectedLead.notes}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button size="sm" className="ml-auto">
                  Move Stage
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog */}
      <Dialog open={newLeadDialogOpen} onOpenChange={setNewLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Create a new lead in your sales pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Contact Name</Label>
              <Input placeholder="John Doe" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="john@email.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" placeholder="+357 99 123 456" />
              </div>
            </div>

            <div>
              <Label>Property</Label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-md">
                <option>Select property...</option>
                <option>Seaside Apartment 2B</option>
                <option>Downtown Villa</option>
                <option>Beach House Studio</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deal Value (EUR)</Label>
                <Input type="number" placeholder="350000" />
              </div>
              <div>
                <Label>Source</Label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-md">
                  <option>Website</option>
                  <option>Airbnb Inquiry</option>
                  <option>Booking.com</option>
                  <option>Referral</option>
                  <option>Direct</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Add any notes about this lead..." rows={3} />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setNewLeadDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Add Lead</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPipelinePageEnhanced;

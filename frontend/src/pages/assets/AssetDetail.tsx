import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Laptop,
  Server,
  Printer,
  Monitor,
  HardDrive,
  User as UserIcon,
  MapPin,
  AlertCircle,
  Edit2,
  Save,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AssetStatusBadge,
  IncidentStatusBadge,
  IncidentPriorityBadge,
} from '@/components/ui/StatusBadge';
import { getAsset, updateAsset } from '@/api/assets';
import { getAgents } from '@/api/incidents';
import { useAuthStore } from '@/store/auth';
import type { Asset, AssetStatus, User } from '@/types';
import { toast } from 'sonner';

function getAssetTypeIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('laptop')) return <Laptop className="h-6 w-6 text-blue-500" />;
  if (lower.includes('server')) return <Server className="h-6 w-6 text-purple-500" />;
  if (lower.includes('printer')) return <Printer className="h-6 w-6 text-amber-500" />;
  if (lower.includes('desktop')) return <Monitor className="h-6 w-6 text-emerald-500" />;
  return <HardDrive className="h-6 w-6 text-slate-500" />;
}

export function AssetDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [agents, setAgents] = useState<User[]>([]);

  // Triage / Update state
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus>('AVAILABLE');
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<string>('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);

  const fetchAsset = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getAsset(id);
      setAsset(data);
      setSelectedStatus(data.status);
      setSelectedAssignedTo(data.assignedToId ?? '');
      setLocation(data.locationId ?? '');
      setName(data.name);
      setModel(data.model);
      setSerialNumber(data.serialNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load asset details';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchAsset();
  }, [fetchAsset]);

  useEffect(() => {
    if (isAgentOrAdmin) {
      getAgents().then(setAgents).catch(() => {});
    }
  }, [isAgentOrAdmin]);

  const handleUpdate = async () => {
    if (!asset) return;
    try {
      setIsUpdating(true);
      const updated = await updateAsset(asset.id, {
        name,
        model,
        serialNumber,
        status: selectedStatus,
        assignedToId: selectedAssignedTo || null,
        locationId: location || null,
      });
      setAsset(updated);
      setIsEditingSpecs(false);
      toast.success('Asset updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update asset';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Asset record not found</h2>
        <p className="text-slate-500 mt-2">The requested asset may have been removed or does not exist.</p>
        <Button onClick={() => navigate('/assets')} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Assets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/assets')}
            className="text-slate-500 hover:text-slate-900 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Assets
          </Button>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {asset.assetTag}
            </span>
            <AssetStatusBadge status={asset.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/incidents/new?assetId=${asset.id}`)}
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Report Issue on Asset
          </Button>
        </div>
      </div>

      {/* Main Asset Title Card */}
      <div className="bg-white border rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/80">
            {getAssetTypeIcon(asset.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                {asset.type}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              Model: <span className="text-slate-700 font-semibold">{asset.model}</span> &nbsp;|&nbsp; Serial:{' '}
              <span className="text-slate-700 font-semibold">{asset.serialNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{asset.locationId || 'HQ Campus'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-4 w-4 text-slate-400" />
            <span>
              {asset.assignedTo
                ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}`
                : 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hardware Specs & Incident History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications Card */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base text-slate-900">Hardware Specifications</CardTitle>
                <CardDescription className="text-xs">
                  Inventory identification and physical asset properties
                </CardDescription>
              </div>
              {isAgentOrAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSpecs(!isEditingSpecs)}
                  className="h-8 gap-1.5 text-xs text-blue-600"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  {isEditingSpecs ? 'Cancel Edit' : 'Edit Specs'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingSpecs ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-500">Asset Name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-500">Model / Spec</label>
                      <Input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-500">Serial Number</label>
                      <Input
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-500">Location / Room</label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Specifications
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Asset Tag</span>
                    <span className="font-mono font-bold text-slate-900 mt-0.5 block">{asset.assetTag}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Device Type</span>
                    <span className="font-medium text-slate-900 mt-0.5 block">{asset.type}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Model</span>
                    <span className="font-medium text-slate-900 mt-0.5 block">{asset.model}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Serial Number</span>
                    <span className="font-mono font-medium text-slate-900 mt-0.5 block">{asset.serialNumber}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Location</span>
                    <span className="font-medium text-slate-900 mt-0.5 block">{asset.locationId || 'Unspecified'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block font-medium">Registered Date</span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident History Linked to Asset */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Linked Incidents ({asset.incidents?.length ?? 0})
                </CardTitle>
                <CardDescription className="text-xs">
                  Trouble tickets reporting failures or maintenance on this hardware asset
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {!asset.incidents || asset.incidents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-medium text-slate-700">Clean Operational History</p>
                  <p className="text-xs text-slate-400 mt-0.5">No incidents are currently referencing this asset.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
                  {asset.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-600">
                            {inc.ticketNumber}
                          </span>
                          <IncidentStatusBadge status={inc.status} />
                          <IncidentPriorityBadge priority={inc.priority} />
                        </div>
                        <p className="text-sm font-medium text-slate-900">{inc.shortDescription}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Reported: {new Date(inc.createdAt).toLocaleDateString()}</span>
                          {inc.requester && (
                            <span>By: {inc.requester.firstName} {inc.requester.lastName}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 text-slate-600 hover:text-blue-600"
                      >
                        <Link to={`/incidents/${inc.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Status & Custody Assignment */}
        <div className="space-y-6">
          {/* Assignment & Custody Card */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <UserIcon className="h-4 w-4 text-blue-600" />
                Custody & Assignment
              </CardTitle>
              <CardDescription className="text-xs">
                Manage who currently holds or operates this asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAgentOrAdmin ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                      Assigned Employee
                    </label>
                    <select
                      value={selectedAssignedTo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAssignedTo(val);
                        if (val && selectedStatus === 'AVAILABLE') {
                          setSelectedStatus('ASSIGNED');
                        } else if (!val && selectedStatus === 'ASSIGNED') {
                          setSelectedStatus('AVAILABLE');
                        }
                      }}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white text-slate-800 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned (IT Inventory / Storage)</option>
                      {agents.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">
                      Asset Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as AssetStatus)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white text-slate-800 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
                      <option value="ASSIGNED">ASSIGNED (In active use)</option>
                      <option value="IN_REPAIR">IN_REPAIR (Under maintenance)</option>
                      <option value="RETIRED">RETIRED (Decommissioned)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Assignment & Status
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 text-sm">
                    <span className="text-slate-500 text-xs">Status:</span>
                    <AssetStatusBadge status={asset.status} />
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500 text-xs block mb-1">Assigned Custodian:</span>
                    {asset.assignedTo ? (
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <div>{asset.assignedTo.firstName} {asset.assignedTo.lastName}</div>
                          <div className="text-xs text-slate-400">{asset.assignedTo.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unassigned (In IT Storage)</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Asset Record Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-slate-800">{new Date(asset.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-slate-800">{new Date(asset.updatedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default AssetDetail;

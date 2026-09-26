import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Server,
  Printer,
  Monitor,
  HardDrive,
  Search,
  Plus,
  ArrowRight,
  User as UserIcon,
  MapPin,
  Tag,
  X,
  Loader2,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetStatusBadge } from '@/components/ui/StatusBadge';
import { getAssets, createAsset } from '@/api/assets';
import { getAgents } from '@/api/incidents';
import { useAuthStore } from '@/store/auth';
import type { Asset, AssetStatus, User, CreateAssetDto } from '@/types';
import { toast } from 'sonner';

const STATUS_FILTERS = ['ALL', 'AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'RETIRED'];
const TYPE_OPTIONS = ['ALL', 'Laptop', 'Desktop', 'Server', 'Printer', 'Network Device', 'Mobile Device'];

function getAssetTypeIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('laptop')) return <Laptop className="h-4 w-4 text-blue-500" />;
  if (lower.includes('server')) return <Server className="h-4 w-4 text-purple-500" />;
  if (lower.includes('printer')) return <Printer className="h-4 w-4 text-amber-500" />;
  if (lower.includes('desktop')) return <Monitor className="h-4 w-4 text-emerald-500" />;
  return <HardDrive className="h-4 w-4 text-slate-500" />;
}

export function AssetList(): JSX.Element {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // New Asset Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState<User[]>([]);

  // Form State
  const [formData, setFormData] = useState<CreateAssetDto>({
    name: '',
    type: 'Laptop',
    model: '',
    serialNumber: '',
    status: 'AVAILABLE',
    assignedToId: null,
    locationId: '',
  });

  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAssets({
        search: searchTerm,
        status: selectedStatus,
        type: selectedType,
      });
      setAssets(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assets';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAssets();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAssets]);

  useEffect(() => {
    if (isAgentOrAdmin) {
      getAgents().then(setAgents).catch(() => {});
    }
  }, [isAgentOrAdmin]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.model.trim() || !formData.serialNumber.trim()) {
      toast.error('Please fill in Name, Model, and Serial Number');
      return;
    }

    try {
      setIsSubmitting(true);
      const newAsset = await createAsset({
        ...formData,
        status: formData.assignedToId ? 'ASSIGNED' : formData.status,
      });
      toast.success(`Asset ${newAsset.assetTag} registered successfully`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        type: 'Laptop',
        model: '',
        serialNumber: '',
        status: 'AVAILABLE',
        assignedToId: null,
        locationId: '',
      });
      await fetchAssets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register asset';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Asset Management</h1>
          <p className="text-sm text-slate-500">
            Track enterprise hardware, workstation assignments, locations, and linked incidents.
          </p>
        </div>
        {isAgentOrAdmin ? (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Register Asset
          </Button>
        ) : null}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by tag, name, model, serial #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white text-slate-700 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Hardware Types' : t}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status === 'ALL' ? 'All Statuses' : status.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Card className="border-dashed bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-3 mb-4 text-slate-400">
              <Boxes className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No assets found</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
              {searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                ? 'No hardware assets matched your current filters.'
                : 'No assets have been cataloged yet in your IT inventory.'}
            </p>
            {isAgentOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Register First Asset
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                <tr>
                  <th className="py-3.5 px-4">Asset Tag</th>
                  <th className="py-3.5 px-4">Device / Model</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Serial Number</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned User</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 whitespace-nowrap">
                      {asset.assetTag}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{asset.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{asset.model}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        {getAssetTypeIcon(asset.type)}
                        <span>{asset.type}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {asset.serialNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <AssetStatusBadge status={asset.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span>{asset.assignedTo.firstName} {asset.assignedTo.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                      {asset.locationId ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{asset.locationId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assets/${asset.id}`);
                        }}
                      >
                        View
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Register New Asset</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Asset Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. MacBook Pro 16 M2 or Dell Server Rack"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Device Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white text-slate-800 border-slate-200"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Server">Server</option>
                    <option value="Printer">Printer</option>
                    <option value="Network Device">Network Device</option>
                    <option value="Mobile Device">Mobile Device</option>
                    <option value="Peripherals">Peripherals</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Model / Spec *
                  </label>
                  <Input
                    required
                    placeholder="e.g. A2485 (16-inch, 2023)"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Serial Number *
                  </label>
                  <Input
                    required
                    placeholder="e.g. C02G9015MD6R"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Custom Asset Tag
                  </label>
                  <Input
                    placeholder="Auto-generated if blank"
                    value={formData.assetTag ?? ''}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AssetStatus })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white text-slate-800 border-slate-200"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_REPAIR">IN_REPAIR</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Location / Office
                  </label>
                  <Input
                    placeholder="e.g. HQ - Floor 3 / DC Rack 4"
                    value={formData.locationId ?? ''}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-600 block mb-1">
                    Assign To Employee (Optional)
                  </label>
                  <select
                    value={formData.assignedToId ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedToId: e.target.value || null,
                        status: e.target.value ? 'ASSIGNED' : formData.status,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white text-slate-800 border-slate-200"
                  >
                    <option value="">Unassigned (In IT Storage)</option>
                    {agents.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Asset'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AssetList;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Shield,
  Download,
  Key,
  Lock,
  Wifi,
  Package,
  Search,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getCatalogItems, createRequest } from '@/api/catalog';
import type { ServiceCatalogItem } from '@/types';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop,
  Shield,
  Download,
  Key,
  Lock,
  Wifi,
  Package,
};

const CATEGORIES = ['ALL', 'Hardware', 'Software', 'Access', 'Network'];

export function ServiceCatalog(): JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Request Modal State
  const [selectedItem, setSelectedItem] = useState<ServiceCatalogItem | null>(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);
        const data = await getCatalogItems(selectedCategory);
        setItems(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load catalog';
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }
    void loadCatalog();
  }, [selectedCategory]);

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const handleOpenRequestModal = (item: ServiceCatalogItem) => {
    setSelectedItem(item);
    setRequestDescription('');
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setRequestDescription('');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !requestDescription.trim()) return;

    try {
      setIsSubmitting(true);
      const req = await createRequest({
        serviceCatalogItemId: selectedItem.id,
        description: requestDescription.trim(),
      });
      toast.success(`Request ${req.requestNumber} submitted successfully!`);
      handleCloseModal();
      navigate('/requests');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Service Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Browse standard enterprise services and submit standardized IT requests.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/requests')}
          className="gap-2 self-start sm:self-auto"
        >
          View My Requests
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {cat === 'ALL' ? 'All Services' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-700">No services found</p>
          <p className="text-sm text-slate-400">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon] ?? Package;
            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium text-slate-500">
                      {item.category}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Standard Fulfillment</span>
                  <Button
                    size="sm"
                    onClick={() => handleOpenRequestModal(item)}
                    className="gap-1.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Request
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Submission Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Request: {selectedItem?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Category: {selectedItem?.category}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitRequest} className="space-y-4 py-2">
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {selectedItem?.description}
            </div>

            <div className="space-y-2">
              <label htmlFor="reqDesc" className="text-sm font-semibold text-slate-800">
                Business Justification & Specifications <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reqDesc"
                rows={4}
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="Explain why this service is needed and specify any relevant details (e.g. project code, software version, hardware model)..."
                required
                className="w-full rounded-md border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !requestDescription.trim()}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

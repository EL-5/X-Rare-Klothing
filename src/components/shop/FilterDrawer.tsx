import { Drawer } from '@/components/ui/Drawer';
import { FilterPanel, type FilterPanelProps } from './FilterPanel';

export interface FilterDrawerProps extends FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Mobile filter drawer — same FilterPanel as the desktop sidebar, per the batch's "use a filter drawer" requirement. */
export function FilterDrawer({ isOpen, onClose, listing }: FilterDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="left" title="Filter & Sort">
      <div className="p-6">
        <FilterPanel listing={listing} />
      </div>
    </Drawer>
  );
}

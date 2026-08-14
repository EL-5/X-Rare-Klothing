import { Accordion } from '@/components/ui/Accordion';

const SIZE_ROWS = [
  { size: 'S', chest: '36–38"', waist: '29–31"' },
  { size: 'M', chest: '39–41"', waist: '32–34"' },
  { size: 'L', chest: '42–44"', waist: '35–37"' },
];

export function SizeGuideSection() {
  return (
    <Accordion title="Size Guide">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-ink/60">
            <th className="py-2 pr-4 font-medium uppercase tracking-wide">Size</th>
            <th className="py-2 pr-4 font-medium uppercase tracking-wide">Chest</th>
            <th className="py-2 font-medium uppercase tracking-wide">Waist</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_ROWS.map((row) => (
            <tr key={row.size} className="border-b border-border/60">
              <td className="py-2 pr-4 text-ink">{row.size}</td>
              <td className="py-2 pr-4">{row.chest}</td>
              <td className="py-2">{row.waist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Accordion>
  );
}

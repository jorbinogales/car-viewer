import { CONFIG, useShowroom } from '../state/store';
import { requiredBy } from '../logic/accessories';
import { RadioGroup, SectionLabel, SwitchRow } from './controls';
import { TabHeader } from './ExploreTab';

export function CustomizeTab() {
  const model = useShowroom((s) => s.model);
  const accessories = useShowroom((s) => s.accessories);
  const setAccessory = useShowroom((s) => s.setAccessory);
  const variants = useShowroom((s) => s.variants);
  const setVariant = useShowroom((s) => s.setVariant);

  // Solo se ofrece lo que el GLB trae de verdad.
  const accessoryDefs = CONFIG.accessories.filter((a) => model.partIds.includes(a.partId));

  return (
    <div className="panel-scroll">
      <TabHeader title="Personalizar" subtitle="Opciones y accesorios." />

      {CONFIG.variantGroups.length > 0 && (
        <section className="panel-section">
          <SectionLabel>Opciones</SectionLabel>
          {CONFIG.variantGroups.map((g) => (
            <div key={g.id} className="variant-group">
              <h4 className="sub-label">{g.name}</h4>
              <RadioGroup label={g.name} options={g.options} value={variants[g.id] ?? g.defaultOptionId} onChange={(v) => setVariant(g.id, v)} />
            </div>
          ))}
        </section>
      )}

      {accessoryDefs.length > 0 && (
        <section className="panel-section">
          <SectionLabel>Accesorios</SectionLabel>
          <div className="switch-list">
            {accessoryDefs.map((a) => {
              const req = requiredBy(CONFIG.accessories, a.id);
              return (
                <SwitchRow
                  key={a.id}
                  label={a.name}
                  description={req.length ? `Requiere ${req.map((r) => r.name.toLowerCase()).join(' y ')}; se activan junto con este accesorio.` : undefined}
                  checked={accessories.includes(a.id)}
                  onChange={(on) => setAccessory(a.id, on)}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

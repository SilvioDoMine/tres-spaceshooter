/**
 * Cor da exaustão da nave: propulsores lendários têm cor própria, senão vale a personalização.
 * Com `preview` (vitrine de equipamento), o propulsor vem dele em vez do equipado.
 */
export function useThrusterColor() {
  const equipment = useEquipmentStore();
  const appearance = useShipAppearance();
  return (preview?: Record<string, string | number>) => {
    const id = preview ? preview.thrusters : equipment.equippedItem('thrusters')?.defId;
    return id === 'propulsor-cometa' ? '#ff9a37' : id === 'propulsor-vortice' ? '#b578ff' : appearance.value.exhaust || '#27c7ff';
  };
}

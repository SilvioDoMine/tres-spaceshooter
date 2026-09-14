/** Cor da exaustão da nave: propulsores lendários têm cor própria, senão vale a personalização. */
export function useThrusterColor() {
  const equipment = useEquipmentStore();
  const appearance = useShipAppearance();
  return () => {
    const id = equipment.equippedItem('thrusters')?.defId;
    return id === 'propulsor-cometa' ? '#ff9a37' : id === 'propulsor-vortice' ? '#b578ff' : appearance.value.exhaust || '#27c7ff';
  };
}

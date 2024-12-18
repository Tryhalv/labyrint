export function playerDealsDmg(attack) {
  return `Player dealt ${attack} points of damage`;
}
export function playerGainsLoot(loot, lootType) {
  return `Player gains ${loot} ${lootType} `;
}
export function playerFindsItem(item) {
  return `Player found ${item.name}, ${item.attribute} is changed by ${item.value}`;
}
export function bastardDies() {
  return " and the bastard dies";
}
export function mobsDealsDmg(attack) {
  return `\nBastard deals ${attack} back`;
}

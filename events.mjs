export let eventText = "";

// Dersom noe intreffer så vil denne variabelen kunne brukes til å fortelle spilleren om det

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
  return "and the bastard dies";
}
export function mobsDealsDmg(attack) {
  return `Bastard deals ${attack} back`;
}

export function appendEventText(text) {
  eventText += `\n${text}`;
}

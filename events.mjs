export let eventLogs = [];

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

export function appendEventText(text, frame, removeAfterFrames) {
  if (removeAfterFrames == undefined) {
    removeAfterFrames = 20;
  }

  const lastDisplayFrame = frame + removeAfterFrames;
  const eventLog = {
    displayText: text,
    frame: frame,
    lastDisplayFrame: lastDisplayFrame,
  };

  eventLogs.push(eventLog);
}

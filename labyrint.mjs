//#region
import * as readlinePromises from "node:readline/promises";
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});
//#endregion
import ANSI from "./ANSI.mjs";
import KeyBoardManager from "./keyboardManager.mjs";
import "./prototypes.mjs";
import { level1 } from "./levels.mjs";
import { level2 } from "./levels.mjs";
import { splashScreen } from "./splashscreen.mjs";
import dict from "./dictionary.mjs";
import { randomBetween } from "./mathUtils";
import {
  bastardDeath,
  MobsDealsDmg,
  MOBSDeath,
  playerDealsDmg,
  playerFoundItem,
  playerGainsLoot,
} from "./events";
const FPS = 250; // 60 frames i sekundet sån sirkus..
let rawLevel = level1;
let startPrompt;

console.log(splashScreen);
await rl.question(dict.gameSettings.start_Prompt);

// Brettet som er lastet inn er i form av tekst, vi må omgjøre teksten til en
// to dimensjonal liste [][] for å kunne tolke hva som er hvor etc.
let tempLevel = rawLevel.split("\n");
let level = [];
for (let i = 0; i < tempLevel.length; i++) {
  let row = tempLevel[i];
  let outputRow = row.split("");
  level.push(outputRow);
}
// Dette er farge palleten for de ulike symbolene, brukes når vi skriver dem ut.
let pallet = {
  "█": ANSI.COLOR.LIGHT_GRAY,
  H: ANSI.COLOR.RED,
  $: ANSI.COLOR.YELLOW,
  B: ANSI.COLOR.GREEN,
};

let isDirty = true; // For å ungå at vi tegner på hver oppdatering (kan skape flimring) så bruker vi denne variabelen til å indikere at det skal tegnes på nytt,

// Hvor er spilleren på brettet. Dersom row og col er null så kan vi anta at vi akkurat har lastet brettet.
let playerPos = {
  row: null,
  col: null,
};

// Konstanter for ulike elementer av spillet.
const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const THINGS = [LOOT, EMPTY];
const MOBS = ["B"];
const NPCs = [];
const POSSIBLE_PICKUPS = [
  { name: "Sword", attribute: "attack", value: 5 },
  { name: "Spear", attribute: "attack", value: 3 },
  { name: "Dagger", attribute: "attack", value: 3 },
];

const E_HP_INIT_MULTIPLIER = 6;
const E_HP_INIT_MIN = 4;
const E_DMG_INIT_MIN = 0.7;
const P_MOV_CELL_AMT = 1;
const LOOT_CASH_DROP_RATE = 0.95;
const LOOT_CASH_MIN_AMT = 3;
const LOOT_CASH_MAX_AMT = 7;
const HP_MAX = 10;
const MAX_ATTACK = 2;

const playerStats = { hp: HP_MAX, cash: 0, attack: 1.1 };

let eventText = ""; // Dersom noe intreffer så vil denne variabelen kunne brukes til å fortelle spilleren om det

// I dette spillet brukker vi ikke en vanlig loop til å kjøre spill logikken vår.
// Men setInterval funksjonen virker litt på samme måte som en loop, bare at den venter x antall millisekunder mellom hver gang den utfører koden vår.
let gl = setInterval(gameLoop, FPS);

function update() {
  // Denne testen spør egentlig, er brettet akkurat lastet inn?
  if (playerPos.row == null) {
    // Vi iterere over alle rader
    for (let row = 0; row < level.length; row++) {
      // Vi iterere over alle koloner
      for (let col = 0; col < level[row].length; col++) {
        // For hver celle ([rad][kolone]) sjekker vi om det er noe for oss å håndtere.

        let value = level[row][col];
        if (value == HERO) {
          // Dersom verdien er H, da har vi funnet helten vår
          playerPos.row = row;
          playerPos.col = col;
        } else if (MOBS.includes(value)) {
          // Posisjonen inneholder en "fiende" da må vi gi fienden noen stats for senere bruk

          let hp =
            Math.round(Math.random() * E_HP_INIT_MULTIPLIER) + E_HP_INIT_MIN;
          let attack = E_DMG_INIT_MIN + Math.random();
          let badThing = { hp, attack, row, col };
          NPCs.push(badThing);
        }
      }
    }
  }

  let drow = 0; // variabel for spillerens ønskede endring vertikalt
  let dcol = 0; // varianel for spillerens ønskede endring horizontalt.

  // Nå sjekker vi om spilleren har prøvd å bevege seg vertikalt
  if (KeyBoardManager.isUpPressed()) {
    drow = -P_MOV_CELL_AMT;
  } else if (KeyBoardManager.isDownPressed()) {
    drow = P_MOV_CELL_AMT;
  }
  // Nå sjekker vi horisontalt
  if (KeyBoardManager.isLeftPressed()) {
    dcol = -P_MOV_CELL_AMT;
  } else if (KeyBoardManager.isRightPressed()) {
    dcol = P_MOV_CELL_AMT;
  }

  // Så bruker vi den ønskede endringen til å kalulere ny posisjon på kartet.
  // Merk at vi ikke flytter spilleren dit enda, for det er ikke sikkert det er mulig.
  let tRow = playerPos.row + P_MOV_CELL_AMT * drow;
  let tcol = playerPos.col + P_MOV_CELL_AMT * dcol;

  if (THINGS.includes(level[tRow][tcol])) {
    // Er det en gjenstand der spilleren prøver å gå?

    let currentItem = level[tRow][tcol];
    if (currentItem == LOOT) {
      if (Math.random() < LOOT_CASH_DROP_RATE) {
        // 95% av tiden gir vi "cash" som loot
        let loot = randomBetween(LOOT_CASH_MIN_AMT, LOOT_CASH_MAX_AMT);
        playerStats.cash += loot;
        eventText = playerGainsLoot(loot); // Vi bruker eventText til å fortelle spilleren hva som har intruffet.
      } else {
        // i 5% av tilfellen tildeler vi en tilfeldig gjenstand fra listen over gjenstander.
        let item = POSSIBLE_PICKUPS.random();
        playerStats.attack += item.value;
        eventText = playerFoundItem(item); // Vi bruker eventText til å fortelle spilleren hva som har intruffet.
      }
    }

    level[playerPos.row][playerPos.col] = EMPTY; // Der helten står nå settes til tom
    level[tRow][tcol] = HERO; // Den nye plaseringen på kartet settes til å inneholde helten

    // Oppdaterer heltens posisjon
    playerPos.row = tRow;
    playerPos.col = tcol;

    // Sørger for at vi tegner den nye situasjonen.
    isDirty = true;
  } else if (MOBS.includes(level[tRow][tcol])) {
    // Spilleren har forsøkt å gå inn der hvor det står en "motstander" av en eller annen type

    // Vi må finne den riktige "motstanderen" i listen over motstandere.
    let antagonist = null;
    for (let i = 0; i < NPCs.length; i++) {
      let b = NPCs[i];
      if ((b.row = tRow && b.col == tcol)) {
        antagonist = b;
      }
    }

    // Vi beregner hvor mye skade spilleren påfører motstanderen
    let attack = (Math.random() * MAX_ATTACK * playerStats.attack).toFixed(2);
    antagonist.hp -= attack; // Påfører skaden.

    eventText = playerDealsDmg(attack); // Forteller spilleren hvor mye skade som ble påfært

    if (antagonist.hp <= 0) {
      // Sjekker om motstanderen er død.
      eventText += MOBSDeath; // Sier i fra at motstandren er død
      level[tRow][tcol] = EMPTY; // Markerer stedet på kartet hvor motstanderen sto som ledig.
    } else {
      // Dersom motstanderen ikke er død, så slår vedkommene tilbake.
      attack = (Math.random() * MAX_ATTACK * antagonist.attack).toFixed(2);
      playerStats.hp -= attack;
      eventText += \n MobsDealsDmg;
    }

    // Setter temp pos tilbake siden dette har vært en kamp runde
    tRow = playerPos.row;
    tcol = playerPos.col;

    // Sørger for at vi tegner den nye situasjonen.
    isDirty = true;
  }
}

function draw() {
  // Vi tegner kunn dersom spilleren har gjort noe.
  if (isDirty == false) {
    return;
  }
  isDirty = false;

  // Tømmer skjermen
  console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

  // Starter tegningen vår av den nåværende skjerm.
  let rendring = "";

  // Bruker en funksjon for å tegne opp HUD elementer.
  rendring += renderHUD();

  // Så går vi gjenom celle for celle og legger inn det som skal vises per celle. (husk rad+kolone = celle, tenk regneark)
  for (let row = 0; row < level.length; row++) {
    let rowRendering = "";
    for (let col = 0; col < level[row].length; col++) {
      let symbol = level[row][col];
      if (pallet[symbol] != undefined) {
        if (MOBS.includes(symbol)) {
          // Kan endre tegning dersom vi vill.
          rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
        } else {
          rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
        }
      } else {
        rowRendering += symbol;
      }
    }
    rowRendering += "\n";
    rendring += rowRendering;
  }

  console.log(rendring);
  if (eventText != "") {
    // dersom noe er lagt til i eventText så skriver vi det ut nå. Dette blir synelig til neste gang vi tegner (isDirty = true)
    console.log(eventText);
    eventText = "";
  }
}

function renderHUD() {
  let hpBar = `[${
    ANSI.COLOR.RED + pad(Math.round(playerStats.hp), "❤️") + ANSI.COLOR_RESET
  }${ANSI.COLOR.BLUE + pad(HP_MAX - playerStats.hp, "❤️") + ANSI.COLOR_RESET}]`;
  let cash = `$:${playerStats.cash}`;
  return `${hpBar} ${cash} \n`;
}

function pad(len, text) {
  let output = "";
  for (let i = 0; i < len; i++) {
    output += text;
  }
  return output;
}

function gameLoop() {
  update();
  draw();
}
function print() {
  console.log;
}

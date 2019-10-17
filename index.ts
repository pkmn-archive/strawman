// Exported native API for @smogon/data
//
// DISCLAIMER:
//
//   Not meant to replace Dex/BattleDex: consumers can delegate to this native API
//   and put their own layer on top which can extend or alter the functionality.
//
// CONSIDERATIONS:
//
//    - Approach: async APIs are moved to top level so that data load can be done
//      once and then the rest of the APIs aren't cluttered with `await` everywhere.
//      Furthermore, individual pieces can be loaded (just `Abilities` vs. all data
//      types) if desired.
//    - `getByID` APIs are important for removing the `toID` call in `get` methods
//      for when we already know through typechecking that we have an ID. String
//      getters have been removed - callees can manually called `toID` first if they
//      dont have an ID (which should be very rare unless its human-input).
//    - Descriptions are UI only and can be large so aren't included in the Dex by
//      default, but they may be loaded in bulk asynchronously for the desired
//      languages.
//    - Similarly, SpeciesDetails which are purely cosmetic or used by the Validator
//      or for non-competitive reasons are offloaded. eg. learnset details are very
//      large and not needed in many circumstances.
//    - All other APIs are loaded together for a gen (+ mod) - it's rare a consumer
//      cares *just* about Abilities or *just* Moves, and if they do and are in an
//      environment where loading more is a concern they can implement their own
//      splitting on top of the raw data files.
//    - The aliases.json data is used internally (to implement getByID's) but is
//      not exported.
//    - The individual APIs (eg. Abilities) are not just Maps, as their lookup function
//      is more sophisticated (handles aliases, caching, etc).
//    - Internally, references can be resolved lazily through Javascript getters (though
//      need to use `Object.defineProperty(Foo.prototype, ...)` to be able to make
//      enumerable) to avoid object instantiation overhead and avoid creating objects for
//      fields which are never read.
//    - Map will need to be polyfilled or support for browsers before IE11 will need to
//      be dropped.
//
//  *** TODO ***:
//
//   - 'Species'/'SpeciesDetails' names are problematic as they are plural
//   - Demonstrate how PS can wrap the specific types and still extend them in OMs
//   - All the fields in the JSON should be able to be `null` as a sentinel for removal,
//     can implement this generically using higher order Typescript utility type
//     functionality.
//   - 'CommonFoo' and 'JSONFoo' naming could use bikeshedding!
//   - Review fields to ensure optional fields are made required in the rich APIs where
//     it makes sense to do so.
//

// core.ts

type ID = '' | string & {__isID: true};
toID(s: string): ID;

type Generation = 1 | 2 | 3 | 4 | 5 | 6 | 7;
// NOTE: CAP is not currently considered a mod but should be...
type Mod = 'LGPE' | 'Stadium' | 'CAP' | 'SSB' | 'Next' | 'PiC' | 'Mix And Mega' | 'VGC 17';

type WeatherName =
  | 'Sand'
  | 'Sun'
  | 'Rain'
  | 'Hail'
  | 'Harsh Sunshine'
  | 'Heavy Rain'
  | 'Strong Winds';

type StatusName = 'par' | 'psn' | 'frz' | 'slp' | 'brn' | 'tox';

// data.ts

type DataKind = 'Ability' | 'Move' | 'Item' | 'Species';
type Nonstandard = 'Glitch' | 'Past' | 'Future' | 'CAP' | 'LGPE' | 'Pokestar' | 'Custom';

interface JSONData extends Omit<Data, 'id' | 'kind' | 'num' | 'gen'> {}
interface Data {
  id: ID;
  kind: DataKind;
  name: string;
  gen: Generation;
  isUnreleased?: boolean;
  isNonstandard?: Nonstandard;
}

// natures.ts

type NatureName = 'Adamant' | 'Bashful' | 'Bold' | 'Brave' | 'Calm' | 'Careful' | 'Docile' | 'Gentle' |
  'Hardy' | 'Hasty' | 'Impish' | 'Jolly' | 'Lax' | 'Lonely' | 'Mild' | 'Modest' | 'Naive' | 'Naughty' |
  'Quiet' | 'Quirky' | 'Rash' | 'Relaxed' | 'Sassy' | 'Serious' | 'Timid';

class Natures {
  getByID(id: ID): Nature | undefined;
  next(): {value: Nature, done: boolean};
}

interface Nature {
  id: ID;
  name: NatureName;
  plus?: StatName;
  minus?: StatName;
}

// abilities.ts

interface CommonAbility {
  suppressesWeather?: boolean;
  isUnsuppressible?: boolean;
}

interface JSONAbility extends JSONData & CommonAbility {}
interface Ability extends Data & CommonAbility {
  kind: 'Ability';

  toJSON(): JSONAbility;
}

class Abilities {
  getByID(id: ID): Ability | undefined;
  next(): {value: Ability, done: boolean};
}

// items.ts

interface CommonItem<SpeciesT, TypeT, MoveT> {
  fling?: { basePower: number status?: string volatileStatus?: string };
  forcedForme?: SpeciesT;
  ignoreKlutz?: boolean;
  infiltrates?: boolean;
  isBerry?: boolean;
  isChoice?: boolean;
  isGem?: boolean;
  isPokeball?: boolean;
  megaEvolves?: SpeciesT;
  megaStone?: SpeciesT;
  naturalGift?: {basePower: number, type: TypeT};
  onDrive?: TypeT;
  onMemory?: TypeT;
  onPlate?: TypeT;
  status?: StatusName;
  weather?: WeatherName;
  zMove?: {
    type?: TypeT;
  } | {
    move: MoveT;
    from: MoveT;
    user: SpeciesT[];
  };
}

interface JSONItem extends JSONData && CommonItem<ID, ID, ID> {}
interface Item extends Data & CommonItem<Species, Type, Move> {
  kind: 'Item';

  toJSON(): JSONItem;
}

class Items {
  getByID(id: ID): Item | undefined;
  next(): {value: Item, done: boolean};
}

// moves.ts

// TODO: consider moving some top-level booleans from Move into MoveFlags
interface MoveFlags {
  authentic?: boolean; // Ignores a target's substitute.
  bite?: boolean; // Power is multiplied by 1.5 when used by a Pokemon with the Ability Strong Jaw.
  bullet?: boolean; // Has no effect on Pokemon with the Ability Bulletproof.
  charge?: boolean; // The user is unable to make a move between turns.
  contact?: boolean; // Makes contact.
  dance?: boolean; // When used by a Pokemon, other Pokemon with the Ability Dancer can attempt to execute the same move.
  defrost?: boolean; // Thaws the user if executed successfully while the user is frozen.
  distance?: boolean; // Can target a Pokemon positioned anywhere in a Triple Battle.
  gravity?: boolean; // Prevented from being executed or selected during Gravity's effect.
  heal?: boolean; // Prevented from being executed or selected during Heal Block's effect.
  mirror?: boolean; // Can be copied by Mirror Move.
  mystery?: boolean; // Unknown effect.
  nonsky?: boolean; // Prevented from being executed or selected in a Sky Battle.
  powder?: boolean; // Has no effect on Pokemon which are Grass-type, have the Ability Overcoat, or hold Safety Goggles.
  protect?: boolean; // Blocked by Detect, Protect, Spiky Shield, and if not a Status move, King's Shield.
  pulse?: boolean; // Power is multiplied by 1.5 when used by a Pokemon with the Ability Mega Launcher.
  punch?: boolean; // Power is multiplied by 1.2 when used by a Pokemon with the Ability Iron Fist.
  recharge?: boolean; // If this move is successful, the user must recharge on the following turn and cannot make a move.
  reflectable?: boolean; // Bounced back to the original user by Magic Coat or the Ability Magic Bounce.
  snatch?: boolean; // Can be stolen from the original user and instead used by another Pokemon using Snatch.
  sound?: boolean; // Has no effect on Pokemon with the Ability Soundproof.
}

type MoveCategory: 'Physical' | 'Special' | 'Status';

type MoveTarget =
  // single-target
  'normal'|'any'|'adjacentAlly'|'adjacentFoe'|'adjacentAllyOrSelf'|
  // single-target, automatic
  'self'|'randomNormal'|
  // spread
  'allAdjacent'|'allAdjacentFoes'|
  // side and field
  'allySide'|'foeSide'|'all';

interface SelfEffect {
  volatileStatus?: ID;
  boosts?: Partial<BoostsTable>;
}

interface SecondaryEffect {
  chance?: number;
  boosts?: Partial<BoostsTable>;
  self?: SelfEffect;
  status?: StatusName;
  volatileStatus?: ID;
}

type ContestType = 'Cool' | 'Beautiful' | 'Cute' | 'Clever' | 'Tough';

interface CommonMove<TypeT, ItemT, MoveT> {
  accuracy: number | true;
  basePower: number;
  flags: MoveFlags;
  pp: number;
  target: MoveTarget;
  type: TypeT;

  alwaysCrit?: boolean;
  alwaysHit?: boolean;
  basePowerModifier?: number;
  boosts?: Partial<BoostsTable> | false
  bypassesProtect?: boolean;
  category: MoveCategory;
  contestType?: ContestType;
  critModifier?: number;
  critRatio?: number;
  damage?: number | 'level';
  defensiveCategory?: MoveCategory;
  drain?: [number, number]; // fraction
  forceSTAB?: boolean;
  forceSwitch?: boolean;
  givesHealth?: boolean;
  hasCustomRecoil?: boolean;
  hasPriority?: boolean;
  hasSecondaryEffect?: boolean;
  heal?: [number, number]; // fraction
  ignoreAbility?: boolean;
  ignoreAccuracy?: boolean;
  ignoreDefensive?: boolean;
  ignoreEvasion?: boolean;
  ignoreImmunity?: boolean | TypeT;
  ignoreNegativeOffensive?: boolean;
  ignoreOffensive?: boolean;
  ignorePositiveDefensive?: boolean;
  ignorePositiveEvasion?: boolean;
  ignoresBurn?: boolean;
  ignoresDefenseBoosts?: boolean;
  infiltrates?: boolean;
  isFutureMove?: boolean;
  isSpread?: boolean | 'allAdjacent';
  isZ?: ItemT;
  multiaccuracy?: boolean;
  multihit?: number | [number, number]; // range
  noCopy?: boolean;
  noDamageVariance?: boolean;
  noFaint?: boolean;
  noMetronome?: MoveT[];
  noPPBoosts?: boolean;
  noSketch?: boolean;
  nonGhostTarget?: string;
  ohko?: true | 'Ice'; // TODO: better type here?
  percentHealed?: number;
  pressureTarget?: string;
  priority?: number;
  pseudoWeather?: string:
  recoil?: [number, number]; // fraction
  secondaries?: SecondaryEffect[];
  self?: SelfEffect;
  selfBoost?: {boosts?: Partial<BoostsTable>};
  selfSwitch?: ID | boolean;
  selfdestruct?: 'always' | 'ifHit';
  sideCondition?: ID;
  sleepUsable?: boolean;
  slotCondition?: string;
  spreadHit: boolean;
  spreadModifier?: number;
  stallingMove?: boolean;
  status?: StatusName;
  stealsBoosts?: boolean;
  terrain?: string;
  thawsTarget?: boolean;
  useSourceDefensive?: boolean;
  useTargetOffensive?: boolean;
  usesHighestAttackStat?: boolean;
  volatileStatus?: ID;
  weather?: WeatherName;
  willCrit?: boolean;
  zMove?: {
    boosts?: Partial<BoostsTable>;
    effect?: ID;
    power?: number;
  }
}

interface JSONMove extends Data & CommonMove<ID, ID, ID> {}
interface Move extends Data & CommonMove<Type, Item, Move> {
  kind: 'Move';
  noMetronome: Move[];
  secondaries: SecondaryEffect[];

  toJSON(): JSONMove;
}

class Moves {
  getByID(id: ID): Move | undefined;
  next(): {value: Move, done: boolean};
}

// species.ts

type GenderName = 'M' | 'F' | 'N';
type UsageTierName = 'OU' | 'UU' | 'RU' | 'NU' | 'PU';
type TierName = UsageTierName | 'Uber' | 'UUBL' | 'RUBL' | 'NUBL' | 'PUBL';

interface CommonSpeciesAbilities<AbilityT> = {0: AbilitT, 1?: AbilityT, H?: AbilityT, S?: AbilityT};

interface CommonSpecies<AbilityT, ItemT, MoveT, SpeciesT, TypeT> {
  num: number;
  abilities: SpeciesAbilities<AbilityT>;
  baseForme?: SpeciesT;
  baseSpecies?: SpeciesT;
  baseStats: StatsTable;
  battleOnly?: boolean;
  cosmeticForms?: SpeciesT[];
  doublesTier?: TierName;
  eventOnly?: boolean;
  evos?: SpeciesT[];
  formeLetter?: string;
  forme?: string;
  isMega?: boolean;
  isPrimal?: boolean;
  isTotem?: boolean;
  maleOnlyHidden?: boolean
  maxHP?: number;
  nfe: boolean;
  otherFormes?: SpeciesT[];
  prevo?: SpeciesT;
  requiredAbility?: AbilityT;
  requiredItems?: ItemT[];
  requiredMove?: MoveT;
  tier?: TierName;
  types: TypeT[];
  unreleasedHidden?: boolean
  weightkg: number;
}

interface JSONSpecies extends JSONData & CommonSpecies<ID, ID, ID, ID, ID> {}
interface Species extends Data & CommonSpecies<Ability, Item, Move, Species, Type> {
  type 'Species';
  cosmeticForms: Species[];
  otherFormes: Speces[];
  requiredItems: Item[];

  toJSON(): JSONSpecies;
}

// TODO: name collision :(
class Species {
  getName(name: string): string;
  getByID(id: ID): Species | undefined;
  next(): {value: Species, done: boolean};
}

// species-details.ts

// TODO: create EggGroup and Color enum types?
type EvoType = 'trade' | 'stone' | 'levelMove' | 'levelExtra' | 'levelFriendship' | 'levelHold';

interface CommonEventInfo<NatureT, AbilityT, MoveT> {
  generation: Generation;
  level?: number;
  shiny?: 'always' | 'never' | 'possible';
  gender?: GenderName;
  nature?: NatureName;
  ivs?: Partial<StatsTable>;
  perfectIVs?: number;
  isHidden?: boolean;
  abilities?: AbilityT[];
  maxEggMoves?: number;
  moves?: MoveT[];
  pokeball?: ID;
  from?: string;
}

interface JSONEventInfo extends CommonEventInfo<NatureName, ID, ID> {}
interface EventInfo extends CommonEventInfo<NatureName, Ability, Move> {}

type MoveSource = string;

interface CommonSpeciesDetails<EventInfoT, ItemT, MoveT> {
  canHatch?: boolean;
  color: string; // Color
  eggGroups?: string[]; // EggGroup
  encounters?: EventInfoT[]
  eventPokemon?: EventInfoT[];
  evoDetails?: {
    type: EvoType;
    condition?: string;
    level?: number;
    item?: ItemT;
    move?: MoveT;
  };
  gender?: GenderName;
  genderRatio?: {M: number, F: number};
  heightm: number;
  learnset: Map<ID, MoveSource[]>;
}

interface JSONSpeciesDetails extends CommonSpeciesDetails<JSONEventInfo, ID, ID> {}
interface SpeciesDetails extends CommonSpeciesDetails<EventInfo, Item, Move> {
  eggGroups: string[]; // EggGroup
  encounters: EventInfoT[]
  eventPokemon: EventInfoT[];

  toJSON(): JSONSpeciesDetails;
}

// TODO: name collision :(
class SpeciesDetails {
  static forGen(gen: Generation, mod?: Mod): Promise<SpeciesDetails>;

  getByID(id: ID): SpeciesDetails | undefined;
}

// stats.ts

type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type StatsTable<T = number> = {[stat in StatName]: T};
type BoostName = Exclude<StatName, 'hp'> | 'accuracy' | 'evasion';
type BoostsTable<T = number> = {[boost in BoostName]: T};

export class Stats {
  static calc(stat: Stat, base: number, iv: number, ev: number, level: number, gen?: Generation);
  static calc(stat: Stat, base: number, iv: number, ev: number, level: number, nature: Nature, gen?: Generation);

  static getByID(id: ID): StatName | undefined;
  static display(s: string, full: boolean = true): string;

  static fill(p: Partial<StatsTable<T>>, val: T): StatsTable<T>;
  static itod(iv: number): number;
  static dtoi(dv: number): number;
  static getHPDV(pivs: Partial<StatsTable>): number;
}

// sets.ts

interface CommonPokemonSet<AbilityT, ItemT, MoveT, SpeciesT, NatureT, TypeT> {
  name?: string;
  species: SpeciesT;
  item?: ItemT;
  ability?: AbilityT;
  moves: MoveT[];
  nature?: NatureT;
  gender?: GenderName;
  evs?: StatsTable;
  ivs?: StatsTable;
  level?: number;
  shiny?: boolean;
  happiness?: number;
  hpType?: TypeT;
  pokeball?: ID;
}

interface JSONPokemonSet extends CommonPokemonSet<ID, ID, ID, ID, NatureName, TypeName> {}
interface PokemonSet extends Required<CommonPokemonSet<Ability, Item, Move, Species, Nature, Type>> {
  toJSON(): JSONPokemonSet;
}

class Sets {
  export(set: PokemonSet, compact: boolean = false): string;
  import(str: string): PokemonSet;
}

// teams.ts

class Teams {
  export(team: PokemonSet[], compact: boolean = false): string;
  exportAll(team: PokemonSet[][], compact: boolean = false): string;
  import(str: string): PokemonSet[];
  importAll(str: string): PokemonSet[][];
}

// types.ts

type TypeName =
  'Normal' | 'Fighting' | 'Flying' | 'Poison' | 'Ground' | 'Rock' | 'Bug' | 'Ghost' | 'Steel' |
  'Fire' | 'Water' | 'Grass' | 'Electric' | 'Psychic' | 'Ice' | 'Dragon' | 'Dark' | 'Fairy' | '???';

type TypeEffectiveness = 'normal' | 'weakness' | 'resistance' | 'immunity';

interface CommonType {
  name: TypeName;
  category?: MoveCategory;
  HPIVs: Partial<StatsTable>;
  HPDVs: Partial<StatsTable>;
}

interface JSONType extends CommonType {
  damageTaken: {[type: TypeName]: TypeEffectiveness};
}

interface Type extends CommonType {
  id: ID;
  gen: Generation;
  damageTaken: Map<Type, TypeEffectiveness>;
}

class Types {
  getByID(id: ID): Type | undefined;
  hiddenPower(pivs: Partial<StatsTable>): {type: Type, basePower: number} | undefined;
  next(): {value: Type, done: boolean};
}

// dex.ts

class Dex {
  static forGen(gen: Generation, mod?: Mod): Promise<Dex>;

  gen: Generation;

  abilities: Abilities;
  items: Items;
  moves: Moves;
  natures: Natures;
  sets: Sets;
  species: Species;
  stats: Stats;
  teams: Teams;
  types: Types;

  // NB: Descriptions and SpeciesDetails have their own APIs
}

// descriptions.ts

type Language =
  'de' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja'
  'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'tw' | 'zh';

class Descriptions {
  static forGen(gen: Generation, mod?: Mod, lang: Language = 'en'): Promise<Descriptions>;

  full(data: Data): string;
  short(data: Data): string;
}
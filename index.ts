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

// ---------- core.ts ----------

type ID = '' | string & {__isID: true};
declare function toID(s: string): ID;

type primitive = string | number | boolean | undefined | null;
type DeepReadonly<T> = T extends primitive ? T : DeepReadonlyObject<T>;
type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

type Nullable<T> = {
  [P in keyof T]: Nullable<T[P]> | null;
}

// ---------- conditions.ts ----------

type WeatherName =
  | 'Sand'
  | 'Sun'
  | 'Rain'
  | 'Hail'
  | 'Harsh Sunshine'
  | 'Heavy Rain'
  | 'Strong Winds';

type Terrain =
  | 'Psychic'
  | 'Misty'
  | 'Electric'
  | 'Grassy';

// TODO: volatiles/slot/side condition enums?

type StatusName = 'PAR' | 'PSN' | 'FRZ' | 'SLP' | 'BRN' | 'TOX';

// ---------- data.ts ----------

type DataKind = 'Ability' | 'Move' | 'Item' | 'Species';
type Nonstandard = 'Glitch' | 'Past' | 'Future' | 'CAP' | 'LGPE' | 'Pokestar' | 'Custom';

interface JSONData extends Nullable<Omit<Data, 'id' | 'kind' | 'num' | 'gen'>> {}
interface Data {
  id: ID;
  kind: DataKind;
  name: string;
  gen: Generation;
  isUnreleased?: boolean;
  isNonstandard?: Nonstandard;
}

// ---------- natures.ts ----------

type NatureName = 'Adamant' | 'Bashful' | 'Bold' | 'Brave' | 'Calm' | 'Careful' | 'Docile' | 'Gentle' |
  'Hardy' | 'Hasty' | 'Impish' | 'Jolly' | 'Lax' | 'Lonely' | 'Mild' | 'Modest' | 'Naive' | 'Naughty' |
  'Quiet' | 'Quirky' | 'Rash' | 'Relaxed' | 'Sassy' | 'Serious' | 'Timid';

interface Nature extends DeepReadonly<{
  id: ID;
  name: NatureName;
  plus?: StatName;
  minus?: StatName;

  toJSON(): JSONNature;
}> {}
interface JSONNature extends Nullable<Omit<Nature, 'id'>> {};

interface Natures {
  get(id: ID): Nature | undefined;
  [Symbol.iterator](): IterableIterator<Nature>;
}

// ---------- abilities.ts ----------

interface CommonAbility {
  suppressesWeather?: boolean;
  isUnsuppressible?: boolean;
}

interface JSONAbility extends Nullable<JSONData & CommonAbility> {}
interface Ability extends DeepReadonly<Data & CommonAbility & {
  kind: 'Ability';

  toJSON(): JSONAbility;
}> {}

interface Abilities {
  get(id: ID): Ability | undefined;
  [Symbol.iterator](): IterableIterator<Ability>;
}

// ---------- items.ts ----------

interface CommonItem<MoveT, SpeciesT, TypeT> {
  fling?: {
    basePower: number;
    status?: StatusName;
    volatileStatus?: ID;
  };
  forcedForme?: SpeciesT;
  ignoreKlutz?: boolean;
  infiltrates?: boolean;
  isBerry?: boolean;
  isChoice?: boolean;
  isGem?: boolean;
  isPokeball?: boolean;
  megaEvolves?: SpeciesT;
  megaStone?: SpeciesT;
  naturalGift?: {
    basePower: number;
    type: TypeT;
  };
  onDrive?: TypeT;
  onMemory?: TypeT;
  onPlate?: TypeT;
  status?: StatusName;
  weather?: WeatherName;
  zMove?: {
    type: TypeT;
  } | {
    move: MoveT;
    from: MoveT;
    user: SpeciesT[];
  };
}

interface JSONItem extends Nullable<JSONData & CommonItem<ID, ID, ID>> {}
interface Item extends DeepReadonly<Data & CommonItem<Move, Species, Type> & {
  kind: 'Item';

  toJSON(): JSONItem;
}> {}

interface Items {
  get(id: ID): Item | undefined;
  [Symbol.iterator](): IterableIterator<Item>;
}

// ---------- moves.ts ----------

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

type MoveCategory = 'Physical' | 'Special' | 'Status';

type MoveTarget =
  // single-target
  'Normal' | 'Any' | 'AdjacentAlly' | 'AdjacentFoe' | 'AdjacentAllyOrSelf' |
  // single-target, automatic
  'Self' | 'RandomNormal' |
  // spread
  'AllAdjacent' | 'AllAdjacentFoes' |
  // side and field
  'AllySide' | 'FoeSide' | 'All';

interface SelfEffect extends DeepReadonly<{
  volatileStatus?: ID;
  boosts?: Partial<BoostsTable>;
}> {}

interface SecondaryEffect extends DeepReadonly<{
  chance?: number;
  boosts?: Partial<BoostsTable>;
  self?: SelfEffect;
  status?: StatusName;
  volatileStatus?: ID;
}> {}

type ContestType = 'Cool' | 'Beautiful' | 'Cute' | 'Clever' | 'Tough';

interface CommonMove<ItemT, MoveT, TypeT> extends DeepReadonly<{
  accuracy: number | 'Bypass';
  basePower: number;
  flags: MoveFlags;
  pp: number;
  target: MoveTarget;
  type: TypeT;

  alwaysCrit?: boolean;
  alwaysHit?: boolean;
  boosts?: Partial<BoostsTable>;
  bypassesProtect?: boolean;
  category: MoveCategory;
  contestType?: ContestType;
  critRatio?: number | 'Always';
  damage?: number | 'Level';
  defensiveCategory?: MoveCategory;
  drain?: number; // fraction
  forceSwitch?: boolean;
  givesHealth?: boolean;
  heal?: number; // fraction
  ignoreAbility?: boolean;
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
  isSpread?: boolean | 'AllAdjacent';
  isZ?: ItemT;
  multiaccuracy?: boolean;
  multihit?: [number, number]; // range
  noCopy?: boolean;
  noDamageVariance?: boolean;
  noFaint?: boolean;
  noMetronome?: MoveT[];
  noPPBoosts?: boolean;
  noSketch?: boolean;
  ohko?: true | 'Ice'; // TODO: better type here?
  percentHealed?: number;
  pressureTarget?: string;
  priority?: number;
  pseudoWeather?: string;
  recoil?: number | 'Custom'; // fraction
  secondaries?: SecondaryEffect[];
  self?: SelfEffect;
  selfBoost?: {boosts?: Partial<BoostsTable>};
  selfSwitch?: ID | boolean;
  selfdestruct?: 'Always' | 'IfHit';
  sideCondition?: ID;
  sleepUsable?: boolean;
  slotCondition?: string;
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
  zMove?: {
    boosts?: Partial<BoostsTable>;
    effect?: ID;
    power?: number;
  }
}> {}

interface JSONMove extends Nullable<Data & CommonMove<ID, ID, ID>> {}
interface Move extends DeepReadonly<Data & CommonMove<Item, Move, Type> & {
  kind: 'Move';

  noMetronome: Move[];
  secondaries: SecondaryEffect[];

  toJSON(): JSONMove;
}> {}

interface Moves {
  get(id: ID): Move | undefined;
  [Symbol.iterator](): IterableIterator<Move>;
}

// ---------- species.ts ----------

type GenderName = 'M' | 'F' | 'N';
type UsageTierName = 'OU' | 'UU' | 'RU' | 'NU' | 'PU';
type TierName = UsageTierName | 'Uber' | 'UUBL' | 'RUBL' | 'NUBL' | 'PUBL';

interface SpeciesAbilities<AbilityT> extends DeepReadonly<{
  0: AbilityT;
  1?: AbilityT;
  H?: AbilityT;
  S?: AbilityT;
}> {};

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

interface JSONSpecies extends Nullable<JSONData & CommonSpecies<ID, ID, ID, ID, ID>> {}
interface Species extends DeepReadonly<Data & CommonSpecies<Ability, Item, Move, Species, Type> & {
  type: 'Species';

  cosmeticForms: Species[];
  otherFormes: Species[];
  requiredItems: Item[];

  toJSON(): JSONSpecies;
}> {}

interface SpeciesSummaries {
  getName(name: string): string;
  get(id: ID): Species | undefined;
  [Symbol.iterator](): IterableIterator<Species>;
}

// ---------- species-details.ts ----------

// TODO: create EggGroup and Color enum types?

type EvoType = 'Trade' | 'Stone' | 'LevelMove' | 'LevelExtra' | 'LevelFriendship' | 'LevelHold';

interface CommonEventInfo<AbilityT, MoveT, NatureT> {
  generation: Generation;
  level?: number;
  shiny?: 'Always' | 'Never' | 'Possible';
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

interface JSONEventInfo extends Nullable<CommonEventInfo<ID, ID, NatureName>> {}
interface EventInfo extends DeepReadonly<CommonEventInfo<Ability, Move, Nature>> {}

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

interface JSONSpeciesDetails extends Nullable<CommonSpeciesDetails<JSONEventInfo, ID, ID>> {}
interface SpeciesDetails extends DeepReadonly<CommonSpeciesDetails<EventInfo, Item, Move> & {
  eggGroups: string[]; // EggGroup
  encounters: EventInfo[]
  eventPokemon: EventInfo[];

  toJSON(): JSONSpeciesDetails;
}> {}

// FIXME: name collision :(
interface SpeciesDetails {
  static forGen(gen: Generation, mod?: Mod): Promise<SpeciesDetails>;

  get(id: ID): SpeciesDetails | undefined;
}

// ---------- stats.ts ----------

type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type StatsTable<T = number> = {[stat in StatName]: T};
type BoostName = Exclude<StatName, 'hp'> | 'accuracy' | 'evasion';
type BoostsTable<T = number> = {[boost in BoostName]: T};

class Stats {
  static calc(
    stat: StatName,
    base: number,
    iv: number /* = 31 */, 
    ev: number /* = 252 */,
    level: number /* = 100 */,
    nature?: Nature,
    gen?: GenerationNumber);

  static get(id: ID): StatName | undefined;
  static display(s: string, full: boolean  /* = true */): string;

  static fill<T>(p: Partial<StatsTable<T>>, val: T): StatsTable<T>;
  static itod(iv: number): number;
  static dtoi(dv: number): number;
  static getHPDV(pivs: Partial<StatsTable>): number;
}

// ---------- sets.ts ----------

interface CommonPokemonSet<AbilityT, ItemT, MoveT, NatureT, SpeciesT, TypeT> {
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

interface JSONPokemonSet extends Nullable<CommonPokemonSet<ID, ID, ID, NatureName, ID, TypeName>> {}
interface PokemonSet extends DeepReadonly<Required<CommonPokemonSet<Ability, Item, Move, Nature, Species, Type>> & {
  toJSON(): JSONPokemonSet;
}> {}

interface Sets {
  export(set: PokemonSet, compact: boolean /* = false */): string;
  import(str: string): PokemonSet;
}

// ---------- teams.ts ----------

interface Teams {
  export(team: PokemonSet[], compact: boolean /* = false */): string;
  exportAll(team: PokemonSet[][], compact: boolean /* = false */): string;
  import(str: string): PokemonSet[];
  importAll(str: string): PokemonSet[][];
}

// ---------- types.ts ----------

type TypeName =
  'Normal' | 'Fighting' | 'Flying' | 'Poison' | 'Ground' | 'Rock' | 'Bug' | 'Ghost' | 'Steel' |
  'Fire' | 'Water' | 'Grass' | 'Electric' | 'Psychic' | 'Ice' | 'Dragon' | 'Dark' | 'Fairy' | '???';

type TypeEffectiveness = 'Normal' | 'Weakness' | 'Resistance' | 'Immunity';

interface CommonType {
  name: TypeName;
  category?: MoveCategory;
  HPIVs: Partial<StatsTable>;
  HPDVs: Partial<StatsTable>;
}

interface JSONType extends Nullable<CommonType & {
  damageTaken: {[type in TypeName]: TypeEffectiveness};
}> {}

interface Type extends DeepReadonly<CommonType & {
  id: ID;
  gen: Generation;
  damageTaken: Map<Type, TypeEffectiveness>;
}> {}

interface Types {
  get(id: ID): Type | undefined;
  hiddenPower(pivs: Partial<StatsTable>): {type: Type, basePower: number} | undefined;
  [Symbol.iterator](): IterableIterator<Type>;
}

// ---------- gen.ts ----------

type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
// NOTE: CAP is not currently considered a mod but should be...
type Mod = 'LGPE' | 'Stadium' | 'CAP' | 'SSB' | 'Next' | 'PiC' | 'Mix And Mega' | 'VGC 17';

interface Generation extends DeepReadonly<{
  num: GenerationNumber;
  mod?: Mod;

  abilities: Abilities;
  items: Items;
  moves: Moves;
  natures: Natures;
  sets: Sets;
  species: SpeciesSummaries;
  stats: Stats;
  teams: Teams;
  types: Types;
}> {}

interface Generations {
  static get(generation: GenerationNumber, mod?: Mod): Promise<Generation>;
}

// ---------- descriptions.ts ----------

type Language =
  'de' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja' |
  'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'tw' | 'zh';

interface Descriptions {
  static forGen(gen: Generation, lang: Language /* = 'en' */): Promise<Descriptions>;

  full(data: Data): string;
  short(data: Data): string;
}

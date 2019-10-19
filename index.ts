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

// ---------- data.ts ----------

type DataKind = 'Ability' | 'Move' | 'Item' | 'Species';

interface JSONData extends Nullable<Omit<Data, 'id' | 'kind' | 'num' | 'gen'>> {}
interface Data {
  id: ID;
  kind: DataKind;
  name: string;
  gen: Generation;
  desc: string;
  shortDesc: string;
}

// ---------- items.ts ----------

interface CommonItem<SpeciesT> {
  megaEvolves?: SpeciesT;
  weather?: WeatherName;
}

interface JSONItem extends Nullable<JSONData & CommonItem<ID>> {}
interface Item extends DeepReadonly<Data & CommonItem<Species> & {
  kind: 'Item';
}> {}

class Items {
  get(id: ID): Item | undefined {
    return undefined;
  }
  [Symbol.iterator](): IterableIterator<Item> {

  }
}

// ---------- moves.ts ----------

interface CommonMove<MoveT> extends DeepReadonly<{
  basePower: number;
  pp: number;
  noMetronome: MoveT[];
}> {}

interface JSONMove extends Nullable<Data & CommonMove<ID>> {}
interface Move extends DeepReadonly<Data & CommonMove<Move> & {
  kind: 'Move';
  noMetronome: Move[];
}> {}

class Moves {
  get(id: ID): Move | undefined {
    return undefined;
  }
  [Symbol.iterator](): IterableIterator<Move> {

  }
}

// ---------- species.ts ----------

interface CommonSpecies<ItemT, MoveT, SpeciesT> {
  num: number;
  evos?: SpeciesT[];
  requiredItems?: ItemT[];
  requiredMove?: MoveT;
}

interface JSONSpecies extends Nullable<JSONData & CommonSpecies<ID, ID, ID>> {}
interface Species extends DeepReadonly<Data & CommonSpecies<Item, Move, Species> & {
  type: 'Species';
  requiredItems: Item[];
}> {}

class SpeciesSummaries {
  get(id: ID): Species | undefined {
    return undefined;
  }
  [Symbol.iterator](): IterableIterator<Species> {

  }
}

// ---------- gen.ts ----------

type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
// NOTE: CAP is not currently considered a mod but should be...
type Mod = 'LGPE' | 'Stadium' | 'CAP' | 'SSB' | 'Next' | 'PiC' | 'Mix And Mega' | 'VGC 17';

type Language =
  'de' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja' |
  'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'tw' | 'zh';

interface Generation extends DeepReadonly<{
  num: GenerationNumber;
  mod?: Mod;

  items: Items;
  moves: Moves;
  species: SpeciesSummaries;
}> {}

class Generations {
  static async get(generation: GenerationNumber, mod?: Mod, lang: Language = 'en'): Promise<Generation> {
    
  }
}

type ID = '' | string & {__isID: true};
declare function toID(s: string): ID;

type primitive = string | number | boolean | undefined | null | Function | ID;
type DeepReadonly<T> = T extends primitive ? T : DeepReadonlyObject<T>;
type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}

type Nullable<T> = T extends primitive ? T : NullableObject<T>;
type NullableObject<T> = {
  [P in keyof T]: Nullable<T[P]> | null;
}

// ---------- data.ts ----------

type DataKind = 'Item' | 'Species';

interface JSONData extends Nullable<Omit<Data, 'id' | 'kind' | 'gen'>> {}
interface Data {
  id: ID;
  kind: DataKind;
  name: string;
  gen: Generation;
}

// ---------- items.ts ----------

interface CommonItem<SpeciesT> {
  megaEvolves?: SpeciesT;
}

interface JSONItem extends Nullable<JSONData & CommonItem<ID>> {}
interface Item extends DeepReadonly<Data & CommonItem<Species> & {
  kind: 'Item';
}> {}

// ---------- species.ts ----------

interface CommonSpecies<ItemT,SpeciesT> {
  num: number;
  evos?: SpeciesT[];
  requiredItems?: ItemT[];
}

interface JSONSpecies extends Nullable<JSONData & CommonSpecies<ID, ID>> {}
interface Species extends DeepReadonly<Data & CommonSpecies<Item, Species> & {
  kind: 'Species';
  requiredItems: Item[];
}> {}


// ---------- gen.ts ----------

type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Generation extends DeepReadonly<{
  num: GenerationNumber;
  items: Items;
  species: SpeciesSummaries;
}> {}

/////////// IMPL ///////////

class GenerationImpl implements Generation {
  num: GenerationNumber;
  items: Items;
  species: SpeciesSummaries;

  constructor(num: GenerationNumber, items: Items, species: SpeciesSummaries) {
    this.num = num;
    this.items = items;
    this.species = species;
  }
}

class Generations {
  // not the correct signature, but for this example with one gen, no mods or langs and no loading its sufficient
  static get(): Promise<Generation> {
    // FIXME: generations API needs items/species APIs, but species/items APIs needs generations API to resolve references 
  }
}
// NB: obviously would use caching etc
class Items  {
  private readonly gen: Generation;
  private readonly json: {[id: string]: JSONItem} = {
    "charizarditey": {
        "name": "Charizardite Y",
        "megaEvolves": "charizard" as ID
    },
    "charizarditex": {
        "name": "Charizardite X",
        "megaEvolves": "charizard" as ID
    },
    "leftovers": {
        "name": "Leftovers"
    }
  };

  constructor(gen: Generation) {
    this.gen = gen;
  }

  get(id: ID): Item | undefined {
    const data = this.json[id];
    return data ? new ItemImpl(this.gen, data) : undefined;
  }
}

abstract class DataImpl implements Data {
  gen: Generation;
  name: string;
  id: ID;

  abstract kind: DataKind;

  constructor(gen: Generation, name: string) {
    this.id = toID(name);
    this.gen = gen;
  }
}

class ItemImpl extends DataImpl implements Item {
  kind: 'Item';

  private readonly data: JSONItem;

  constructor(gen: Generation, data: JSONItem) {
    super(gen, data.name);
    this.data = data;
  }

  // obviously would use caching etc
  get megaEvolves() {
    if (!this.data.megaEvolves) return undefined;
    return this.gen.species.get(this.data.megaEvolves);
  }
}

class SpeciesSummaries {
  private readonly gen: Generation;
  private readonly json:{[id: string]: JSONSpecies} = {
    "charmander": {
        "num": 4,
        "name": "Charmander",
        "evos": ["charmeleon"] as ID[],
    },
    "charmeleon": {
        "num": 5,
        "name": "Charmeleon",
        "evos": ["charizard"] as ID[],
        "requiredItems": ["leftovers"] as ID[]
    },
    "charizard": {
        "num": 6,
        "name": "Charizard",
        "requiredItems": ["charizarditex", "charizarditey"] as ID[]
  
    },
    "marshadow": {
        "num": 999,
        "name": "Marshadow"
    }
  };

  constructor(gen: Generation) {
    this.gen = gen;
  }

  get(id: ID): Species | undefined {
    const data = this.json[id];
    return data ? new SpeciesImpl(this.gen, data) : undefined;
  }
}

class SpeciesImpl extends DataImpl implements Species {
  kind: 'Species';
  num: number;
  data: JSONSpecies;

  constructor(gen: Generation, data: JSONSpecies) {
    super(gen, data.name);
    this.num = data.num;  
  }

  get evos() {
    if (!this.data.evos) return undefined;
    return this.data.evos.map(evo => this.gen.species.get(evo));
  }

  get requiredItems() {
    if (!this.data.requiredItems) return undefined;
    return this.data.requiredItems.map(item => this.gen.items.get(item));
  }
}

/////////// EXTENSION ///////////

interface SpeciesDetails {
  color: string;
}

const detailsJSON = {
  "charmander": {
      "color": "Red"
  },
  "charmeleon": {
      "color": "Red"
  },
  "charizard": {
      "color": "Red"
  },
  "marshadow": {
      "color": "Black"
  }
};

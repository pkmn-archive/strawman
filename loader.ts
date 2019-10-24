type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Mod = 'LGPE' | 'Stadium' | 'CAP' | 'SSB' | 'Next' | 'PiC' | 'Mix And Mega' | 'VGC 17';
type Language =
  'de' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja' |
  'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'tw' | 'zh';

//  lol horrible, horrible naming from here on
type DataType = 'abilities' | 'items' | 'moves' | 'species' | 'details' | 'types'; // natures?, aliases?

interface GenerationInfo<T> extends T {
  data: T;
  mods: { [mod in  Mod]?: T };
}

interface DataFiles {
  types: DataType[],
  languages?: Language[];
}

interface JSONSources {
  abilities?: JSONAbility[];
  items?: JSONItem[];
  moves?: JSONMove[];
  species?: JSONSpecies[];
  details?: JSONSpeciesDetails[];
  types?: JSONType[];
  text?: {[lang in Language]?: JSONDescriptions};
}

type GenerationFiles = GenerationInfo<DataFiles>[];
type GenerationSources = GenerationInfo<JSONSources>[];

import * as mapping from './data/mapping.json';
import * as aliases from './data/aliases.json';

import * as abilities from  './data/gen7/abilities.json';
import * as items from  './data/gen7/items.json';
import * as moves from  './data/gen7/moves.json';
import * as species from  './data/gen7/species.json';
import * as types from  './data/gen7/types.json';

// NB: Even though lang = 'en' is the default, its not included in the default sources!
// ie/ if you load through the async Generations.get() API you get the descriptions, but
// if you don't call get and just use the object as is you default to no descriptions
// (you can't send back bytes you don't want after the fact).
const Generations = new class {
  // What's available?
  readonly mapping: GenerationFiles;
  // What do we already have?
  readonly sources: GenerationSources;

  constructor(mapping: GenerationFiles, current: JSONSources) {
    this.mapping = mapping;
    this.sources = new Array(mapping.length);
    for (let i = 0; i < mapping.length; i++) {
      this.sources[i] = {
        data: i === mapping.length - 1 ? current : {},
        mods: {},
      };
    }
  }

  // GOTCHAS:
  // - json files must never been mutated: `combine(a, b)` must return a NEW object
  // - TODO: track the combined object and reuse THAT instead of recombining:
  //    eg. If we've already loaded gen4 = combine(combine(combine(7, 6), 5), 4)
  //    and want gen 3, do combine(gen4, 3) instead of
  //    combine(combine(combine(combine(7, 6), 5), 4), 3)

  async load(generation: GenerationNumber, opts: {
    lang: Language  | '', mod?: Mod, details: boolean
  } = {lang: 'en', details: false}): Promise<JSONSources> {
    // 1. Detemine what needs to be loaded

    // 2. Execute downloads, combine 


    
    
    
    
    // TODO: to be able to reuse objects, we need the Generation object to expose
    // its current lang and what sources are backing its objects
  }
}(mapping, {
  abilities,
  items,
  moves,
  species,
  types
});

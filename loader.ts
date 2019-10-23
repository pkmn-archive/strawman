type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Mod = 'LGPE' | 'Stadium' | 'CAP' | 'SSB' | 'Next' | 'PiC' | 'Mix And Mega' | 'VGC 17';
type Language =
  'de' | 'en' | 'es' | 'fr' | 'hi' | 'it' | 'ja' |
  'nl' | 'pl' | 'pt' | 'ru' | 'tr' | 'tw' | 'zh';

//  lol horrible, horrible naming from here on
type DataType = 'abilities' | 'items' | 'moves' | 'species' | 'details' | 'types'; // natures?, aliases?

interface Sources {
  abilities: JSONAbility[];
  items: JSONItem[];
  moves: JSONMove[];
  species: JSONSpecies[];
  details?: JSONSpeciesDetails[];
  types: JSONType[];
  text: {[lang in Language]?: JSONDescriptions};
}

type GenerationsData = GenerationData[];
interface GenerationData extends Data {
  mods: { [mod in  Mod]?: Data };
}
interface Data {
  types: DataType[],
  languages: Language[];
}

const Generations {
  sources: {

  }[]



  async load(generation: GenerationNumber, opts: {
    lang: Language  | '', mod?: Mod, details: boolean
  } = {lang: 'en', details: false}): Promise<Sources> {
  }
}

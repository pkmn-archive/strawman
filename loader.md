**Goal:** make it easier to get sliced description/species details data (no
secondary APIs).
**Idea:** add additional params to Generations entry point:

```ts
class Generations {
  static get(generation: GenerationNumber, opts: {
    lang: Language  | '', mod?: Mod, details: boolean
  } = {lang: 'en', details: false}): Promise<Generation>;
  static [Symbol.iterator](): IterableIterator<Generation>;
}
```

`Generations` is a stateful singleton which keeps track of which JSON files
have been downloaded (or need to be downloaded) and only refetches new
information, so:

```ts
const gen = Generations.get(7);
const gen2 = Generations.get(7, {lang: 'fr'});
```

Here, `gen2` will only fetch the `text/fr.json` file for Gen 7 (and it won't
perform any fetches whatsoever if it knows a language doesnt exist).

For descriptions: ad `desc` and `shortDesc` string fields to `GameObject`, BUT
only fetch descriptions if `lang` is not `''`. For applications which have no
need for descriptions there will be no overhead over the wire and minimal 
memory overhead for having the fields set to `''`, which seems like a good
tradeoff given we expect the majority of applications to want to deal with
descriptions.

```ts
interface GameObject {
  ...
  desc: string;
  shortDesc: string;
}
```

Requiring a separated `SpeciesDetailAPI` because of async loading is also
undesirable, and it would be nice to merge the two. There seem to be two options
here: 

  - the `Species` API could have a `getDetail(id: ID): Species & SpeciesDetails
    | undefined` method which throws if the data files haven't been fetched
    (less desirable)
  - parameterize the type returned from the `Species` API such that `get`
    returns `SpeciesT` (which would be `Species & SpeciesDetails` if
    `Generations.get(..., {details: true})` is called. This option requires more
    work, but allows everything to be wrapped up in a single entrypoint.

The main question mark: can we share information between `gen` and `gen2` above?
(or a generation created originally without `{details: true}`)? Given that
`Generations` should be caching the data files we can at least avoid additional
fetches, but is it worth trying to avoid reinitializing objects as well?
Given `GameObject` is meant to be immutable, if we wanted to preserve the rich
object we would have to implement `desc` and `shortDesc` as getters which look
up the descriptions in the `Generation.descriptions` (or similar). 

Switching to `{details: true}` is more problematic, though we can take advantage
of the fact that it only modifies one portion of what `Generation` provides (the
`Species` API`), and as such we can copy over all of the other APIs to the new
`Generation` object and only replace the `Species` API.

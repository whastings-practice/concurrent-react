// Render as you fetch

// http://localhost:3000/isolated/exercises/02

import React from 'react'
import fetchPokemon from '../fetch-pokemon'
import {
  ErrorBoundary,
  createResource,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
} from '../utils'

// By default, all fetches are mocked so we can control the time easily.
// You can adjust the fetch time with this:
// window.FETCH_TIME = 3000
// If you want to make an actual network call for the pokemon
// then uncomment the following line
// window.fetch.restoreOriginalFetch()
// Note that by doing this, the FETCH_TIME will no longer be considered
// and if you want to slow things down you should use the Network tab
// in your developer tools to throttle your network to something like "Slow 3G"

// 🐨 Your goal is to refactor this traditional useEffect-style async
// interaction to suspense with resources. Enjoy!

function PokemonInfo({ pokemonResource}) {
  const pokemon = pokemonResource.read()

  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const pokemonResourceCache = new Map()

const getPokemonResource = (name) => {
  if (pokemonResourceCache.has(name)) {
    return pokemonResourceCache.get(name)
  }
  const resource = createResource(() => fetchPokemon(name, 500))
  pokemonResourceCache.set(name, resource)
  return resource
}

const SUSPENSE_CONFIG = {
  // Loading fallback shows after this many ms.
  timeoutMs: 2000,
  // If loading takes longer than 300ms, keep isPending true until
  // loading state has lasted 700ms
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

function App() {
  const [pokemonName, setPokemonName] = React.useState(null)
  const [pokemonResource, setPokemonResource] = React.useState(null)
  // By default, React waits for 100ms to update the DOM after a component
  // in a Suspense boundary first suspends. This way, if the async result comes
  // back quickly, we won't get a quick flash of the loading fallback. But in this case,
  // waiting makes the UI seem laggy. So we can use useTransition to override it.
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)

  function handleSubmit(newPokemonName) {
    // Leaving this outside of startTransition lets it update immediately
    setPokemonName(newPokemonName)
    // Use startTransition to make state changes that will result in a component in a Suspense
    // boundary suspending
    startTransition(() => {
      setPokemonResource(getPokemonResource(newPokemonName))
    })
  }

  return (
    <div>
      <PokemonForm onSubmit={handleSubmit} />
      <hr />
      <div
        // Use isPending to show the user a more subtle loading indicator before the
        // loading fallback switches on
        className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}
      >
        {pokemonResource ? (
          <ErrorBoundary>
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </ErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}

export default App

// Render as you fetch

// http://localhost:3000/isolated/exercises/02

import React from 'react'
import fetchPokemon, { getImageUrlForPokemon } from '../fetch-pokemon'
import {
  ErrorBoundary,
  createResource,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
} from '../utils'

const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.src = src
    img.onload = () => resolve(src)
  })
}

function PokemonInfo({ pokemonResources }) {
  const pokemon = pokemonResources.data.read()
  const imageSrc = pokemonResources.image.read()

  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={imageSrc} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const pokemonResourcesCache = new Map()

const getPokemonResources = (name) => {
  if (pokemonResourcesCache.has(name)) {
    return pokemonResourcesCache.get(name)
  }

  const dataResource = createResource(() => fetchPokemon(name, 500))
  // Load image with a suspense resource so Suspense will wait until both the
  // pokemon data and its image have loaded before ending the loading state.
  const imageResource = createResource(() => preloadImage(getImageUrlForPokemon(name)))
  const resources = { data: dataResource, image: imageResource }

  pokemonResourcesCache.set(name, resources)
  return resources
}

const SUSPENSE_CONFIG = {
  // Loading fallback shows after this many ms.
  timeoutMs: 2000,
  // If loading takes longer than 300ms, keep isPending true until
  // loading state has lasted 700ms
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

const usePokemonResources = (name) => {
  const [pokemonResources, setPokemonResources] = React.useState(null)
  // By default, React waits for 100ms to update the DOM after a component
  // in a Suspense boundary first suspends. This way, if the async result comes
  // back quickly, we won't get a quick flash of the loading fallback. But in this case,
  // waiting makes the UI seem laggy. So we can use useTransition to override it.
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)

  // Right now, startTransition doesn't work with useEffect
  React.useLayoutEffect(() => {
    if (!name) {
      return
    }

    // Use startTransition to make state changes that will result in a component in a Suspense
    // boundary suspending
    startTransition(() => {
      setPokemonResources(getPokemonResources(name))
    })
  }, [name]) // Re-run effect when name changes

  return { pokemonResources, isPending }
}

function App() {
  const [pokemonName, setPokemonName] = React.useState(null)
  const { pokemonResources, isPending } = usePokemonResources(pokemonName)

  function handleSubmit(newPokemonName) {
    // Leaving this outside of startTransition lets it update immediately
    setPokemonName(newPokemonName)
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
        {pokemonResources ? (
          <ErrorBoundary>
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResources={pokemonResources} />
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

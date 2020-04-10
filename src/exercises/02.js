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

const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.src = src
    img.onload = () => resolve(src)
  })
}

const imageResourceCache = new Map()

const getImageResource = (src) => {
  if (imageResourceCache.has(src)) {
    return imageResourceCache.get(src)
  }

  const resource = createResource(() => preloadImage(src))
  imageResourceCache.set(src, resource)
  return resource
}

const Image = (props) => {
  const imageResource = getImageResource(props.src)

  return (
    // Load image with a suspense resource so Suspense will wait until both the
    // pokemon data and its image have loaded before ending the loading state.
    <img src={imageResource.read()} {...props} />
  )
}

function PokemonInfo({ pokemonResource}) {
  const pokemon = pokemonResource.read()

  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <Image src={pokemon.image} alt={pokemon.name} />
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

// Simple Data-fetching

// http://localhost:3000/isolated/exercises/01

import React from 'react'
import { PokemonDataView, PokemonInfoFallback } from '../utils'
// 🐨 you'll need to import the fetchPokemon function
// 💰 here you go:
import fetchPokemon from '../fetch-pokemon'
// 💰 use it like this: fetchPokemon(pokemonName).then(handleSuccess, handleFailure)

// you'll also need the ErrorBoundary component from utils
// 💰 here you go:
import { ErrorBoundary } from '../utils'
// 💰 use it like this: <ErrorBoundary><SomeOtherComponents /></ErrorBoundary>

const createResource = (asyncFn) => {
  let error
  let result
  const promise = asyncFn().then(
    (r) => result = r,
    (e) => error = e,
  )
  return {
    read() {
      if (error) {
        throw error // Error boundary will catch it
      }
      if (!result) {
        // This is the current Suspense API for telling Suspense that data is loading
        // It's likely to change
        throw promise
      }
      return result
    }
  }
}


// By default, all fetches are mocked so we can control the time easily.
// You can adjust the fetch time with this:
// window.FETCH_TIME = 3000
// If you want to make an actual network call for the pokemon
// then uncomment the following line
// window.fetch.restoreOriginalFetch()
// Note that by doing this, the FETCH_TIME will no longer be considered
// and if you want to slow things down you should use the Network tab
// in your developer tools to throttle your network to something like "Slow 3G"
const pokemonResource = createResource(() => fetchPokemon('pikachu'))

function PokemonInfo() {
  const pokemon = pokemonResource.read()

  // if the code gets it this far, then the pokemon variable is defined and
  // rendering can continue!
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

function App() {
  return (
    <div className="pokemon-info">
      {/*
        🐨 Wrap the PokemonInfo component with a React.Suspense component with a fallback
        🐨 Then wrap all that with an <ErrorBoundary /> to catch errors
        💰 I wrote the ErrorBoundary for you. You can take a look at it in the utils file if you want
      */}
      <ErrorBoundary>
        <React.Suspense
          // Fallback rendered when React intercepts thrown promise
          fallback={<PokemonInfoFallback name='Pikachu' />}
        >
          <PokemonInfo />
        </React.Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default App

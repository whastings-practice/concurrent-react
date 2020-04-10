// Coordinate Suspending components with SuspenseList

// http://localhost:3000/isolated/exercises/07

import React from 'react'
import '../suspense-list/style-overrides.css'
import * as cn from '../suspense-list/app.module.css'
import Spinner from '../suspense-list/spinner'
import {createResource, ErrorBoundary, PokemonForm} from '../utils'
import {fetchUser} from '../fetch-pokemon'

// 💰 this delay function just allows us to make a promise take longer to resolve
// so we can easily play around with the loading time of our code.
const delay = time => promiseResult =>
  new Promise(resolve => setTimeout(() => resolve(promiseResult), time))

const preloadableLazy = (dynamicImport) => {
  let promise
  const load = () => {
    if (!promise) {
      promise = dynamicImport()
    }
    return promise
  }
  const Component = React.lazy(load)
  // Add `load` as static component method so component code
  // can be loaded before component is rendered
  Component.preload = load
  return Component
}

// 🐨 feel free to play around with the delay timings.
const NavBar = preloadableLazy(() =>
  import('../suspense-list/nav-bar').then(delay(500)),
)
const LeftNav = preloadableLazy(() =>
  import('../suspense-list/left-nav').then(delay(2000)),
)
const MainContent = preloadableLazy(() =>
  import('../suspense-list/main-content').then(delay(1500)),
)
const RightNav = preloadableLazy(() =>
  import('../suspense-list/right-nav').then(delay(1000)),
)
const sections = [NavBar, LeftNav, MainContent, RightNav]

const fallback = (
  <div className={cn.spinnerContainer}>
    <Spinner />
  </div>
)
const SUSPENSE_CONFIG = {timeoutMs: 4000}

function App() {
  const [startTransition] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)

  function handleSubmit(pokemonName) {
    startTransition(() => {
      setPokemonResource(createResource(() => fetchUser(pokemonName)))
      // SuspenseList does not render the children of Suspense instances until
      // it's their turn to load (e.g. following revealOrder='forwards').
      // But since ours are lazy-loaded with React.lazy(), by default they won't start
      // loading until they're rendered. So we use our `preload` method to load
      // all of them in parallel.
      sections.forEach((section) => section.preload())
    })
  }

  if (!pokemonResource) {
    return (
      <div className={`${cn.root} totally-centered`} style={{height: '100vh'}}>
        <PokemonForm onSubmit={handleSubmit} />
      </div>
    )
  }

  // 🐨 Use React.SuspenseList throughout these Suspending components to make
  // them load in a way that is not jaring to the user.
  // 💰 there's not really a specifically "right" answer for this.
  return (
    <div className={cn.root}>
      <ErrorBoundary>
        {
          /*
            SuspenseList coordinates when child instances of Suspense are revealed
          */
        }
        <React.SuspenseList
          // Controls order in which child Suspense instances are revealed.
          // `forwards` mean elements are revealed in same order as their DOM order.
          // `forwards` and `backwards` only apply to direct children
          revealOrder='forwards'
          // Controls if/how loading fallbacks for Suspense instances are loaded
          // `collapsed` means only show fallback for next Suspense instance to
          // show (based on the revealOrder)
          tail='collapsed'
        >
          <React.Suspense fallback={fallback}>
            <NavBar pokemonResource={pokemonResource} />
          </React.Suspense>
          <div className={cn.mainContentArea}>
            {
              /*
                You can nest SuspenseList instances within each other
              */
            }
            <React.SuspenseList revealOrder='forwards' tail='collapsed'>
              <React.Suspense fallback={fallback}>
                <LeftNav />
              </React.Suspense>
              <React.SuspenseList
                // `together` means all Suspense instances are revealed at the same time
                // once they're all loaded
                revealOrder='together'
              >
                <React.Suspense fallback={fallback}>
                  <MainContent pokemonResource={pokemonResource} />
                </React.Suspense>
                <React.Suspense fallback={fallback}>
                  <RightNav pokemonResource={pokemonResource} />
                </React.Suspense>
              </React.SuspenseList>
            </React.SuspenseList>
          </div>
        </React.SuspenseList>
      </ErrorBoundary>
    </div>
  )
}

export default App

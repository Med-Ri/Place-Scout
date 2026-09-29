import { useRef, useState } from 'react'
import { startSearch } from './api.js'
import { SearchForm } from './components/SearchForm.jsx'
import { ResultsList } from './components/ResultsList.jsx'
import { ResultsMap } from './components/ResultsMap.jsx'
import './App.css'

function businessKey(business) {
  return business._id ?? business.id ?? business.name
}

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [lastQuery, setLastQuery] = useState({ what: '', where: '' })
  const abortRef = useRef(null)

  async function handleSearch({ what, where }) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedId(null)
    setLastQuery({ what, where })

    try {
      const data = await startSearch({
        what,
        where,
        signal: controller.signal,
      })
      setResult(data)
      if (data.businesses?.[0]) {
        setSelectedId(businessKey(data.businesses[0]))
      }
    } catch (err) {
      if (err?.name === 'AbortError') return
      setError(
        err?.message ||
          'Something went wrong while searching. You can try again.',
      )
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
      }
    }
  }

  function handleSelect(business) {
    setSelectedId(businessKey(business))
    const el = document.querySelector(
      `[data-business-id="${CSS.escape(businessKey(business))}"]`,
    )
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const hasResults = Boolean(result)

  return (
    <div className={`app ${hasResults || loading || error ? 'app--active' : ''}`}>
      <div className="app__atmosphere" aria-hidden="true" />

      <header className="hero">
        <p className="hero__eyebrow">Local business discovery</p>
        <h1 className="hero__brand">Place Scout</h1>
        <p className="hero__tagline">
          Search for businesses by what you need and where you are.
        </p>

        <SearchForm
          onSubmit={handleSearch}
          loading={loading}
          initialWhat={lastQuery.what}
          initialWhere={lastQuery.where}
        />
      </header>

      <main className="workspace" aria-live="polite">
        {loading ? (
          <div className="loading-panel" role="status" aria-busy="true">
            <div className="loading-panel__orb" aria-hidden="true" />
            <h2>Collecting results</h2>
            <p>
              Place Scout is geocoding your location and gathering businesses
              from Google Maps. This can take up to a couple of minutes —
              hang tight.
            </p>
          </div>
        ) : null}

        {error && !loading ? (
          <div className="error-panel" role="alert">
            <h2>Search unsuccessful</h2>
            <p>{error}</p>
            <button
              type="button"
              className="error-panel__retry"
              onClick={() =>
                handleSearch({
                  what: lastQuery.what,
                  where: lastQuery.where,
                })
              }
              disabled={!lastQuery.what || !lastQuery.where}
            >
              Try again
            </button>
          </div>
        ) : null}

        {hasResults && !loading ? (
          <section className="results" aria-label="Search results">
            {result.searchId ? (
              <p className="results__search-id">
                Search ID: <code>{result.searchId}</code>
              </p>
            ) : null}

            <div className="results__layout">
              <ResultsList
                businesses={result.businesses}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
              <ResultsMap
                businesses={result.businesses}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default App

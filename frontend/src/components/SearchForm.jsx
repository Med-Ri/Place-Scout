import { useId, useState } from 'react';

export function SearchForm({
  onSubmit,
  loading = false,
  initialWhat = '',
  initialWhere = '',
}) {
  const whatId = useId();
  const whereId = useId();
  const [what, setWhat] = useState(initialWhat);
  const [where, setWhere] = useState(initialWhere);
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const next = {};
    if (!what.trim()) {
      next.what = 'Enter what you are looking for.';
    }
    if (!where.trim()) {
      next.where = 'Enter a location (for example, Tunis, Tunisia).';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    if (!validate()) return;

    onSubmit({
      what: what.trim(),
      where: where.trim(),
    });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} noValidate>
      <div className="search-form__fields">
        <div className="field">
          <label htmlFor={whatId}>What are you looking for?</label>
          <input
            id={whatId}
            name="what"
            type="text"
            autoComplete="off"
            placeholder="pizza, dentists, Italian restaurants…"
            value={what}
            onChange={(event) => {
              setWhat(event.target.value);
              if (fieldErrors.what) {
                setFieldErrors((current) => ({ ...current, what: undefined }));
              }
            }}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.what)}
            aria-describedby={fieldErrors.what ? `${whatId}-error` : undefined}
            required
          />
          {fieldErrors.what ? (
            <p id={`${whatId}-error`} className="field-error" role="alert">
              {fieldErrors.what}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={whereId}>Where?</label>
          <input
            id={whereId}
            name="where"
            type="text"
            autoComplete="address-level2"
            placeholder="Tunis, Tunisia"
            value={where}
            onChange={(event) => {
              setWhere(event.target.value);
              if (fieldErrors.where) {
                setFieldErrors((current) => ({
                  ...current,
                  where: undefined,
                }));
              }
            }}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.where)}
            aria-describedby={
              fieldErrors.where ? `${whereId}-error` : undefined
            }
            required
          />
          {fieldErrors.where ? (
            <p id={`${whereId}-error`} className="field-error" role="alert">
              {fieldErrors.where}
            </p>
          ) : null}
        </div>
      </div>

      <button type="submit" className="search-form__submit" disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}

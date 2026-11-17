# Country Search

1. **Task:** https://github.com/rolling-scopes-school/tasks/blob/master/fullstack-engineering/tasks/country-search/README.md
2. **Screenshot:** <!-- Attach a screenshot of the deployed application. -->
3. **Deployment:** <!-- Add the GitHub Pages URL after deployment. -->
4. **Submitted / deadline:** <!-- Fill in both dates. -->
5. **Self-review / score:** <!-- Summarize the result and estimated score. -->

## Implementation notes

- [ ] For each required function, tests were committed before its implementation.
- [ ] The race-condition test uses a fetch mock that rejects with `AbortError` when the request signal is aborted.
- [ ] `DESIGN.md` documents cancellation, debounce delay, complexity, and clean-code choices.

## Behavior checklist

- [ ] Empty input sends no request and clears results.
- [ ] Loading state is visible while searching.
- [ ] Fast typing never displays a result from an outdated request.
- [ ] Canceled requests are aborted in the Network panel.
- [ ] User cancellation is not displayed as an error.
- [ ] A 404 displays a friendly no-results state.
- [ ] A real failure shows an error and Retry repeats the last query.
- [ ] Selecting a country opens its details.
- [ ] Search cache, in-flight deduplication, and recent-query history work.

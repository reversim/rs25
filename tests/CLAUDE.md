# Writing tests

Tests run in a real browser with [Vitest browser mode](https://vitest.dev/guide/browser/).
`yarn test` shows the browser; `yarn test:ci` runs headless and in parallel.

## Rules

1. **No loops in tests.** No `for`, `forEach` or `while` inside a test or
   `describe`. Each case is its own test, so a failure names exactly what broke.

2. **Use [`it.for`](https://vitest.dev/api/test.html#test-for), not `it.each`.**
   The same goes for `describe.for`.

   ```ts
   it.for([
     ["before the conference", "2026-11-29T12:00:00"],
     ["after the conference", "2026-12-02T12:00:00"],
   ])("is hidden %s", async ([_label, now]) => {
     // ...
   });
   ```

3. **Find elements the way a user does.** Use
   [`getByRole`](https://vitest.dev/api/browser/locators.html#getbyrole) as much
   as possible, then `getByText`. Avoid `getByTestId`, and don't add CSS selector
   locators. If an element can't be found by role, make the Astro component more
   accessible (an `aria-label`, `aria-expanded`, `aria-pressed`, a `role`) rather
   than working around it in the test.

4. **Use the built-in assertions.** Assert with `expect.element`, such as
   [`toBeVisible`](https://vitest.dev/api/browser/assertions.html#tobevisible),
   `toBeInViewport` or `toHaveClass`. Never write helpers like `isVisible(BUTTON)`.
   `getByRole` ignores hidden elements, so assert those with
   `.not.toBeInTheDocument()`. Read the page directly through `doc()` and `win()`
   only for values no matcher covers.

5. **No custom browser commands.** Use Vitest's own APIs. If a test really needs
   one, explain why and agree on it first.

6. **Mobile first.** Cover behaviour in full in the `mobile` project. The
   `desktop` project only runs the smoke tests in `e2e/desktop.test.ts`. The
   projects set the viewport, so tests never resize it themselves.

7. **Keep test code out of `src`.** No test-only branches or env flags in the
   site. Mock its requests with MSW in `e2e/support/devServer.mjs`.

8. **Keep the Playwright provider config minimal.** Every option there has to
   earn its place.

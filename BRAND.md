Brand values — single location

File: css/brand.css

Change these here (not in page structure):
- --brand-name / wordmark string also appears in index.html as visible text; keep them matching
- --brand-logo (path to logo file)
- Colour tokens (--color-*)
- Type tokens (--font-display, --font-body)
- Directions B and C via [data-direction="b"] and [data-direction="c"] overrides in the same file

Direction switcher on the page is for client selection during review. Default is Direction A.
After the client picks one direction, the other two overrides can be removed and the switcher deleted from index.html.

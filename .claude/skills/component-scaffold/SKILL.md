---
name: component-scaffold
description: Scaffold a new React component folder with the project's conventions. Use when creating a new component to enforce folder structure, default exports, test colocation, and the Props interface convention.
---

# Component Scaffold

Create a new component at `src/components/<Name>/` following
the project conventions documented in `react-patterns`.

## Arguments

- `<Name>` — PascalCase component name. Examples:
  `LeaderboardRow`, `RankBadge`, `OwnRankCluster`.

## What gets created

```
src/components/<Name>/
├── <Name>.tsx
├── <Name>.test.tsx
└── index.ts
```

## Templates

### `<Name>.tsx`

```tsx
interface Props {
  // TODO
}

export default function <Name>({ }: Props) {
  return null
}
```

### `<Name>.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import <Name> from './<Name>'

describe('<Name>', () => {
  test('renders', () => {
    render(<<Name> />)
    // TODO: assert on a user-visible behaviour
  })
})
```

### `index.ts`

```ts
export { default } from './<Name>'
```

## Rules

- Do not create `<Name>.types.ts` unless types are shared with
  another file. Otherwise types live next to the component.
- Do not create `<Name>.module.css`. We use Tailwind.
- Do not create `<Name>.stories.tsx` unless the project adds
  Storybook later. We don't have it now.
- The test file is not optional. It starts with one placeholder
  test that the author replaces.

## After scaffolding

Open all three files in the editor. The author fills in:

1. The `Props` interface.
2. The component body.
3. At least one real test (replacing the placeholder).

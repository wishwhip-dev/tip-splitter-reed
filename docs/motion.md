# Animation

`motion` is installed. Import it as `motion/react`:

```tsx
"use client";
import { motion } from "motion/react";

<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} />
```

**Not `framer-motion`.** That is the same library under its old name. It is not installed, and
installing it would put two copies of the same thing in the project.

## What it is for here

Entrances and state changes: a row appearing, a panel expanding, a number counting up, an item
leaving a list. `AnimatePresence` handles the leaving case, which CSS alone cannot:

```tsx
import { AnimatePresence, motion } from "motion/react";

<AnimatePresence>
  {items.map((item) => (
    <motion.li key={item.id} exit={{ opacity: 0, height: 0 }}>{item.name}</motion.li>
  ))}
</AnimatePresence>
```

A `key` that is stable per item is what makes this work. Index keys animate the wrong element out.

## Respect `prefers-reduced-motion`

Anything that moves on its own — loops, autoplay, parallax — must stop for a visitor who has asked
for less motion. `useReducedMotion()` returns that preference:

```tsx
import { motion, useReducedMotion } from "motion/react";

const reduced = useReducedMotion();
<motion.div animate={reduced ? {} : { rotate: 360 }} transition={{ repeat: Infinity, duration: 8 }} />
```

A one-shot entrance of a few hundred milliseconds is fine either way. A thing that never stops is
not.

## Client component

Motion is client-side. A file using it needs `"use client"` at the top, and a `motion.*` element
in a server component fails at build.

## Do not animate a Recharts series with this

If the charts module is also in this project, its series must stay `isAnimationActive={false}` —
see `docs/charts.md`. Animate the chart's container instead: the entrance is what reads as motion,
and the data stays drawn from the first frame.

## In a post or a panel

Motion is for a change the reader caused or a sequence they step through, not for decoration. In a
media plan it rides on the control that drives it:

```
section            reader does                    medium
the machine        steps through 3 stages         SVG diagram + Button, Motion
```

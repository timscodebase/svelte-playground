# MathPlayground

Welcome to MathPlayground, a collection of interactive web-based games designed to help improve math skills in a fun and engaging way. This project is built using SvelteKit and modern web technologies.

## Games

Here's a list of the games available in MathPlayground:

### [Times Table Challenge](/mulipication-tables)
Master your multiplication with this interactive grid challenge.

### [Grid Chase](/grid-chase)
Reverse multiplication! Find all grid cells that match the target.

### [Arithmetic Sprint](/flash-cards)
Race against the clock to solve math problems.

### [Equation Builder](/equation-builder)
Drag and drop puzzles. Balance the equation.

### [Pizza Slicer](/fraction-pizza)
Visual fractions game. Slice and serve the correct portion.

---

## Technical Information

This project is a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

### Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

### Developing

Once you've created a project and installed dependencies with `pnpm install`, start a development server:

```sh
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

### Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
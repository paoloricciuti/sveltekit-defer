# sveltekit-defer

⚠ This is extremely WIP

This package allows you to transfare Promises over the wire in sveltekit. It uses SSE and stores to let you write code as close as possible to "vanilla sveltekit" while giving you the opportunity (with a simple await) to choose what data you want available as soon as the page load and what data it's not that important to you.

Here's an example of what you would write;

**hooks.server.ts**

```ts
import { defer_handle } from 'sveltekit-defer';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = defer_handle;
```

if you have other handles you can chain them with the utility function `sequence` provided by sveltekit.

**hooks.server.ts**

```ts
import { defer_handle } from 'sveltekit-defer';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = sequence(defer_handle, your_handle);
```

you can than define a `+page.server.ts` wrapping the load function inside the defer function

```ts
import type { ServerLoadEvent } from '@sveltejs/kit';
import { defer } from 'sveltekit-defer';
import type { PageServerLoad } from './$types';

async function get_blog() {
	await new Promise((r) => setTimeout(r, 7000));
	return "A long blog post that it's very critical so the user need to see it right away";
}

async function get_comments() {
	await new Promise((r) => setTimeout(r, 10000));
	return [
		{ author: 'Antonio', comment: 'Very cool' },
		{ author: 'Oskar', comment: "Yeah it's wonderful" }
	];
}

/**
 * Wrap you actual load function inside our defer function to unlock the defer functionality
 */
export const load: PageServerLoad = defer(async (event: ServerLoadEvent) => {
	// start the fetch for the comments right away without awaiting
	const comments = get_comments();
	// await the blog post given that is critical content
	const blog = await get_blog();
	//return the promise (comments) and the blog post
	return {
		blog,
		comments
	};
});
```

then on the client side you can access the data via the store provided by `sveltekit-defer`

```svelte
<script lang="ts">
	import { get_data } from 'sveltekit-defer';
	import type { PageData } from './$types';

	const data = get_data<PageData>();
</script>

<main>
	<section>
		<!--The blog will be available right away-->
		{$data.blog}
	</section>
	<section>
		<ul>
			<!--await the comments because they are a Promise-->
			{#await $data.comments}
				Loading...
			{:then comments}
				{#each comments as comment}
					<li>{comment.author} - {comment.comment}</li>
				{/each}
			{/await}
		</ul>
	</section>
</main>
```

## Configuration

`sveltekit-defer` makes use of apis that require to choose a name for them (e.g we need to create a couple of endpoints, an event name, a field to store the deferred promises etc etc). We tryed to chose unique enaugh names so that they should never collide with your applications but you know what they say and the internet is a vast enaugh place to encounter the weirdest circumstances. To avoid this `sveltekit-defer` provide a custom vite plugin to override those names.

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltekit_defer } from "sveltekit-defer/vite";
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit_defer({
		cookie_name: "your_cookie_name",
		stream_event: "your_stream_event",
		stream_pathname: "/your_pathname", //this should start with a / but don't worry, if you don't we take care of it
		promise_field: "your_promise_field",
	}), sveltekit()]
};

export default config;
```

Make sure to put this plugin before the `sveltekit` one.

## How it works?

Here's how it works:

1. The handle function add two endpoints to your project, a GET and a POST: the GET endpoint uses server sent event to notify the client whenever one of the Promises on the server has resolved and the POST endpoint is used to trigger such event
1. The defer function takes the return value of your load function and keep track of your Promises sticking them into an array.
1. Once on the client the store create an EventStream and register a callback on the server sent event, it take the data returned from the load function and for every key in the promises array it create a new Promise saving the resolver and the rejecter in a Map
1. Once the promise on the server resolves a post request is made to the POST endpoint managed by the handle function
1. A new event is put out from the server sent event endpoint
1. The callback registered in the store fires and the store resolves the correct Promise giving you back the data.

## What to do now?

There's a lot to do, but the first thing is to make sure that this doesn't create some super-huge security/performance issue and generally if there are things that can be done better.

Feel free to open an issue if you found something that is not working or if you have some ideas on how to improve.

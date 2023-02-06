import { page } from '$app/stores';
import { onDestroy, onMount } from 'svelte';
import { derived, get } from 'svelte/store';
import { STREAM_EVENT, STREAM_PATHNAME } from './constants';

type TransformBack<T extends { promises: string[] }> = Omit<
	{
		[Key in keyof T]: [Key] extends T['promises'] ? Promise<T[Key]> : T[Key];
	},
	'promises'
>;

export function get_data<T extends { promises: string[] }>() {
	const resolvers: Map<string, { resolve: (arg: any) => void; reject: (arg: any) => void }> =
		new Map();
	let eventSource: EventSource;
	onMount(() => {
		const $page = get(page);
		eventSource = new EventSource(`${STREAM_PATHNAME}?load=${$page.url.href}`, {
			withCredentials: true
		});
		eventSource?.addEventListener(STREAM_EVENT, (evt) => {
			const resolved = JSON.parse(evt.data);
			const resolver = resolvers.get(resolved.key);
			if (resolved.kind === 'resolve') {
				resolver?.resolve(JSON.parse(resolved.value));
			} else {
				resolver?.reject(JSON.parse(resolved.value));
			}
		});
	});
	onDestroy(() => {
		eventSource?.close();
	});
	const retval = derived<typeof page, TransformBack<T>>(page, ($page) => {
		const data = $page.data;
		const { promises = [] } = data;
		resolvers.clear();
		Object.keys(data).forEach((_key) => {
			const key = _key as keyof typeof data;
			if (promises.includes(key)) {
				data[key] = new Promise((resolve, reject) => {
					resolvers.set(key, { resolve, reject });
				});
			}
		});
		delete data.promises;
		return data as TransformBack<T>;
	});

	return retval;
}

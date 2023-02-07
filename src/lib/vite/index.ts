import type { SveltekitDeferOptions } from '$lib/constants';
import type { Plugin } from 'vite';
import MagicString from 'magic-string';

export function sveltekit_defer(options: SveltekitDeferOptions): Plugin {
	return {
		name: 'vite-plugin-sveltekit-defer',
		transform(code, id) {
			if (id.endsWith("node_modules/sveltekit-defer/constants.js")) {
				if (code.startsWith("/// @sveltekit-defer-constants")) {
					const magicCode = new MagicString(code);
					Object.keys(options).forEach((_key) => {
						const key = _key as keyof typeof options;
						magicCode.replace(new RegExp(`${key}:\\s\\'.*\\',\\r?\\n`), `${key}: '${options[key]}',\r\n`);
					});
					return {
						code: magicCode.toString(),
						map: magicCode.generateMap(),
					};
				}
			}
		}
	};
}

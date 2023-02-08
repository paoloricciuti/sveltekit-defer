import type { SveltekitDeferOptions } from '$lib/constants';
import type { Plugin } from 'vite';
import MagicString from 'magic-string';
import fs from 'fs';

export const env_parser: {
	[K in keyof SveltekitDeferOptions]?: (
		to_parse: SveltekitDeferOptions[K]
	) => SveltekitDeferOptions[K];
} = {
	stream_pathname(to_parse) {
		if (!to_parse || to_parse.startsWith('/')) return to_parse;
		return `/${to_parse}`;
	}
};

function fix_code(code: string, options: SveltekitDeferOptions) {
	if (code.startsWith('/// @sveltekit-defer-constants')) {
		const magicCode = new MagicString(code);
		Object.keys(options).forEach((_key) => {
			const key = _key as keyof typeof options;
			const to_replace = env_parser[key]?.(options[key]) ?? options[key];
			if (to_replace) {
				magicCode.replace(
					new RegExp(`${key}:\\s\\'.*\\',?\\r?\\n`),
					`${key}: '${to_replace}',\r\n`
				);
			}
		});
		return {
			code: magicCode.toString(),
			map: magicCode.generateMap()
		};
	}
}

export function sveltekit_defer(options: SveltekitDeferOptions): Plugin {
	return {
		name: 'vite-plugin-sveltekit-defer',
		config() {
			return {
				optimizeDeps: {
					force: true,
					esbuildOptions: {
						plugins: [
							{
								name: 'esbuild-plugin',
								setup(build) {
									build.onLoad(
										{
											filter: /constants/
										},
										({ path }) => {
											if (!path.includes('sveltekit-defer')) return;
											const code = fs.readFileSync(path, 'utf-8');
											const contents = fix_code(code, options)?.code;
											return contents
												? {
														contents
												  }
												: undefined;
										}
									);
								}
							}
						]
					}
				}
			};
		},
		transform(code, id) {
			if (id.endsWith('node_modules/sveltekit-defer/constants.js')) {
				return fix_code(code, options);
			}
		}
	};
}

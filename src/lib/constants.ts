/// @sveltekit-defer-constants
export const env = {
	cookie_name: 'sveltekit-defer-user',
	stream_pathname: '/__sveltekit-defer-events',
	stream_event: 'sveltekit-defer-resolved',
	promise_field: '__sveltekit-defer-promises'
} as const;

export type Env = typeof env;

export type SveltekitDeferOptions = {
	-readonly [K in keyof Env]?: LiteralToPrimitive<Env[K]>;
};

export type PromisesField = Env['promise_field'];

/*
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
type LiteralToPrimitive<T> = T extends number
	? number
	: T extends bigint
	? bigint
	: T extends string
	? string
	: T extends boolean
	? boolean
	: T extends symbol
	? symbol
	: T extends null
	? null
	: T extends undefined
	? undefined
	: T extends any[]
	? LiteralToPrimitive<T[number]>[]
	: T extends object
	? {
			[K in keyof T]: LiteralToPrimitive<T[K]>;
	  }
	: never;

import type { ServerLoadEvent } from '@sveltejs/kit';
import { COOKIE_NAME, STREAM_PATHNAME } from './constants';

export function defer<T extends (...args: any[]) => any>(
	func: T
): (event: ServerLoadEvent) => Promise<ReturnType<T>> {
	return async (event: ServerLoadEvent) => {
		if (!event.cookies.get(COOKIE_NAME)) {
			event.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
				path: '/',
				httpOnly: true,
				secure: true
			});
		}
		const returnVal = await func(event);
		Object.keys(returnVal as any).forEach(async (_key) => {
			const key = _key as keyof typeof returnVal;
			if ((returnVal as any)[key] instanceof Promise) {
				if (!returnVal.promises) {
					returnVal.promises = [];
				}
				returnVal.promises.push(key);
				returnVal[key].then((res: any) => {
					event.fetch(`${STREAM_PATHNAME}?load=${event.url}`, {
						method: 'POST',
						body: JSON.stringify({ value: JSON.stringify(res), key })
					});
				});
				returnVal[key] = '__PROMISE_TO_DEFER__';
			}
		});
		return returnVal;
	};
}

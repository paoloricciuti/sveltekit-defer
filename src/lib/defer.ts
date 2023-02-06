import type { ServerLoadEvent } from '@sveltejs/kit';
import { COOKIE_NAME, STREAM_PATHNAME } from './constants';

function pushEvent(event: ServerLoadEvent, data: any) {
    event.fetch(`${STREAM_PATHNAME}?load=${event.url}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

type GetPromises<T> = {
    [Key in keyof T]: T[Key] extends Promise<any> ? Key : never;
}[keyof T];

type Transform<T> = {
    [Key in keyof T]: T[Key];
} & {
    promises: GetPromises<T>[];
};

function get_promise_or_throw(promise: Promise<any>) {
    return Promise.race([promise, Promise.reject()]);
}

export function defer<T extends (...args: any[]) => any>(
    func: T
): (event: ServerLoadEvent) => Promise<Transform<Awaited<ReturnType<T>>>> {
    return async (event: ServerLoadEvent) => {
        if (!event.cookies.get(COOKIE_NAME)) {
            event.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
                path: '/',
                httpOnly: true,
                secure: true
            });
        }
        const returnVal = await func(event);
        const keys = Object.keys(returnVal as any);
        for (const _key of keys) {
            const key = _key as keyof typeof returnVal;
            if ((returnVal as any)[key] instanceof Promise) {
                try {
                    const actualValue = await get_promise_or_throw(returnVal[key]);
                    returnVal[key] = actualValue;
                } catch (e) {
                    if (!returnVal.promises) {
                        returnVal.promises = [];
                    }
                    returnVal.promises.push(key);
                    returnVal[key]
                        .then((res: any) => {
                            pushEvent(event, { value: JSON.stringify(res), key, kind: 'resolve' });
                        })
                        .catch((error: any) => {
                            pushEvent(event, { value: JSON.stringify(error), key, kind: 'reject' });
                        });
                    returnVal[key] = '__PROMISE_TO_DEFER__';
                }
            }
        }
        return returnVal;
    };
}

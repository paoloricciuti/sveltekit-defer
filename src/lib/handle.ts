import type { Handle } from '@sveltejs/kit';
import { COOKIE_NAME, STREAM_EVENT, STREAM_PATHNAME } from './constants';

const controllers = new Map<string, ReadableStreamController<any>>();
const queued = new Map<string, ((controller: ReadableStreamController<any>) => void)[]>();

async function enqueue(request: Request, key: string) {
	const controller = controllers.get(key);
	const data = await request.clone().text();
	const to_write = `event: ${STREAM_EVENT}\ndata: ${data}\n\n`;
	const flush = (controller: ReadableStreamController<any>) => {
		const encoder = new TextEncoder();
		controller.enqueue(encoder.encode(to_write));
	};
	if (!controller) {
		let queue = queued.get(key);
		if (!queue) {
			queue = [];
			queued.set(key, queue);
		}
		queue.push(flush);
		return new Response(null, {
			status: 401
		});
	}
	flush(controller);
	return new Response(null, {
		status: 200
	});
}

export const defer_handle: Handle = async ({ event, resolve }) => {
	const { searchParams, pathname } = new URL(event.request.url);
	if (pathname === STREAM_PATHNAME) {
		const defer_user = event.cookies.get(COOKIE_NAME);
		const load = searchParams.get('load') ?? '';
		const key = [defer_user, load].toString();
		if (!defer_user) {
			return new Response(null, {
				status: 401
			});
		}
		if (event.request.method === 'GET') {
			let controller: ReadableStreamController<any>;
			return new Response(
				new ReadableStream({
					start: (_) => {
						controller = _;
						const to_flush = queued.get(key) ?? [];
						let flush = to_flush.pop();
						while (flush) {
							flush(controller);
							flush = to_flush.pop();
						}
						controllers.set(key, controller);
					},
					cancel: () => {
						controllers.delete(key);
					}
				}),
				{
					headers: {
						'Cache-Control': 'no-store',
						'Content-Type': 'text/event-stream',
						Connection: 'keep-alive'
					},
					status: 200
				}
			);
		} else if (event.request.method === 'POST') {
			return enqueue(event.request, key);
		}
	}
	const response = await resolve(event);
	return response;
};

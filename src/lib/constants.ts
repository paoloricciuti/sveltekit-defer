/// @sveltekit-defer-constants
export const env = {
	cookie_name: 'sveltekit-defer-user',
	stream_pathname: '/__sveltekit-defer-events',
	stream_event: 'sveltekit-defer-resolved'
};

export type SveltekitDeferOptions = Partial<typeof env>;

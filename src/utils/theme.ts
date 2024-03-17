import { useDark, useToggle, type BasicColorSchema } from '@vueuse/core';

export const isDark = useDark({
	storageKey: 'useDarkKEY',
	valueDark: 'dark',
	valueLight: 'light',
	onChanged(dark: boolean, defaultHandler: (mode: BasicColorSchema) => void, mode: BasicColorSchema) {
		defaultHandler(mode);
	},
});

export const changeTheme = useToggle(isDark);

import { defineStore } from 'pinia';
import { ref } from 'vue';

const dockStore = defineStore('dockStore', () => {
	const showDock = ref<boolean>(false);

	function openDock() {
		showDock.value = true;
	}

	function closeDock() {
		showDock.value = false;
	}
	return {
		show: showDock,
		openDock,
		closeDock,
	};
});

export default dockStore;

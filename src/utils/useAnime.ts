import type { AnimeInstance } from 'animejs';
import anime from 'animejs/lib/anime.es.js';
import { onMounted, type Ref } from 'vue';

export type CssField =
	| 'translateX'
	| 'translateY'
	| 'translateZ'
	| 'rotate'
	| 'rotateX'
	| 'rotateY'
	| 'rotateZ'
	| 'scale'
	| 'scaleX'
	| 'scaleY'
	| 'scaleZ'
	| 'skew'
	| 'skewX'
	| 'skewY'
	| 'perspective'
	| 'matrix'
	| 'matrix3d'
	| 'opacity'
	| 'top'
	| 'left';

type AnimeParams = {
	targets: Ref<HTMLElement | null>;
	duration?: number;
	delay?: number;
	endDelay?: number;
	elasticity?: number;
	round?: number;
	loop?: boolean | number;
	autoplay?: boolean;
	direction?: string;
	easing?: anime.EasingOptions;
	borderRadius?: any;
} & {
	[key in CssField]?: any;
};
export function useAnime(opotion: AnimeParams, isMounted = false): AnimeInstance {
	// 未挂载节点
	if (!isMounted) {
		onMounted(() => {
			return anime({
				...opotion,
				targets: opotion.targets.value,
			});
		});
	}
	// 已挂载节点
	return anime({
		...opotion,
		targets: opotion.targets.value,
	});
}

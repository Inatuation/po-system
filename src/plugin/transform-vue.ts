import fs from 'fs';
import MarkdownIt from 'markdown-it';
import path from 'path';
import type { Plugin } from 'vite';

interface fileDisplayArr {
	filedir: string;
	fileName: string;
}

function fileDisplay(filePath: string) {
	const resultArr: Array<fileDisplayArr> = [];
	//根据文件路径读取文件，返回文件列表
	return new Promise((resolve, reject) => {
		fs.readdir(filePath, (err: any, files: any) => {
			if (err) {
				console.warn(err);
				reject(err);
			}
			//遍历读取到的文件列表
			files.forEach(function (filename: string) {
				//获取当前文件的绝对路径
				const filedir = path.join(filePath, filename);
				if (/.md/.test(filename)) {
					resultArr.push({
						filedir,
						fileName: filename.split('.')[0],
					});
				}
			});
			resolve(resultArr);
		});
	});
}

export default function myPlugin(): Plugin {
	return {
		name: 'transform-vue',
		async buildStart() {
			const filesPath = (await fileDisplay('./src/docs')) as any;
			filesPath.forEach((item: fileDisplayArr) => {
				const content = fs.readFileSync(item.filedir, 'utf-8');
				const md = new MarkdownIt();
				const result = md.render(content);
				fs.writeFile(`./src/components/docsTemplate/${item.fileName}.html.vue`, `<template>${result}</template>`, (error: any) => {
					if (error) {
						console.error(error);
						return;
					}
				});
			});
		},
	};
}

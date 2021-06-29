import { t } from '@superset-ui/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/chart';
import transformProps from './transformProps';
import thumbnail from './images/thumbnail.png';


const metadata = new ChartMetadata({
  name: t('Mix Line Bar'),//图表名字，可以和key值不同
  description: '',//可以自行添加描述，没啥用
  credits: ['https://echarts.apache.org/examples/en/editor.html?c=mix-line-bar'],//官网网址改了要更新，只是个参考链接
  thumbnail,//图表示意图
});

export default class MixLineBarChartPlugin extends ChartPlugin {
  constructor() {
    super({
      metadata,
      transformProps,//查询到的数据
      loadChart: () => import('./ReactMixLineBar.js'), // 指引打包器到前端渲染逻辑
    });
  }
}

import { t } from '@superset-ui/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/chart';
import transformProps from './transformProps';
import thumbnail from './images/thumbnail.png';


const metadata = new ChartMetadata({
  name: t('NetGraph'),//图表名字，可以和key值不同
  description: '自己添加的节点布局',//可以自行添加描述，没啥用
  thumbnail,//图表示意图
});

export default class NetGraphChartPlugin extends ChartPlugin {
  constructor() {
    super({
      metadata,
      transformProps,//查询到的数据
      loadChart: () => import('./ReactNetGraph.js'), // 指引打包器到前端渲染逻辑
    });
    console.log('NetGraphChartPlugin')
  }
}

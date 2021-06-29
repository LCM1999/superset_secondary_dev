import { t } from '@superset-ui/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/chart';
import transformProps from './TransformProps';
import thumbnail from './images/thumbnail.png';


const metadata = new ChartMetadata({
  name: t('LiuTu'),//图表名字，可以和key值不同
  description: '这是实验室自己的表格',//可以自行添加描述，没啥用
  thumbnail,//图表示意图
});

export default class LiuTuChartPlugin extends ChartPlugin {
  constructor() {//在构造函数中对父类进行初始化
    super({
      metadata,
      transformProps,//数据处理逻辑
      loadChart: () => import('./ReactLiuTu.js'), // 指引打包器到前端渲染逻辑
    });
  }
}

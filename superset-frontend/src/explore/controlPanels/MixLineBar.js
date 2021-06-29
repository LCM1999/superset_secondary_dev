/**
 *   https://echarts.apache.org/examples/zh/editor.html?c=mix-line-bar  echarts加入了apache的孵化基金，网址改了
 *   mix line bar
 */
 import { t } from '@superset-ui/translation';//引入图表翻译


 export default {
     requiresTime: true,
     controlPanelSections: [
         {
             label: t('Chart Options'),
             expanded: true,
             controlSetRows: [
                 ['color_scheme', 'label_colors'],
             ],
         },
    // label对应的是每个section的标题
    // expand对应的是改section是否可以被展开
    // controlSetRows 定义的是每一行有几个组件，metric，adhoc_filters对应的是组件的key
    // 可以在superset-frontend/src/explore/controls.jsx
    // 中通过这些key找到对应的配置
         {
             label: t('X Axis'),
             expanded: true,
             controlSetRows: [
                 ['groupby'],
             ],
         },
         {
             label: t('Line Type'),
             expanded: true,
             controlSetRows: [
                 ['line_metrics'],
             ],
         },
         {
             label: t('Bar Type'),
             expanded: true,
             controlSetRows: [
                 ['bar_metrics'],
             ],
         },
         {
             label: t('Real Y Axis 2 Display Columns'),
             expanded: true,
             controlSetRows: [
                 ['right_y_column'],
             ],
         },
 
         {
             label: t('Y Axis 1 Scale Value Setting'),
             expanded: true,
             controlSetRows: [
                 ['left_y_min', 'left_y_max', 'left_y_interval'],
                 ['y_axis_label']
             ],
         },
         {
             label: t('Y Axis 2 Scale Value Setting'),
             expanded: true,
             controlSetRows: [
                 ['right_y_min', 'right_y_max', 'right_y_interval'],
                 ['y_axis_2_label']
             ],
         },
         {
             label: t('Query'),
             expanded: true,
             controlSetRows: [
                 ['adhoc_filters'],
             ],
         },
 
     ],
     controlOverrides: {
 
     },
 };



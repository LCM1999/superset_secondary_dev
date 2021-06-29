import { t } from '@superset-ui/translation';

export default {
  requiresTime: false,
  controlPanelSections: [
    {
      label: t('填充颜色选择(还不能用)'),
      expanded: true,
      controlSetRows: [
          ['color_scheme', 'label_colors'],
      ],
  },
    {
      label: t('请选择时间字段'),
      expanded: true,
      controlSetRows: [
          ['groupby'],
      ],
  },
  {
    label: t('请选择layer主体'),
    expanded: true,
    controlSetRows: [
        ['groupby'],
    ],
},
{
  label: t('请选择填充颜色字段'),
  expanded: true,
  controlSetRows: [
      ['groupby'],
  ],
},
{
  label: t('选择size字段'),
  expanded: true,
  controlSetRows: [
      ['groupby'],
  ],
},
{
  label: t('选择排序方式'),
  expanded: true,
  controlSetRows: [
      ['order_choose'],
  ],
},
  ],
};
import { t } from '@superset-ui/translation';
//直接复制了流图现成的panel布局

export default {
  controlPanelSections: [
  {
      label: t('数据筛选'),
      expanded: true,
      controlSetRows: [//controlSetRows中的各种input玩意在explore/controls.j中
          ['nodes_label_choose'],['links_label_choose'],['number_limit']
      ],
  },

  {label: t('选择限制个数'),
  expanded: true,
  controlSetRows:[
    [''],
  ]
  },
  ],
  controlOverrides: {
  
  },
};
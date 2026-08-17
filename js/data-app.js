/**
 * data-app.js
 * 应用配置数据：版本列表、单元索引等
 * 全局命名空间：window.VocabConfig, window.VocabData
 */

/** 应用配置 */
window.VocabConfig = {
  /** 版本列表 */
  versions: [
    {
      id: 'yilin',
      name: '译林版',
      books: [
        { id: '7a', name: '七年级上册' },
        { id: '7b', name: '七年级下册' }
      ]
    },
    {
      id: 'pep',
      name: '人教版',
      books: [
        { id: '7a', name: '七年级上册' }
      ]
    },
    {
      id: 'waiyan',
      name: '外研版',
      books: [
        { id: '7a', name: '七年级上册' }
      ]
    }
  ],

  /** localStorage 键名前缀 */
  storagePrefix: 'vocabApp_',

  /** localStorage 键名定义 */
  storageKeys: {
    checkin: 'vocabApp_checkin',
    masteredWords: 'vocabApp_mastered_words',
    progress: 'vocabApp_progress',
    dictationScores: 'vocabApp_dictation_scores',
    examScores: 'vocabApp_exam_scores',
    wordbook: 'vocabApp_wordbook',
    settings: 'vocabApp_settings',
    unitUnlock: 'vocabApp_unit_unlock'
  },

  /** 鼓励语列表 */
  encouragements: [
    '太棒了！今天又进步了一点！',
    '坚持就是胜利，继续加油！',
    '每一天的积累都是通向成功的阶梯！',
    '你比昨天更优秀了！',
    '学习如逆水行舟，不进则退，你做到了！',
    '今天的努力，明天的收获！',
    '保持这份热情，英语一定会越来越好！',
    '打卡成功！好习惯成就好未来！'
  ]
};

/** 全局数据容器，由各 data-*.js 文件填充 */
window.VocabData = {};

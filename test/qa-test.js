/**
 * qa-test.js
 * QA验证测试脚本 - 初一英语背单词应用
 * 验证：数据完整性、HTML结构、跨文件一致性、内容准确性
 */

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var JS_DIR = path.join(__dirname, '..', 'js');
var HTML_PATH = path.join(__dirname, '..', 'index.html');
var errors = [];
var warnings = [];
var passed = 0;
var failed = 0;
var sharedSandbox = null;

// ============================================================
// 断言工具
// ============================================================
function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(message);
  }
}

function warn(condition, message) {
  if (!condition) {
    warnings.push(message);
  }
}

// ============================================================
// 创建模拟的浏览器环境（单一共享上下文）
// ============================================================
function createMockBrowser() {
  var store = {};

  var localStorage = {
    _data: store,
    getItem: function (key) { return store[key] !== undefined ? store[key] : null; },
    setItem: function (key, value) { store[key] = String(value); },
    removeItem: function (key) { delete store[key]; },
  };

  var elements = {};

  function createMockElement(id) {
    var el = {
      id: id,
      className: '',
      innerHTML: '',
      textContent: '',
      value: '',
      style: {},
      children: [],
      parentNode: null,
      classList: {
        _classes: {},
        add: function (c) { this._classes[c] = true; },
        remove: function (c) { delete this._classes[c]; },
        toggle: function (c, force) {
          if (force === true) this._classes[c] = true;
          else if (force === false) delete this._classes[c];
          else { if (this._classes[c]) delete this._classes[c]; else this._classes[c] = true; }
        },
        contains: function (c) { return !!this._classes[c]; },
      },
      attributes: {},
      getAttribute: function (name) { return this.attributes[name] || null; },
      setAttribute: function (name, val) { this.attributes[name] = val; },
      appendChild: function (child) { this.children.push(child); child.parentNode = this; return child; },
      removeChild: function (child) { return child; },
      replaceChild: function (newChild, oldChild) { return oldChild; },
      cloneNode: function (deep) { return createMockElement(this.id); },
      addEventListener: function () {},
      querySelector: function () { return createMockElement(''); },
      querySelectorAll: function () { return []; },
      focus: function () {},
      disabled: false,
    };
    return el;
  }

  var window = {
    VocabApp: undefined,
    VocabConfig: undefined,
    VocabData: undefined,
    speechSynthesis: {
      cancel: function () {},
      speak: function () {},
      getVoices: function () { return []; },
      onvoiceschanged: null,
    },
    SpeechSynthesisUtterance: function () {},
  };

  var document = {
    readyState: 'loading', // 避免init()立即执行
    getElementById: function (id) {
      if (!elements[id]) { elements[id] = createMockElement(id); }
      return elements[id];
    },
    querySelectorAll: function () { return []; },
    querySelector: function () { return null; },
    createElement: function (tag) { return createMockElement(''); },
    addEventListener: function () {},
  };

  sharedSandbox = {
    window: window,
    document: document,
    localStorage: localStorage,
    console: console,
    Date: Date,
    Math: Math,
    Object: Object,
    Array: Array,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    RegExp: RegExp,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Error: Error,
    setTimeout: function () {},
    SpeechSynthesisUtterance: function () {},
  };
  vm.createContext(sharedSandbox);

  // 在浏览器中 window.X 会创建全局变量 X，这里模拟此行为
  // 使用 Proxy 让 window 的属性也能作为全局变量访问
  var globalProxy = new Proxy(sharedSandbox, {
    has: function () { return true; },
    get: function (target, prop) {
      if (prop in target) return target[prop];
      if (prop in target.window) return target.window[prop];
      return undefined;
    },
    set: function (target, prop, value) {
      if (prop in target) { target[prop] = value; return true; }
      target.window[prop] = value;
      return true;
    }
  });
  // 用 Proxy 替换 context 的 globalThis 行为不可行（vm 不支持），
  // 改为直接在 sandbox 上定义 VocabApp/VocabConfig/VocabData 的 getter
  ['VocabApp', 'VocabConfig', 'VocabData'].forEach(function (name) {
    Object.defineProperty(sharedSandbox, name, {
      get: function () { return sharedSandbox.window[name]; },
      set: function (v) { sharedSandbox.window[name] = v; },
      configurable: true,
      enumerable: true,
    });
  });

  return { window: window, document: document, localStorage: localStorage };
}

// ============================================================
// 加载JS文件到共享环境
// ============================================================
function loadJS(filePath) {
  var code = fs.readFileSync(filePath, 'utf-8');
  vm.runInContext(code, sharedSandbox);
}

// ============================================================
// 同步全局变量
// ============================================================
function syncGlobals() {
  global.VocabConfig = sharedSandbox.window.VocabConfig;
  global.VocabData = sharedSandbox.window.VocabData;
  global.VocabApp = sharedSandbox.window.VocabApp;
}

// ============================================================
// 测试1: 数据完整性 - 译林版7A
// ============================================================
function testData7A() {
  var data = global.VocabData['yilin']['7a'];
  assert(Array.isArray(data), 'data-7a: 应为数组');
  assert(data.length === 8, 'data-7a: 应包含8个单元，实际 ' + (data ? data.length : 0));

  var requiredFields = ['unitId', 'title', 'topic', 'words', 'phrases', 'sentences', 'text', 'grammar', 'exams'];

  data.forEach(function (unit, idx) {
    requiredFields.forEach(function (field) {
      assert(unit[field] !== undefined,
        'data-7a Unit ' + (idx + 1) + ' (' + (unit.unitId || '?') + '): 缺少字段 "' + field + '"');
    });

    if (unit.words) {
      assert(unit.words.length >= 15,
        'data-7a Unit ' + (idx + 1) + ': 单词数量过少 (' + unit.words.length + ')');
      unit.words.forEach(function (w, wi) {
        ['word', 'phonetic', 'pos', 'meaning', 'example', 'exampleCn'].forEach(function (f) {
          assert(w[f] !== undefined && w[f] !== null && w[f] !== '',
            'data-7a Unit ' + (idx + 1) + ' word[' + wi + '] (' + (w.word || '?') + '): 缺少/空字段 "' + f + '"');
        });
        assert(w.phonetic.charAt(0) === '/' && w.phonetic.charAt(w.phonetic.length - 1) === '/',
          'data-7a Unit ' + (idx + 1) + ' word "' + w.word + '": 音标格式应为 /.../，实际 "' + w.phonetic + '"');
      });
    }

    if (unit.exams) {
      assert(unit.exams.length >= 3,
        'data-7a Unit ' + (idx + 1) + ': 真题数量过少 (' + unit.exams.length + ')');
      unit.exams.forEach(function (e, ei) {
        ['question', 'options', 'answer', 'explanation'].forEach(function (f) {
          assert(e[f] !== undefined && e[f] !== null && e[f] !== '',
            'data-7a Unit ' + (idx + 1) + ' exam[' + ei + ']: 缺少/空字段 "' + f + '"');
        });
        assert(Array.isArray(e.options) && e.options.length === 4,
          'data-7a Unit ' + (idx + 1) + ' exam[' + ei + ']: options应为4个选项的数组');
        assert(['A', 'B', 'C', 'D'].indexOf(e.answer) >= 0,
          'data-7a Unit ' + (idx + 1) + ' exam[' + ei + ']: answer应为A/B/C/D，实际 "' + e.answer + '"');
        var optionLetters = e.options.map(function (o) { return o.charAt(0); });
        assert(optionLetters.indexOf(e.answer) >= 0,
          'data-7a Unit ' + (idx + 1) + ' exam[' + ei + ']: answer "' + e.answer + '" 不在选项中');
      });
    }

    if (unit.text) {
      assert(unit.text.title && unit.text.title.length > 0,
        'data-7a Unit ' + (idx + 1) + ': text.title 缺失');
      assert(unit.text.paragraphs && Array.isArray(unit.text.paragraphs),
        'data-7a Unit ' + (idx + 1) + ': text.paragraphs 应为数组');
      if (unit.text.paragraphs) {
        unit.text.paragraphs.forEach(function (para, pi) {
          assert(para.sentences && Array.isArray(para.sentences),
            'data-7a Unit ' + (idx + 1) + ' para[' + pi + ']: sentences 应为数组');
          if (para.sentences) {
            para.sentences.forEach(function (s, si) {
              assert(s.en && s.en.length > 0,
                'data-7a Unit ' + (idx + 1) + ' sent[' + si + ']: en 缺失');
              assert(s.cn && s.cn.length > 0,
                'data-7a Unit ' + (idx + 1) + ' sent[' + si + ']: cn 缺失');
              assert(Array.isArray(s.keywords),
                'data-7a Unit ' + (idx + 1) + ' sent[' + si + ']: keywords 应为数组');
            });
          }
        });
      }
    }

    if (unit.grammar) {
      assert(unit.grammar.title && unit.grammar.points,
        'data-7a Unit ' + (idx + 1) + ': grammar 结构不完整');
      if (unit.grammar.points) {
        unit.grammar.points.forEach(function (p, pi) {
          assert(p.rule && p.detail && Array.isArray(p.examples),
            'data-7a Unit ' + (idx + 1) + ' grammar point[' + pi + ']: 结构不完整');
        });
      }
    }
  });
}

// ============================================================
// 测试2: 数据完整性 - 译林版7B
// ============================================================
function testData7B() {
  var data = global.VocabData['yilin']['7b'];
  assert(Array.isArray(data), 'data-7b: 应为数组');
  assert(data.length === 8, 'data-7b: 应包含8个单元，实际 ' + (data ? data.length : 0));

  var requiredFields = ['unitId', 'title', 'topic', 'words', 'phrases', 'sentences', 'text', 'grammar', 'exams'];

  data.forEach(function (unit, idx) {
    requiredFields.forEach(function (field) {
      assert(unit[field] !== undefined,
        'data-7b Unit ' + (idx + 1) + ' (' + (unit.unitId || '?') + '): 缺少字段 "' + field + '"');
    });

    if (unit.words) {
      unit.words.forEach(function (w, wi) {
        ['word', 'phonetic', 'pos', 'meaning', 'example', 'exampleCn'].forEach(function (f) {
          assert(w[f] !== undefined && w[f] !== null && w[f] !== '',
            'data-7b Unit ' + (idx + 1) + ' word[' + wi + '] (' + (w.word || '?') + '): 缺少/空字段 "' + f + '"');
        });
        assert(w.phonetic.charAt(0) === '/' && w.phonetic.charAt(w.phonetic.length - 1) === '/',
          'data-7b Unit ' + (idx + 1) + ' word "' + w.word + '": 音标格式应为 /.../，实际 "' + w.phonetic + '"');
      });
    }

    if (unit.exams) {
      unit.exams.forEach(function (e, ei) {
        ['question', 'options', 'answer', 'explanation'].forEach(function (f) {
          assert(e[f] !== undefined && e[f] !== null && e[f] !== '',
            'data-7b Unit ' + (idx + 1) + ' exam[' + ei + ']: 缺少/空字段 "' + f + '"');
        });
        assert(Array.isArray(e.options) && e.options.length === 4,
          'data-7b Unit ' + (idx + 1) + ' exam[' + ei + ']: options应为4个选项的数组');
        assert(['A', 'B', 'C', 'D'].indexOf(e.answer) >= 0,
          'data-7b Unit ' + (idx + 1) + ' exam[' + ei + ']: answer应为A/B/C/D，实际 "' + e.answer + '"');
      });
    }
  });
}

// ============================================================
// 测试3: 其他版本数据
// ============================================================
function testDataOther() {
  var pep = global.VocabData['pep'];
  assert(pep !== undefined, 'data-other: 缺少人教版(pep)数据');
  assert(pep && pep['7a'] && Array.isArray(pep['7a']), 'data-other: pep.7a 应为数组');
  assert(pep && pep['7a'] && pep['7a'].length >= 2, 'data-other: pep.7a 至少2个单元');

  var waiyan = global.VocabData['waiyan'];
  assert(waiyan !== undefined, 'data-other: 缺少外研版(waiyan)数据');
  assert(waiyan && waiyan['7a'] && Array.isArray(waiyan['7a']), 'data-other: waiyan.7a 应为数组');
  assert(waiyan && waiyan['7a'] && waiyan['7a'].length >= 2, 'data-other: waiyan.7a 至少2个单元');

  if (pep && pep['7a']) {
    pep['7a'].forEach(function (unit, idx) {
      assert(unit.words && unit.words.length > 0, 'pep.7a Unit ' + (idx + 1) + ': words 不应为空');
      unit.words.forEach(function (w, wi) {
        ['word', 'phonetic', 'pos', 'meaning'].forEach(function (f) {
          assert(w[f] !== undefined && w[f] !== '',
            'pep.7a Unit ' + (idx + 1) + ' word[' + wi + ']: 缺少字段 "' + f + '"');
        });
      });
    });
  }
}

// ============================================================
// 测试4: HTML结构验证
// ============================================================
function testHTMLStructure() {
  var html = fs.readFileSync(HTML_PATH, 'utf-8');

  var scriptOrder = [
    'js/data-app.js', 'js/data-7a.js', 'js/data-7b.js', 'js/data-other.js',
    'js/flashcard.js', 'js/dictation.js', 'js/text-reader.js', 'js/exam.js', 'js/app.js'
  ];

  var positions = {};
  scriptOrder.forEach(function (script) {
    var pos = html.indexOf('src="' + script + '"');
    assert(pos >= 0, 'HTML: 缺少脚本引用 ' + script);
    positions[script] = pos;
  });

  for (var i = 0; i < scriptOrder.length - 1; i++) {
    var s1 = scriptOrder[i];
    var s2 = scriptOrder[i + 1];
    assert(positions[s1] < positions[s2],
      'HTML: 脚本顺序错误 - "' + s1 + '" 应在 "' + s2 + '" 之前');
  }

  var requiredIds = [
    'versionSelect', 'bookSelect', 'unitList', 'tabNav', 'tabContent',
    'checkinBtn', 'checkinStatusText', 'streakText',
    'calendarModal', 'calendarClose', 'calendarGrid', 'calendarStats',
    'calendarTitle', 'prevMonth', 'nextMonth',
    'encourageModal', 'encourageText', 'encourageClose',
    'keywordModal', 'keywordTitle', 'keywordBody', 'keywordClose'
  ];

  requiredIds.forEach(function (id) {
    assert(html.indexOf('id="' + id + '"') >= 0,
      'HTML: 缺少元素 id="' + id + '"');
  });

  assert(html.indexOf('css/style.css') >= 0, 'HTML: 缺少CSS引用 css/style.css');

  // 检查Tab按钮与app.js switch case 一致
  var tabBtns = ['flashcard', 'wordlist', 'phrases', 'sentences', 'textreader', 'grammar', 'exam', 'dictation', 'wordbook'];
  tabBtns.forEach(function (tab) {
    assert(html.indexOf('data-tab="' + tab + '"') >= 0,
      'HTML: 缺少Tab按钮 data-tab="' + tab + '"');
  });
}

// ============================================================
// 测试5: 命名空间一致性
// ============================================================
function testNamespaceConsistency() {
  var va = global.VocabApp;
  assert(va !== undefined, 'VocabApp 命名空间未定义');

  var requiredAppMethods = ['speak', 'Storage', 'state', 'getCurrentUnit', 'getUnits', 'switchTab', 'renderTabContent', 'escapeHtml'];
  requiredAppMethods.forEach(function (m) {
    assert(va[m] !== undefined, 'VocabApp.' + m + ' 未定义 (app.js)');
  });

  var storageMethods = [
    'get', 'set', 'getCheckinData', 'getTodayStr', 'isCheckedInToday',
    'checkin', 'getStreak', 'getTotalCheckinDays',
    'getMasteredWords', 'isMastered', 'setMastered',
    'getProgress', 'updateProgress',
    'getDictationScores', 'saveDictationScore',
    'getExamScores', 'saveExamScore',
    'getWordbook', 'isInWordbook', 'addToWordbook', 'removeFromWordbook'
  ];
  storageMethods.forEach(function (m) {
    assert(va.Storage && typeof va.Storage[m] === 'function',
      'VocabApp.Storage.' + m + ' 未定义或不是函数 (app.js)');
  });

  assert(va.Flashcard && typeof va.Flashcard.render === 'function', 'VocabApp.Flashcard.render 未定义');
  assert(va.Dictation && typeof va.Dictation.render === 'function', 'VocabApp.Dictation.render 未定义');
  assert(va.TextReader && typeof va.TextReader.render === 'function', 'VocabApp.TextReader.render 未定义');
  assert(va.Exam && typeof va.Exam.render === 'function', 'VocabApp.Exam.render 未定义');
}

// ============================================================
// 测试6: render函数签名一致性
// ============================================================
function testRenderSignatures() {
  var files = {
    'flashcard.js': 'function render(unit, container)',
    'dictation.js': 'function render(unit, container)',
    'text-reader.js': 'function render(unit, container)',
    'exam.js': 'function render(unit, container)'
  };

  Object.keys(files).forEach(function (file) {
    var code = fs.readFileSync(path.join(JS_DIR, file), 'utf-8');
    assert(code.indexOf(files[file]) >= 0,
      file + ': render 函数签名应为 "' + files[file] + '"');
  });
}

// ============================================================
// 测试7: Storage功能逻辑
// ============================================================
function testStorageLogic() {
  var Storage = global.VocabApp.Storage;

  Storage.set('test_key', { a: 1 });
  var result = Storage.get('test_key');
  assert(result && result.a === 1, 'Storage.get/set 基本读写失败');

  var def = Storage.get('nonexistent_key', 'default');
  assert(def === 'default', 'Storage.get 默认值返回错误');

  Storage.checkin('7a-u1');
  assert(Storage.isCheckedInToday() === true, 'Storage.checkin 后 isCheckedInToday 应为 true');

  var streak = Storage.getStreak();
  assert(streak >= 1, 'Storage.getStreak 打卡后应 >= 1，实际 ' + streak);

  Storage.setMastered('testword', true);
  assert(Storage.isMastered('testword') === true, 'Storage.setMastered(true) 后 isMastered 应为 true');
  Storage.setMastered('testword', false);
  assert(Storage.isMastered('testword') === false, 'Storage.setMastered(false) 后 isMastered 应为 false');
  assert(Storage.isMastered('unmarkedword') === undefined, 'Storage.isMastered 未标记应返回 undefined');

  Storage.addToWordbook({ word: 'apple', pos: 'n.', meaning: '苹果' });
  assert(Storage.isInWordbook('apple') === true, 'Storage.addToWordbook 后 isInWordbook 应为 true');
  Storage.removeFromWordbook('apple');
  assert(Storage.isInWordbook('apple') === false, 'Storage.removeFromWordbook 后 isInWordbook 应为 false');

  Storage.addToWordbook({ word: 'banana', meaning: '香蕉' });
  Storage.addToWordbook({ word: 'banana', meaning: '香蕉' });
  var book = Storage.getWordbook();
  assert(book.length === 1, 'Storage.addToWordbook 重复添加应去重，实际 ' + book.length);

  Storage.updateProgress('test-unit', 5);
  assert(Storage.getProgress()['test-unit'] === 5, 'Storage.updateProgress 首次设置失败');
  Storage.updateProgress('test-unit', 3);
  assert(Storage.getProgress()['test-unit'] === 5, 'Storage.updateProgress 不应回退进度');
  Storage.updateProgress('test-unit', 8);
  assert(Storage.getProgress()['test-unit'] === 8, 'Storage.updateProgress 应更新更大进度');

  Storage.saveDictationScore('u1', { score: 80, correct: 8, wrong: 2 });
  Storage.saveDictationScore('u1', { score: 90, correct: 9, wrong: 1 });
  var scores = Storage.getDictationScores();
  assert(scores['u1'] && scores['u1'].length === 2, 'Storage.saveDictationScore 多次保存应累积');

  Storage.saveExamScore('u1', { score: 100, correct: 5, total: 5 });
  var examScores = Storage.getExamScores();
  assert(examScores['u1'] && examScores['u1'].length === 1, 'Storage.saveExamScore 保存失败');
}

// ============================================================
// 测试8: 内容准确性抽查
// ============================================================
function testContentAccuracy() {
  var data7a = global.VocabData['yilin']['7a'];

  function findWord(data, target) {
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].words.length; j++) {
        if (data[i].words[j].word === target) return data[i].words[j];
      }
    }
    return null;
  }

  var gradeWord = findWord(data7a, 'grade');
  assert(gradeWord !== null, '抽查: 未找到单词 grade');
  if (gradeWord) {
    assert(gradeWord.phonetic === '/ɡreɪd/', '抽查: grade 音标应为 /ɡreɪd/，实际 "' + gradeWord.phonetic + '"');
    assert(gradeWord.meaning === '年级', '抽查: grade 释义应为"年级"，实际 "' + gradeWord.meaning + '"');
  }

  var studentWord = findWord(data7a, 'student');
  if (studentWord) {
    assert(studentWord.phonetic === '/ˈstjuːdnt/', '抽查: student 音标应为 /ˈstjuːdnt/，实际 "' + studentWord.phonetic + '"');
  }

  var musicWord = findWord(data7a, 'music');
  if (musicWord) {
    assert(musicWord.phonetic === '/ˈmjuːzɪk/', '抽查: music 音标应为 /ˈmjuːzɪk/，实际 "' + musicWord.phonetic + '"');
  }

  var tallWord = findWord(data7a, 'tall');
  if (tallWord) {
    assert(tallWord.phonetic === '/tɔːl/', '抽查: tall 音标应为 /tɔːl/，实际 "' + tallWord.phonetic + '"');
  }

  // 课文句子翻译抽查
  var u1text = data7a[0].text;
  var sent0 = u1text.paragraphs[0].sentences[0];
  assert(sent0.en === 'Millie is a new student at Sunshine Middle School.',
    '抽查课文: 7A-U1 首句英文不匹配');
  assert(sent0.cn === '米莉是阳光中学的一名新生。',
    '抽查课文: 7A-U1 首句中文翻译不匹配，实际 "' + sent0.cn + '"');

  var u2sent = data7a[1].text.paragraphs[0].sentences[1];
  assert(u2sent.cn === '李华是我最喜欢的足球明星。',
    '抽查课文: 7A-U2 句子翻译不匹配，实际 "' + u2sent.cn + '"');

  var data7b = global.VocabData['yilin']['7b'];
  var u5bSent = data7b[4].text.paragraphs[0].sentences[2];
  assert(u5bSent.cn === '突然，她们听到灌木丛中传来低语声。',
    '抽查课文: 7B-U5 句子翻译不匹配，实际 "' + u5bSent.cn + '"');

  // 中考真题答案抽查
  var exam1 = data7a[0].exams[0];
  assert(exam1.answer === 'A', '抽查真题: 7A-U1 第1题答案应为A，实际 "' + exam1.answer + '"');
  assert(exam1.options[0] === 'A. Are; am', '抽查真题: 7A-U1 第1题选项A不匹配');

  var exam63 = data7a[5].exams[2];
  assert(exam63.answer === 'A', '抽查真题: 7A-U6 第3题答案应为A(for)，实际 "' + exam63.answer + '"');

  var exam75 = data7b[6].exams[4];
  assert(exam75.answer === 'B', '抽查真题: 7B-U7 第5题答案应为B(Yes, I can.)，实际 "' + exam75.answer + '"');

  var exam63b = data7b[5].exams[2];
  assert(exam63b.answer === 'C', '抽查真题: 7B-U6 第3题答案应为C(fell)，实际 "' + exam63b.answer + '"');
}

// ============================================================
// 测试9: 字段名一致性
// ============================================================
function testFieldNameConsistency() {
  var wordFields = ['word', 'phonetic', 'pos', 'meaning', 'example', 'exampleCn'];

  var flashcardCode = fs.readFileSync(path.join(JS_DIR, 'flashcard.js'), 'utf-8');
  wordFields.forEach(function (f) {
    assert(flashcardCode.indexOf(f) >= 0,
      'flashcard.js: 未引用单词字段 "' + f + '"');
  });

  var appCode = fs.readFileSync(path.join(JS_DIR, 'app.js'), 'utf-8');
  wordFields.forEach(function (f) {
    assert(appCode.indexOf(f) >= 0,
      'app.js: 未引用字段 "' + f + '"');
  });

  var examCode = fs.readFileSync(path.join(JS_DIR, 'exam.js'), 'utf-8');
  ['question', 'options', 'answer', 'explanation'].forEach(function (f) {
    assert(examCode.indexOf(f) >= 0,
      'exam.js: 未引用真题字段 "' + f + '"');
  });

  var textReaderCode = fs.readFileSync(path.join(JS_DIR, 'text-reader.js'), 'utf-8');
  ['title', 'paragraphs', 'en', 'cn', 'keywords'].forEach(function (f) {
    assert(textReaderCode.indexOf(f) >= 0,
      'text-reader.js: 未引用字段 "' + f + '"');
  });
}

// ============================================================
// 测试10: 模块功能逻辑代码审查
// ============================================================
function testModuleLogic() {
  var flashcardCode = fs.readFileSync(path.join(JS_DIR, 'flashcard.js'), 'utf-8');
  assert(flashcardCode.indexOf('classList') >= 0 && flashcardCode.indexOf('flipped') >= 0,
    'flashcard.js: 缺少翻转逻辑 (classList/flipped)');
  assert(flashcardCode.indexOf('VocabApp.speak') >= 0,
    'flashcard.js: 缺少发音调用 (VocabApp.speak)');
  assert(flashcardCode.indexOf('setMastered') >= 0 && flashcardCode.indexOf('isMastered') >= 0,
    'flashcard.js: 缺少掌握标记存储 (setMastered/isMastered)');
  assert(flashcardCode.indexOf('localStorage') < 0,
    'flashcard.js: 应通过 Storage 间接访问 localStorage，而非直接访问');

  var dictationCode = fs.readFileSync(path.join(JS_DIR, 'dictation.js'), 'utf-8');
  assert(dictationCode.indexOf('cn2en') >= 0 && dictationCode.indexOf('en2cn') >= 0,
    'dictation.js: 缺少中英双向模式 (cn2en/en2cn)');
  assert(dictationCode.indexOf('toLowerCase') >= 0,
    'dictation.js: 缺少大小写不敏感判断 (toLowerCase)');
  assert(dictationCode.indexOf('correctCount') >= 0 && dictationCode.indexOf('wrongCount') >= 0,
    'dictation.js: 缺少正误计数 (correctCount/wrongCount)');
  assert(dictationCode.indexOf('saveDictationScore') >= 0,
    'dictation.js: 缺少成绩保存 (saveDictationScore)');

  var textReaderCode = fs.readFileSync(path.join(JS_DIR, 'text-reader.js'), 'utf-8');
  assert(textReaderCode.indexOf('highlightKeywords') >= 0,
    'text-reader.js: 缺少关键词高亮 (highlightKeywords)');
  assert(textReaderCode.indexOf('keyword') >= 0 && textReaderCode.indexOf('data-keyword') >= 0,
    'text-reader.js: 缺少关键词点击/解释逻辑');
  assert(textReaderCode.indexOf('speakSentence') >= 0,
    'text-reader.js: 缺少朗读句子 (speakSentence)');

  var examCode = fs.readFileSync(path.join(JS_DIR, 'exam.js'), 'utf-8');
  assert(examCode.indexOf('selectOption') >= 0,
    'exam.js: 缺少选项选择逻辑 (selectOption)');
  assert(examCode.indexOf('correct') >= 0 && examCode.indexOf('wrong') >= 0,
    'exam.js: 缺少正误样式标记 (correct/wrong)');
  assert(examCode.indexOf('saveExamScore') >= 0,
    'exam.js: 缺少成绩保存 (saveExamScore)');

  var appCode = fs.readFileSync(path.join(JS_DIR, 'app.js'), 'utf-8');
  assert(appCode.indexOf('switchTab') >= 0,
    'app.js: 缺少Tab切换 (switchTab)');
  assert(appCode.indexOf('renderUnitList') >= 0,
    'app.js: 缺少单元列表渲染 (renderUnitList)');
  assert(appCode.indexOf('checkin') >= 0,
    'app.js: 缺少打卡逻辑 (checkin)');
  assert(appCode.indexOf('renderCalendar') >= 0,
    'app.js: 缺少日历渲染 (renderCalendar)');
  assert(appCode.indexOf('getStreak') >= 0,
    'app.js: 缺少连续打卡计算 (getStreak)');
}

// ============================================================
// 测试11: 边界条件和潜在问题
// ============================================================
function testEdgeCases() {
  var data7a = global.VocabData['yilin']['7a'];
  var unit3Words = data7a[2].words;
  var oclock = null;
  for (var i = 0; i < unit3Words.length; i++) {
    if (unit3Words[i].word === "o'clock") { oclock = unit3Words[i]; break; }
  }
  assert(oclock !== null, '边界: data-7a U3 应包含单词 o\'clock');

  // 检查 7B Unit5 中 ' bush' 前导空格问题
  var data7b = global.VocabData['yilin']['7b'];
  var unit5Words = data7b[4].words;
  var bushWord = null;
  for (var j = 0; j < unit5Words.length; j++) {
    if (unit5Words[j].word.indexOf('bush') >= 0) { bushWord = unit5Words[j]; break; }
  }
  if (bushWord) {
    warn(bushWord.word === 'bush',
      'Minor: data-7b U5 单词 "' + bushWord.word + '" 前有前导空格');
  }

  // 检查 unitId 唯一性
  var allUnitIds = [];
  ['yilin'].forEach(function (ver) {
    ['7a', '7b'].forEach(function (book) {
      var units = global.VocabData[ver][book];
      units.forEach(function (u) {
        if (allUnitIds.indexOf(u.unitId) >= 0) {
          assert(false, '数据: unitId 重复 - ' + u.unitId);
        }
        allUnitIds.push(u.unitId);
      });
    });
  });

  // 检查 7A Unit4 'o'clock' 之外是否有其他带撇号的单词
  // 检查 exam 选项中答案字母是否与选项内容一致
  data7a.forEach(function (unit, idx) {
    if (unit.exams) {
      unit.exams.forEach(function (e, ei) {
        var answerOption = e.options.find(function (o) { return o.charAt(0) === e.answer; });
        assert(answerOption !== undefined,
          'data-7a Unit ' + (idx + 1) + ' exam[' + ei + ']: 答案 ' + e.answer + ' 对应选项不存在');
      });
    }
  });

  data7b.forEach(function (unit, idx) {
    if (unit.exams) {
      unit.exams.forEach(function (e, ei) {
        var answerOption = e.options.find(function (o) { return o.charAt(0) === e.answer; });
        assert(answerOption !== undefined,
          'data-7b Unit ' + (idx + 1) + ' exam[' + ei + ']: 答案 ' + e.answer + ' 对应选项不存在');
      });
    }
  });
}

// ============================================================
// 主函数
// ============================================================
function main() {
  console.log('=================================================');
  console.log('  QA验证测试 - 初一英语背单词应用');
  console.log('=================================================\n');

  console.log('[1/11] 初始化测试环境...');
  createMockBrowser();
  loadJS(path.join(JS_DIR, 'data-app.js'));
  loadJS(path.join(JS_DIR, 'data-7a.js'));
  loadJS(path.join(JS_DIR, 'data-7b.js'));
  loadJS(path.join(JS_DIR, 'data-other.js'));
  try {
    loadJS(path.join(JS_DIR, 'flashcard.js'));
    loadJS(path.join(JS_DIR, 'dictation.js'));
    loadJS(path.join(JS_DIR, 'text-reader.js'));
    loadJS(path.join(JS_DIR, 'exam.js'));
    loadJS(path.join(JS_DIR, 'app.js'));
    passed++;
  } catch (e) {
    failed++;
    errors.push('模块文件加载失败: ' + e.message);
  }
  syncGlobals();
  console.log('  环境初始化完成\n');

  console.log('[2/11] 测试 HTML结构...');
  testHTMLStructure();
  console.log('  完成\n');

  console.log('[3/11] 测试 数据完整性 - 译林7A...');
  testData7A();
  console.log('  完成\n');

  console.log('[4/11] 测试 数据完整性 - 译林7B...');
  testData7B();
  console.log('  完成\n');

  console.log('[5/11] 测试 其他版本数据...');
  testDataOther();
  console.log('  完成\n');

  console.log('[6/11] 测试 命名空间一致性...');
  testNamespaceConsistency();
  console.log('  完成\n');

  console.log('[7/11] 测试 render函数签名...');
  testRenderSignatures();
  console.log('  完成\n');

  console.log('[8/11] 测试 Storage功能逻辑...');
  testStorageLogic();
  console.log('  完成\n');

  console.log('[9/11] 测试 内容准确性抽查...');
  testContentAccuracy();
  console.log('  完成\n');

  console.log('[10/11] 测试 字段名一致性...');
  testFieldNameConsistency();
  console.log('  完成\n');

  console.log('[11/11] 测试 模块逻辑与边界条件...');
  testModuleLogic();
  testEdgeCases();
  console.log('  完成\n');

  console.log('=================================================');
  console.log('  测试结果汇总');
  console.log('=================================================');
  console.log('通过: ' + passed);
  console.log('失败: ' + failed);
  console.log('警告: ' + warnings.length);
  console.log('');

  if (errors.length > 0) {
    console.log('--- 失败项 (' + errors.length + ') ---');
    errors.forEach(function (e, i) {
      console.log((i + 1) + '. ' + e);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('--- 警告项 (' + warnings.length + ') ---');
    warnings.forEach(function (w, i) {
      console.log((i + 1) + '. ' + w);
    });
    console.log('');
  }

  console.log('=================================================');
  console.log(failed === 0 ? '  结论: PASS (全部通过)' : '  结论: FAIL (存在失败项)');
  console.log('=================================================');

  process.exit(failed === 0 ? 0 : 1);
}

main();

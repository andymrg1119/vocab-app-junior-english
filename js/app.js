/**
 * app.js
 * 主应用逻辑：导航、打卡、进度、Tab切换、共享工具
 * 全局命名空间：window.VocabApp
 */
window.VocabApp = window.VocabApp || {};

(function () {
  'use strict';

  /* ============================================================
     应用状态
     ============================================================ */
  var state = {
    version: 'yilin',
    book: '7a',
    unitId: null,
    tab: 'flashcard'
  };

  /* ============================================================
     工具函数：Web Speech API 朗读
     ============================================================ */
  function speak(text) {
    if (!window.speechSynthesis) {
      console.warn('浏览器不支持语音合成');
      return;
    }
    // 取消正在进行的朗读
    window.speechSynthesis.cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    // 优先选择英式英语语音 (en-GB)
    var voices = window.speechSynthesis.getVoices();
    var britishVoice = null;
    for (var i = 0; i < voices.length; i++) {
      var lang = voices[i].lang || '';
      if (lang.indexOf('en-GB') === 0 || lang.indexOf('en_GB') === 0) {
        britishVoice = voices[i];
        break;
      }
    }
    if (britishVoice) {
      utterance.voice = britishVoice;
    } else {
      // 如果没有英式语音，回退到任意英文语音
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].lang.indexOf('en') === 0) {
          utterance.voice = voices[j];
          break;
        }
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  // 语音列表可能异步加载
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () {
      window.speechSynthesis.getVoices();
    };
  }

  /* ============================================================
     Storage: localStorage 存储管理
     ============================================================ */
  var Storage = {
    /**
     * 读取JSON数据
     */
    get: function (key, defaultValue) {
      try {
        var data = localStorage.getItem(key);
        if (data === null) return defaultValue;
        return JSON.parse(data);
      } catch (e) {
        return defaultValue;
      }
    },

    /**
     * 存储JSON数据
     */
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('localStorage存储失败', e);
      }
    },

    /* ===== 打卡相关 ===== */

    /**
     * 获取打卡数据
     * @returns {Object} { "2026-01-15": { unitId, date }, ... }
     */
    getCheckinData: function () {
      return this.get(VocabConfig.storageKeys.checkin, {});
    },

    /**
     * 获取今天的日期字符串 YYYY-MM-DD
     */
    getTodayStr: function () {
      var d = new Date();
      var year = d.getFullYear();
      var month = ('0' + (d.getMonth() + 1)).slice(-2);
      var day = ('0' + d.getDate()).slice(-2);
      return year + '-' + month + '-' + day;
    },

    /**
     * 今天是否已打卡
     */
    isCheckedInToday: function () {
      var data = this.getCheckinData();
      return !!data[this.getTodayStr()];
    },

    /**
     * 执行打卡
     */
    checkin: function (unitId) {
      var data = this.getCheckinData();
      var today = this.getTodayStr();
      data[today] = {
        unitId: unitId,
        date: today,
        timestamp: Date.now()
      };
      this.set(VocabConfig.storageKeys.checkin, data);
    },

    /**
     * 获取连续打卡天数
     */
    getStreak: function () {
      var data = this.getCheckinData();
      var streak = 0;
      var today = new Date();

      // 从今天往前数
      for (var i = 0; i < 365; i++) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);
        var dateStr = year + '-' + month + '-' + day;
        if (data[dateStr]) {
          streak++;
        } else {
          // 如果是今天且未打卡，跳过继续往前看
          if (i === 0) continue;
          break;
        }
      }
      return streak;
    },

    /**
     * 获取总打卡天数
     */
    getTotalCheckinDays: function () {
      var data = this.getCheckinData();
      return Object.keys(data).length;
    },

    /* ===== 已掌握单词 ===== */

    /**
     * 获取已掌握单词数据
     * @returns {Object} { "word": true/false, ... }  true=已掌握, false=未掌握
     */
    getMasteredWords: function () {
      return this.get(VocabConfig.storageKeys.masteredWords, {});
    },

    /**
     * 检查单词是否已掌握
     * @returns {Boolean|undefined} true=已掌握, false=标记为未掌握, undefined=未标记
     */
    isMastered: function (word) {
      var data = this.getMasteredWords();
      return data[word];
    },

    /**
     * 设置单词掌握状态
     */
    setMastered: function (word, mastered) {
      var data = this.getMasteredWords();
      data[word] = mastered;
      this.set(VocabConfig.storageKeys.masteredWords, data);
    },

    /* ===== 学习进度 ===== */

    getProgress: function () {
      return this.get(VocabConfig.storageKeys.progress, {});
    },

    updateProgress: function (unitId, cardIndex) {
      var data = this.getProgress();
      if (!data[unitId] || data[unitId] < cardIndex) {
        data[unitId] = cardIndex;
        this.set(VocabConfig.storageKeys.progress, data);
      }
    },

    /* ===== 默写成绩 ===== */

    getDictationScores: function () {
      return this.get(VocabConfig.storageKeys.dictationScores, {});
    },

    saveDictationScore: function (unitId, scoreData) {
      var data = this.getDictationScores();
      if (!data[unitId]) data[unitId] = [];
      data[unitId].push(scoreData);
      this.set(VocabConfig.storageKeys.dictationScores, data);
    },

    /* ===== 真题成绩 ===== */

    getExamScores: function () {
      return this.get(VocabConfig.storageKeys.examScores, {});
    },

    saveExamScore: function (unitId, scoreData) {
      var data = this.getExamScores();
      if (!data[unitId]) data[unitId] = [];
      data[unitId].push(scoreData);
      this.set(VocabConfig.storageKeys.examScores, data);
    },

    /* ===== 生词本 ===== */

    getWordbook: function () {
      return this.get(VocabConfig.storageKeys.wordbook, []);
    },

    isInWordbook: function (word) {
      var book = this.getWordbook();
      for (var i = 0; i < book.length; i++) {
        if (book[i].word === word) return true;
      }
      return false;
    },

    addToWordbook: function (wordData) {
      var book = this.getWordbook();
      if (!this.isInWordbook(wordData.word)) {
        book.push(wordData);
        this.set(VocabConfig.storageKeys.wordbook, book);
      }
    },

    removeFromWordbook: function (word) {
      var book = this.getWordbook();
      var newBook = [];
      for (var i = 0; i < book.length; i++) {
        if (book[i].word !== word) {
          newBook.push(book[i]);
        }
      }
      this.set(VocabConfig.storageKeys.wordbook, newBook);
    }
  };

  /* ============================================================
     数据获取
     ============================================================ */

  /**
     获取当前版本+册的单元列表
     */
  function getUnits() {
    if (!window.VocabData || !VocabData[state.version] || !VocabData[state.version][state.book]) {
      return [];
    }
    return VocabData[state.version][state.book];
  }

  /**
     获取当前单元数据
     */
  function getCurrentUnit() {
    var units = getUnits();
    if (units.length === 0) return null;
    if (!state.unitId) return units[0];
    for (var i = 0; i < units.length; i++) {
      if (units[i].unitId === state.unitId) return units[i];
    }
    return units[0];
  }

  /* ============================================================
     初始化
     ============================================================ */

  function init() {
    initVersionSelect();
    initBookSelect();
    initUnitList();
    initTabNav();
    initCheckin();
    initModals();

    // 默认选中第一个单元
    var units = getUnits();
    if (units.length > 0) {
      state.unitId = units[0].unitId;
      renderUnitList();
    }

    // 渲染默认Tab
    switchTab(state.tab);

    // 更新打卡状态显示
    updateCheckinDisplay();
  }

  /* ============================================================
     版本选择
     ============================================================ */

  function initVersionSelect() {
    var select = document.getElementById('versionSelect');
    select.innerHTML = '';
    for (var i = 0; i < VocabConfig.versions.length; i++) {
      var v = VocabConfig.versions[i];
      var option = document.createElement('option');
      option.value = v.id;
      option.textContent = v.name;
      select.appendChild(option);
    }
    select.value = state.version;
    select.addEventListener('change', function () {
      state.version = this.value;
      // 重置book为该版本的第一本书
      var version = getVersionById(state.version);
      if (version && version.books.length > 0) {
        state.book = version.books[0].id;
      }
      state.unitId = null;
      initBookSelect();
      initUnitList();
      var units = getUnits();
      if (units.length > 0) {
        state.unitId = units[0].unitId;
        renderUnitList();
      }
      switchTab(state.tab);
    });
  }

  function getVersionById(versionId) {
    for (var i = 0; i < VocabConfig.versions.length; i++) {
      if (VocabConfig.versions[i].id === versionId) return VocabConfig.versions[i];
    }
    return null;
  }

  /* ============================================================
     册别选择
     ============================================================ */

  function initBookSelect() {
    var select = document.getElementById('bookSelect');
    var version = getVersionById(state.version);
    select.innerHTML = '';

    if (!version) {
      select.disabled = true;
      return;
    }

    select.disabled = version.books.length <= 1;

    for (var i = 0; i < version.books.length; i++) {
      var b = version.books[i];
      var option = document.createElement('option');
      option.value = b.id;
      option.textContent = b.name;
      select.appendChild(option);
    }
    select.value = state.book;

    // 移除旧的事件监听（通过克隆节点）
    var newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    newSelect.value = state.book;
    newSelect.addEventListener('change', function () {
      state.book = this.value;
      state.unitId = null;
      initUnitList();
      var units = getUnits();
      if (units.length > 0) {
        state.unitId = units[0].unitId;
        renderUnitList();
      }
      switchTab(state.tab);
    });
  }

  /* ============================================================
     单元列表
     ============================================================ */

  function initUnitList() {
    renderUnitList();
  }

  function renderUnitList() {
    var list = document.getElementById('unitList');
    var units = getUnits();
    list.innerHTML = '';

    if (units.length === 0) {
      list.innerHTML = '<li style="padding:20px;color:#999;text-align:center;">暂无数据</li>';
      return;
    }

    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      var li = document.createElement('li');
      li.className = 'unit-item';
      if (unit.unitId === state.unitId) {
        li.classList.add('active');
      }
      li.setAttribute('data-unit-id', unit.unitId);

      var titleSpan = document.createElement('span');
      titleSpan.textContent = unit.title;
      li.appendChild(titleSpan);

      if (unit.topic) {
        var topicSpan = document.createElement('span');
        topicSpan.className = 'unit-topic';
        topicSpan.textContent = unit.topic;
        li.appendChild(topicSpan);
      }

      li.addEventListener('click', function () {
        var unitId = this.getAttribute('data-unit-id');
        state.unitId = unitId;
        renderUnitList();
        switchTab(state.tab);
      });

      list.appendChild(li);
    }
  }

  /* ============================================================
     Tab导航
     ============================================================ */

  function initTabNav() {
    var tabs = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var tabName = this.getAttribute('data-tab');
        switchTab(tabName);
      });
    }
  }

  function switchTab(tabName) {
    state.tab = tabName;

    // 更新Tab按钮状态
    var tabs = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tabName);
    }

    // 渲染内容
    renderTabContent(tabName);
  }

  function renderTabContent(tabName) {
    var container = document.getElementById('tabContent');
    var unit = getCurrentUnit();

    if (!unit) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">请选择一个单元</div></div>';
      return;
    }

    switch (tabName) {
      case 'flashcard':
        VocabApp.Flashcard.render(unit, container);
        break;
      case 'wordlist':
        renderWordlist(unit, container);
        break;
      case 'phrases':
        renderPhrases(unit, container);
        break;
      case 'sentences':
        renderSentences(unit, container);
        break;
      case 'textreader':
        VocabApp.TextReader.render(unit, container);
        break;
      case 'grammar':
        renderGrammar(unit, container);
        break;
      case 'exam':
        VocabApp.Exam.render(unit, container);
        break;
      case 'dictation':
        VocabApp.Dictation.render(unit, container);
        break;
      case 'wordbook':
        renderWordbook(container);
        break;
      default:
        VocabApp.Flashcard.render(unit, container);
    }
  }

  /* ============================================================
     生词表渲染
     ============================================================ */

  function renderWordlist(unit, container) {
    if (!unit.words || unit.words.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无单词数据</div></div>';
      return;
    }

    var html = '<div class="wordlist-container">';
    for (var i = 0; i < unit.words.length; i++) {
      var w = unit.words[i];
      var mastered = Storage.isMastered(w.word);
      var starred = Storage.isInWordbook(w.word);
      html += '<div class="word-card">';
      html += '  <div class="word-main">';
      html += '    <span class="word-en">' + escapeHtml(w.word) + '</span>';
      html += '    <span class="word-pos">' + escapeHtml(w.pos || '') + '</span>';
      html += '    <div class="word-phonetic">' + escapeHtml(w.phonetic || '') + '</div>';
      html += '    <div class="word-cn">' + escapeHtml(w.meaning || '') + '</div>';
      if (w.example) {
        html += '    <div class="word-example">' + escapeHtml(w.example) + (w.exampleCn ? ' （' + escapeHtml(w.exampleCn) + '）' : '') + '</div>';
      }
      html += '  </div>';
      html += '  <div class="word-actions">';
      html += '    <button class="btn-speak" data-word="' + escapeHtml(w.word) + '">🔊</button>';
      html += '    <button class="btn-star ' + (starred ? 'starred' : '') + '" data-word="' + escapeHtml(w.word) + '" data-index="' + i + '">★</button>';
      if (mastered === true) {
        html += '    <span style="color:#4CAF50;font-size:13px;">✓ 已掌握</span>';
      } else if (mastered === false) {
        html += '    <span style="color:#F44336;font-size:13px;">✗ 未掌握</span>';
      }
      html += '  </div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // 绑定发音和收藏事件
    var speakBtns = container.querySelectorAll('.btn-speak');
    for (var s = 0; s < speakBtns.length; s++) {
      speakBtns[s].addEventListener('click', function () {
        speak(this.getAttribute('data-word'));
      });
    }

    var starBtns = container.querySelectorAll('.btn-star');
    for (var st = 0; st < starBtns.length; st++) {
      starBtns[st].addEventListener('click', function () {
        var word = this.getAttribute('data-word');
        var index = parseInt(this.getAttribute('data-index'), 10);
        if (Storage.isInWordbook(word)) {
          Storage.removeFromWordbook(word);
          this.classList.remove('starred');
        } else {
          Storage.addToWordbook(unit.words[index]);
          this.classList.add('starred');
        }
      });
    }
  }

  /* ============================================================
     短语渲染
     ============================================================ */

  function renderPhrases(unit, container) {
    if (!unit.phrases || unit.phrases.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-text">暂无短语数据</div></div>';
      return;
    }

    var html = '<div class="phrases-container">';
    for (var i = 0; i < unit.phrases.length; i++) {
      var p = unit.phrases[i];
      html += '<div class="phrase-card">';
      html += '  <div class="phrase-en">' + escapeHtml(p.phrase) + '</div>';
      html += '  <div class="phrase-cn">' + escapeHtml(p.meaning) + '</div>';
      if (p.example) {
        html += '  <div class="phrase-example">' + escapeHtml(p.example) + '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // 绑定朗读
    var phraseEls = container.querySelectorAll('.phrase-card');
    for (var j = 0; j < phraseEls.length; j++) {
      (function (index) {
        var btn = document.createElement('button');
        btn.className = 'speak-btn';
        btn.textContent = '🔊 朗读';
        btn.style.marginTop = '8px';
        btn.addEventListener('click', function () {
          speak(unit.phrases[index].phrase);
        });
        phraseEls[index].appendChild(btn);
      })(j);
    }
  }

  /* ============================================================
     经典句子渲染
     ============================================================ */

  function renderSentences(unit, container) {
    if (!unit.sentences || unit.sentences.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-text">暂无经典句子</div></div>';
      return;
    }

    var html = '<div class="sentences-container">';
    for (var i = 0; i < unit.sentences.length; i++) {
      var s = unit.sentences[i];
      html += '<div class="sentence-card">';
      html += '  <div class="sentence-content">';
      html += '    <div class="sentence-en">' + escapeHtml(s.en) + '</div>';
      html += '    <div class="sentence-cn">' + escapeHtml(s.cn) + '</div>';
      html += '  </div>';
      html += '  <button class="speak-btn" data-sentence="' + i + '">🔊</button>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    var speakBtns = container.querySelectorAll('.speak-btn');
    for (var j = 0; j < speakBtns.length; j++) {
      speakBtns[j].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-sentence'), 10);
        speak(unit.sentences[idx].en);
      });
    }
  }

  /* ============================================================
     语法渲染
     ============================================================ */

  function renderGrammar(unit, container) {
    if (!unit.grammar) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📐</div><div class="empty-text">暂无语法数据</div></div>';
      return;
    }

    var g = unit.grammar;
    var html = '<div class="grammar-container">';
    html += '<h3 class="grammar-title">' + escapeHtml(g.title) + '</h3>';

    if (g.points && g.points.length > 0) {
      for (var i = 0; i < g.points.length; i++) {
        var pt = g.points[i];
        html += '<div class="grammar-point">';
        html += '  <div class="grammar-rule">' + escapeHtml(pt.rule) + '</div>';
        html += '  <div class="grammar-detail">' + escapeHtml(pt.detail) + '</div>';
        if (pt.examples && pt.examples.length > 0) {
          html += '  <ul class="grammar-examples">';
          for (var j = 0; j < pt.examples.length; j++) {
            html += '    <li>' + escapeHtml(pt.examples[j]) + '</li>';
          }
          html += '  </ul>';
        }
        html += '</div>';
      }
    }

    html += '</div>';
    container.innerHTML = html;

    // 为每个语法例句添加朗读功能
    var exampleLis = container.querySelectorAll('.grammar-examples li');
    for (var k = 0; k < exampleLis.length; k++) {
      (function (li) {
        li.style.cursor = 'pointer';
        li.title = '点击朗读';
        li.addEventListener('click', function () {
          speak(li.textContent);
        });
      })(exampleLis[k]);
    }
  }

  /* ============================================================
     生词本渲染
     ============================================================ */

  function renderWordbook(container) {
    var book = Storage.getWordbook();

    if (book.length === 0) {
      container.innerHTML =
        '<div class="wordbook-empty">' +
        '<div style="font-size:48px;margin-bottom:12px;">📚</div>' +
        '<div>生词本还是空的</div>' +
        '<div style="font-size:14px;margin-top:8px;color:#999;">在生词表中点击 ★ 可以将单词加入生词本</div>' +
        '</div>';
      return;
    }

    var html = '<div class="wordlist-container">';
    html += '<div style="text-align:center;margin-bottom:16px;color:#666;">共 ' + book.length + ' 个生词</div>';
    for (var i = 0; i < book.length; i++) {
      var w = book[i];
      html += '<div class="word-card">';
      html += '  <div class="word-main">';
      html += '    <span class="word-en">' + escapeHtml(w.word) + '</span>';
      html += '    <span class="word-pos">' + escapeHtml(w.pos || '') + '</span>';
      html += '    <div class="word-phonetic">' + escapeHtml(w.phonetic || '') + '</div>';
      html += '    <div class="word-cn">' + escapeHtml(w.meaning || '') + '</div>';
      if (w.example) {
        html += '    <div class="word-example">' + escapeHtml(w.example) + '</div>';
      }
      html += '  </div>';
      html += '  <div class="word-actions">';
      html += '    <button class="btn-speak" data-word="' + escapeHtml(w.word) + '">🔊</button>';
      html += '    <button class="btn-star starred" data-word="' + escapeHtml(w.word) + '">★</button>';
      html += '  </div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // 绑定事件
    var speakBtns = container.querySelectorAll('.btn-speak');
    for (var s = 0; s < speakBtns.length; s++) {
      speakBtns[s].addEventListener('click', function () {
        speak(this.getAttribute('data-word'));
      });
    }

    var starBtns = container.querySelectorAll('.btn-star');
    for (var st = 0; st < starBtns.length; st++) {
      starBtns[st].addEventListener('click', function () {
        var word = this.getAttribute('data-word');
        Storage.removeFromWordbook(word);
        renderWordbook(container);
      });
    }
  }

  /* ============================================================
     打卡系统
     ============================================================ */

  function initCheckin() {
    var btn = document.getElementById('checkinBtn');
    btn.addEventListener('click', function () {
      if (Storage.isCheckedInToday()) {
        // 已打卡，显示日历
        showCalendar();
        return;
      }
      doCheckin();
    });
  }

  function doCheckin() {
    var unit = getCurrentUnit();
    var unitId = unit ? unit.unitId : null;
    Storage.checkin(unitId);
    updateCheckinDisplay();

    // 显示鼓励语
    var encouragements = VocabConfig.encouragements;
    var msg = encouragements[Math.floor(Math.random() * encouragements.length)];
    document.getElementById('encourageText').textContent = msg;
    document.getElementById('encourageModal').classList.add('show');
  }

  function updateCheckinDisplay() {
    var checkedToday = Storage.isCheckedInToday();
    var streak = Storage.getStreak();

    var statusText = document.getElementById('checkinStatusText');
    var streakText = document.getElementById('streakText');
    var btn = document.getElementById('checkinBtn');

    if (checkedToday) {
      statusText.textContent = '今日已打卡 ✓';
      btn.textContent = '查看日历';
      btn.classList.add('done');
    } else {
      statusText.textContent = '今日尚未打卡';
      btn.textContent = '今日打卡';
      btn.classList.remove('done');
    }

    streakText.textContent = '连续打卡：' + streak + '天';
  }

  /* ============================================================
     打卡日历
     ============================================================ */

  var calendarDate = new Date();

  function showCalendar() {
    calendarDate = new Date();
    renderCalendar();
    document.getElementById('calendarModal').classList.add('show');
  }

  function renderCalendar() {
    var year = calendarDate.getFullYear();
    var month = calendarDate.getMonth();
    var today = new Date();
    var todayStr = Storage.getTodayStr();

    // 标题
    document.getElementById('calendarTitle').textContent = year + '年' + (month + 1) + '月';

    var checkinData = Storage.getCheckinData();

    // 构建日历网格
    var firstDay = new Date(year, month, 1).getDay(); // 0=Sunday
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var html = '';
    var weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    for (var i = 0; i < 7; i++) {
      html += '<div class="calendar-cell header">' + weekDays[i] + '</div>';
    }

    // 空白格
    for (var j = 0; j < firstDay; j++) {
      html += '<div class="calendar-cell empty"></div>';
    }

    // 日期
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + ('0' + (month + 1)).slice(-2) + '-' + ('0' + d).slice(-2);
      var classes = 'calendar-cell day';
      var checked = !!checkinData[dateStr];
      var isToday = (dateStr === todayStr);

      if (checked) classes += ' checked';
      if (isToday) classes += ' today';

      html += '<div class="' + classes + '">' + d + '</div>';
    }

    document.getElementById('calendarGrid').innerHTML = html;

    // 统计
    var streak = Storage.getStreak();
    var total = Storage.getTotalCheckinDays();
    var statsHtml = '本月已打卡 <span class="stat-num">' + countMonthCheckins(checkinData, year, month) + '</span> 天' +
      ' ｜ 总计 <span class="stat-num">' + total + '</span> 天' +
      ' ｜ 连续 <span class="stat-num">' + streak + '</span> 天';
    document.getElementById('calendarStats').innerHTML = statsHtml;
  }

  function countMonthCheckins(data, year, month) {
    var count = 0;
    var prefix = year + '-' + ('0' + (month + 1)).slice(-2);
    for (var key in data) {
      if (data.hasOwnProperty(key) && key.indexOf(prefix) === 0) {
        count++;
      }
    }
    return count;
  }

  /* ============================================================
     弹窗管理
     ============================================================ */

  function initModals() {
    // 打卡日历
    document.getElementById('calendarClose').addEventListener('click', function () {
      document.getElementById('calendarModal').classList.remove('show');
    });
    document.getElementById('prevMonth').addEventListener('click', function () {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', function () {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    });

    // 鼓励语弹窗
    document.getElementById('encourageClose').addEventListener('click', function () {
      document.getElementById('encourageModal').classList.remove('show');
    });

    // 关键词弹窗
    document.getElementById('keywordClose').addEventListener('click', function () {
      document.getElementById('keywordModal').classList.remove('show');
    });

    // 点击遮罩关闭弹窗
    var overlays = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < overlays.length; i++) {
      overlays[i].addEventListener('click', function (e) {
        if (e.target === this) {
          this.classList.remove('show');
        }
      });
    }
  }

  /* ============================================================
     工具函数
     ============================================================ */

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ============================================================
     暴露到全局
     ============================================================ */

  VocabApp.speak = speak;
  VocabApp.Storage = Storage;
  VocabApp.state = state;
  VocabApp.getCurrentUnit = getCurrentUnit;
  VocabApp.getUnits = getUnits;
  VocabApp.switchTab = switchTab;
  VocabApp.renderTabContent = renderTabContent;
  VocabApp.escapeHtml = escapeHtml;

  /* ============================================================
     DOM加载完成后初始化
     ============================================================ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

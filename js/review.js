/**
 * review.js
 * 间隔重复（艾宾浩斯遗忘曲线）复习模块
 *
 * 设计：
 * - 单词在「单词卡」里被标记为「已掌握」时，自动进入复习计划。
 * - 按艾宾浩斯间隔安排复习：第 1 / 2 / 4 / 7 / 15 / 30 天后各复习一次，共 6 轮。
 * - 复习时「记得」→ 进入下一轮（6 轮全部通过后视为长期记住，移出计划）；
 *   「忘了」→ 回到第 1 天重新开始。
 * - 本模块是自由复习工具（与生词本一样），不计入闯关、始终可进入。
 *
 * 存储：localStorage 键 VocabConfig.storageKeys.review，结构：
 *   { "<word>": { word, phonetic, pos, meaning, example, exampleCn, unitId, learnedAt, stage, nextReviewAt } }
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.Review = (function () {
  'use strict';

  // 艾宾浩斯间隔（天）
  var INTERVALS = [1, 2, 4, 7, 15, 30];

  var dueWords = [];      // 当前到期待复习的单词列表（渲染时填充）
  var currentIndex = 0;   // 当前复习到的下标
  var isFlipped = false;  // 卡片是否已翻转

  /* ============================================================
     数据存取
     ============================================================ */
  function getPlan() {
    return VocabApp.Storage.get(VocabConfig.storageKeys.review, {});
  }

  function savePlan(plan) {
    VocabApp.Storage.set(VocabConfig.storageKeys.review, plan);
  }

  /** 某时间戳所在日期的 0 点毫秒 */
  function dayStart(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** 今天 0 点 */
  function todayStart() {
    return dayStart(Date.now());
  }

  /** 从今天 0 点起加 n 天后的 0 点毫秒 */
  function addDays(n) {
    var d = new Date(todayStart());
    d.setDate(d.getDate() + n);
    return d.getTime();
  }

  /* ============================================================
     核心逻辑
     ============================================================ */

  /**
   * 单词进入复习计划（在单词卡标记「已掌握」时调用）
   * @param {Object} wordData - 完整单词对象 { word, phonetic, pos, meaning, example, exampleCn }
   * @param {String} unitId - 所属单元
   */
  function scheduleWord(wordData, unitId) {
    if (!wordData || !wordData.word) return;
    var plan = getPlan();
    var entry = plan[wordData.word];
    if (entry) {
      // 已在计划中：仅刷新所属单元（可能在不同单元出现同一词）
      if (unitId) entry.unitId = unitId;
      savePlan(plan);
      return;
    }
    plan[wordData.word] = {
      word: wordData.word,
      phonetic: wordData.phonetic || '',
      pos: wordData.pos || '',
      meaning: wordData.meaning || '',
      example: wordData.example || '',
      exampleCn: wordData.exampleCn || '',
      unitId: unitId || '',
      learnedAt: Date.now(),
      stage: 0,
      nextReviewAt: addDays(INTERVALS[0])
    };
    savePlan(plan);
    updateBadge();
  }

  /** 获取今天到期的单词（nextReviewAt <= 今天 0 点） */
  function getDueWords() {
    var plan = getPlan();
    var today = todayStart();
    var result = [];
    for (var w in plan) {
      if (plan.hasOwnProperty(w) && plan[w].nextReviewAt <= today) {
        result.push(plan[w]);
      }
    }
    result.sort(function (a, b) { return a.nextReviewAt - b.nextReviewAt; });
    return result;
  }

  /**
   * 复习一个单词
   * @param {String} word - 单词
   * @param {Boolean} remembered - 是否记得
   */
  function reviewWord(word, remembered) {
    var plan = getPlan();
    var entry = plan[word];
    if (!entry) return;
    if (remembered) {
      entry.stage = entry.stage + 1;
      if (entry.stage >= INTERVALS.length) {
        delete plan[word]; // 6 轮全部通过，长期记住
      } else {
        entry.nextReviewAt = addDays(INTERVALS[entry.stage]);
      }
    } else {
      entry.stage = 0;
      entry.nextReviewAt = addDays(INTERVALS[0]);
    }
    savePlan(plan);
    updateBadge();
  }

  /** 复习计划中单词总数 */
  function getPlanCount() {
    return Object.keys(getPlan()).length;
  }

  /** 今日到期单词数 */
  function getDueCount() {
    return getDueWords().length;
  }

  /* ============================================================
     角标（Tab 上的红点数字）
     ============================================================ */
  function updateBadge() {
    var badge = document.querySelector('.tab-btn[data-tab="review"] .review-badge');
    if (!badge) return;
    var due = getDueCount();
    badge.textContent = due;
    badge.style.display = due > 0 ? 'inline-block' : 'none';
  }

  /* ============================================================
     渲染
     ============================================================ */
  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(container) {
    dueWords = getDueWords();
    currentIndex = 0;
    isFlipped = false;

    if (dueWords.length === 0) {
      renderEmpty(container);
      return;
    }

    var html = '';
    html += '<div class="review-container">';
    html += '  <div class="review-header">';
    html += '    <div class="review-stats">今日待复习 <b>' + dueWords.length + '</b> 个 · 复习计划共 <b>' + getPlanCount() + '</b> 个</div>';
    html += '  </div>';
    html += '  <div class="review-flashcard-wrap">';
    html += '    <div class="flashcard-wrapper review-flashcard-wrapper">';
    html += '      <div class="flashcard" id="reviewCard">';
    html += '        <div class="flashcard-face flashcard-front">';
    html += '          <span class="card-label" id="reviewCardLabel"></span>';
    html += '          <div class="card-word" id="reviewCardWord"></div>';
    html += '          <div class="card-pos" id="reviewCardPos"></div>';
    html += '          <div class="card-hint">点击卡片查看释义</div>';
    html += '        </div>';
    html += '        <div class="flashcard-face flashcard-back">';
    html += '          <div class="card-phonetic" id="reviewCardPhonetic"></div>';
    html += '          <div class="card-meaning" id="reviewCardMeaning"></div>';
    html += '          <div class="card-example" id="reviewCardExample"></div>';
    html += '          <div class="card-example-cn" id="reviewCardExampleCn"></div>';
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="review-actions">';
    html += '    <button class="review-btn review-speak" id="reviewSpeak">🔊 朗读</button>';
    html += '    <button class="review-btn review-forgot" id="reviewForgot">✗ 忘了</button>';
    html += '    <button class="review-btn review-remember" id="reviewRemember">✓ 记得</button>';
    html += '  </div>';
    html += '</div>';
    container.innerHTML = html;

    bindEvents();
    updateCard();
  }

  function renderEmpty(container) {
    var total = getPlanCount();
    var html = '<div class="review-empty">';
    html += '  <div class="review-empty-icon">🎉</div>';
    html += '  <div class="review-empty-title">今日没有需要复习的单词</div>';
    if (total > 0) {
      html += '  <div class="review-empty-sub">复习计划中还有 <b>' + total + '</b> 个单词，会在到期时提醒你</div>';
    } else {
      html += '  <div class="review-empty-sub">在「单词卡」里把单词标记为「已掌握」，就会自动进入复习计划</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function bindEvents() {
    var card = document.getElementById('reviewCard');
    var speakBtn = document.getElementById('reviewSpeak');
    var forgotBtn = document.getElementById('reviewForgot');
    var rememberBtn = document.getElementById('reviewRemember');

    if (card) {
      card.addEventListener('click', function () { toggleFlip(); });
    }
    if (speakBtn) {
      speakBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        speakCurrent();
      });
    }
    if (forgotBtn) {
      forgotBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        answerCurrent(false);
      });
    }
    if (rememberBtn) {
      rememberBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        answerCurrent(true);
      });
    }
  }

  function toggleFlip() {
    isFlipped = !isFlipped;
    var card = document.getElementById('reviewCard');
    if (card) {
      card.classList.toggle('flipped', isFlipped);
    }
  }

  function updateCard() {
    if (dueWords.length === 0) return;
    var entry = dueWords[currentIndex];
    if (!entry) return;

    isFlipped = false;
    var card = document.getElementById('reviewCard');
    if (card) card.classList.remove('flipped');

    var label = document.getElementById('reviewCardLabel');
    if (label) label.textContent = '第 ' + (currentIndex + 1) + ' / ' + dueWords.length + ' 个';

    var wordEl = document.getElementById('reviewCardWord');
    if (wordEl) wordEl.textContent = entry.word;
    var posEl = document.getElementById('reviewCardPos');
    if (posEl) posEl.textContent = entry.pos || '';
    var phEl = document.getElementById('reviewCardPhonetic');
    if (phEl) phEl.textContent = entry.phonetic || '';
    var meEl = document.getElementById('reviewCardMeaning');
    if (meEl) meEl.textContent = entry.meaning || '';
    var exEl = document.getElementById('reviewCardExample');
    if (exEl) exEl.textContent = entry.example || '';
    var exCnEl = document.getElementById('reviewCardExampleCn');
    if (exCnEl) exCnEl.textContent = entry.exampleCn || '';

    // 更新统计行
    var statsEl = document.querySelector('.review-stats');
    if (statsEl) {
      statsEl.innerHTML = '今日待复习 <b>' + dueWords.length + '</b> 个 · 复习计划共 <b>' + getPlanCount() + '</b> 个';
    }
  }

  function speakCurrent() {
    if (!dueWords[currentIndex]) return;
    if (VocabApp.speak) {
      VocabApp.speak(dueWords[currentIndex].word);
    }
  }

  function answerCurrent(remembered) {
    var entry = dueWords[currentIndex];
    if (!entry) return;

    reviewWord(entry.word, remembered);

    // 从待复习列表移除当前单词（本次会话不再显示）
    dueWords.splice(currentIndex, 1);

    if (dueWords.length === 0) {
      renderDone();
      return;
    }
    // 下标不变，下一个顶上；若越界则回退到最后一个
    if (currentIndex >= dueWords.length) {
      currentIndex = dueWords.length - 1;
    }
    updateCard();
  }

  function renderDone() {
    var total = getPlanCount();
    var html = '<div class="review-empty">';
    html += '  <div class="review-empty-icon">🏆</div>';
    html += '  <div class="review-empty-title">今日复习完成！</div>';
    if (total > 0) {
      html += '  <div class="review-empty-sub">还有 <b>' + total + '</b> 个单词在计划中，明天继续加油</div>';
    } else {
      html += '  <div class="review-empty-sub">所有单词都记得很牢啦！继续保持 💪</div>';
    }
    html += '</div>';
    var container = document.getElementById('tabContent');
    if (container) container.innerHTML = html;
  }

  return {
    render: render,
    scheduleWord: scheduleWord,
    reviewWord: reviewWord,
    updateBadge: updateBadge,
    getDueCount: getDueCount,
    getDueWords: getDueWords,
    getPlanCount: getPlanCount
  };
})();

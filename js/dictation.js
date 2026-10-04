/**
 * dictation.js
 * 默写功能（重构版）
 * 规则：每题只能提交一次，提交后不可修改，必须全部默写完成，
 * 必须全部正确（100分）才算过关。
 * 统计：准确率、错误率、历史记录、汇总统计
 * 支持两种模式：中→英（看中文写英文）和英→中（看英文写中文）
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.Dictation = (function () {
  'use strict';

  var currentUnit = null;
  var mode = 'cn2en'; // 'cn2en' = 中→英, 'en2cn' = 英→中
  var wordOrder = [];
  var currentIndex = 0;
  var correctCount = 0;
  var wrongCount = 0;
  var answered = false;
  var wrongWords = [];
  var PASS_THRESHOLD = 100;
  var containerEl = null;

  /** 中文字符检测（含全角区）：用于 cn2en 模式提示孩子切到英文输入法 */
  var CJK_PATTERN = /[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/;

  /**
   * 渲染默写区域
   */
  function render(unit, container) {
    currentUnit = unit;
    containerEl = container;
    resetState();

    if (!unit || !unit.words || unit.words.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">暂无单词数据</div></div>';
      return;
    }

    showStartScreen();
  }

  function resetState() {
    wordOrder = [];
    currentIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    answered = false;
    wrongWords = [];
  }

  /* ============================================================
     开始页面
     ============================================================ */
  function showStartScreen() {
    var total = currentUnit.words.length;
    var statsHtml = renderStartStats();

    var html = '';
    html += '<div class="dictation-container">';
    html += '  <div class="dictation-start-screen">';
    html += '    <div class="dictation-start-icon">📝</div>';
    html += '    <h3 class="dictation-start-title">单词默写</h3>';
    html += '    <div class="dictation-start-info">';
    html += '      <div class="dictation-info-row"><span class="info-label">本课单词</span><span class="info-value">' + total + ' 个</span></div>';
    html += '      <div class="dictation-info-row"><span class="info-label">过关要求</span><span class="info-value pass-text">全部正确</span></div>';
    html += '      <div class="dictation-info-row"><span class="info-label">当前模式</span><span class="info-value" id="modeDisplay">中→英</span></div>';
    html += '    </div>';
    html += '    <div class="dictation-rules">';
    html += '      <div class="rule-item">⚠️ 每题只能提交<strong>一次</strong>，提交后<strong>不能修改</strong></div>';
    html += '      <div class="rule-item">⚠️ 必须<strong>全部默写完成</strong>才能查看成绩</div>';
    html += '      <div class="rule-item">⚠️ 必须<strong>全部正确</strong>才算过关（错一个就不行）</div>';
    html += '      <div class="rule-item">✅ 空格、标点、全角/半角、单词大小写均不影响判定（如 greet / Greet 都对）；仅<strong>专有名词首字母必须大写</strong>（如 Christmas、T-shirt）</div>';
    html += '      <div class="rule-item">⌨️ 中→英默写请用<strong>英文键盘</strong>；若弹出中文候选，点击输入法上的「中/英」切换</div>';
    html += '      <div class="rule-item">✅ 英→中模式写出<strong>主要释义</strong>即可（如「年级；等级」写「年级」算对）</div>';
    html += '    </div>';
    html += '    <div class="dictation-mode-select">';
    html += '      <button class="mode-btn active" data-mode="cn2en">中→英（看中文写英文）</button>';
    html += '      <button class="mode-btn" data-mode="en2cn">英→中（看英文写中文）</button>';
    html += '    </div>';
    html += statsHtml;
    html += '    <button class="dictation-btn primary dictation-start-btn" id="dictStart">🚀 开始默写</button>';
    html += '  </div>';
    html += '</div>';

    containerEl.innerHTML = html;

    // 模式切换
    var modeBtns = containerEl.querySelectorAll('.mode-btn');
    for (var i = 0; i < modeBtns.length; i++) {
      modeBtns[i].addEventListener('click', function () {
        mode = this.getAttribute('data-mode');
        for (var j = 0; j < modeBtns.length; j++) {
          modeBtns[j].classList.toggle('active', modeBtns[j].getAttribute('data-mode') === mode);
        }
        var modeDisplay = document.getElementById('modeDisplay');
        if (modeDisplay) {
          modeDisplay.textContent = mode === 'cn2en' ? '中→英' : '英→中';
        }
      });
    }

    document.getElementById('dictStart').addEventListener('click', function () {
      startDictation();
    });
  }

  /* ============================================================
     开始页面 - 历史统计摘要
     ============================================================ */
  function renderStartStats() {
    var allScores = VocabApp.Storage.getDictationScores();
    var unitScores = allScores[currentUnit.unitId] || [];

    if (unitScores.length === 0) return '';

    var attempts = unitScores.length;
    var bestScore = 0;
    var passCount = 0;
    for (var i = 0; i < unitScores.length; i++) {
      if (unitScores[i].score > bestScore) bestScore = unitScores[i].score;
      if (unitScores[i].passed) passCount++;
    }

    var html = '';
    html += '<div class="dictation-start-stats">';
    html += '  <div class="start-stats-title">📊 本课默写记录</div>';
    html += '  <div class="start-stats-row">';
    html += '    <span>共默写 <strong>' + attempts + '</strong> 次</span>';
    html += '    <span>最高分 <strong>' + bestScore + '</strong></span>';
    html += '    <span>过关 <strong>' + passCount + '/' + attempts + '</strong></span>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /* ============================================================
     开始默写
     ============================================================ */
  function startDictation() {
    resetState();
    wordOrder = shuffleArray(currentUnit.words.slice());
    showQuestion();
  }

  /* ============================================================
     显示当前题目
     ============================================================ */
  function showQuestion() {
    if (currentIndex >= wordOrder.length) {
      showResult();
      return;
    }

    var word = wordOrder[currentIndex];
    var promptText, labelText, placeholder, inputAttrs;

    if (mode === 'cn2en') {
      labelText = '请根据中文释义拼写英文单词';
      promptText = word.meaning + ' (' + (word.pos || '') + ')';
      placeholder = '输入英文单词...';
      // 网页无法强制切换系统键盘：inputmode 的现行合法值（none/text/decimal/
      // numeric/tel/search/email/url）里没有 latin，写了会回落默认键盘、不起作用。
      // 这里只用 lang="en" 给浏览器一点提示，真正兜底靠下面的中文字符检测提醒。
      inputAttrs = ' lang="en"';
    } else {
      labelText = '请根据英文单词写出中文释义';
      promptText = word.word + '  ' + (word.phonetic || '');
      placeholder = '输入中文释义...';
      // 中文释义必须用中文输入法，保持 inputmode="text"
      inputAttrs = ' inputmode="text" lang="zh-CN"';
    }
    inputAttrs += ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-form-type="other"';

    var progressPercent = Math.round((currentIndex / wordOrder.length) * 100);

    var html = '';
    html += '<div class="dictation-container">';
    html += '  <div class="dictation-quiz-header">';
    html += '    <div class="dictation-progress-bar">';
    html += '      <div class="dictation-progress-fill" style="width:' + progressPercent + '%"></div>';
    html += '    </div>';
    html += '    <div class="dictation-progress-info">';
    html += '      <span>第 <strong>' + (currentIndex + 1) + '</strong> / ' + wordOrder.length + ' 题</span>';
    html += '      <span class="correct-count">✓ ' + correctCount + '</span>';
    html += '      <span class="wrong-count">✗ ' + wrongCount + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="dictation-card">';
    html += '    <div class="dictation-prompt">';
    html += '      <span class="dict-label">' + labelText + '</span>';
    html += '      <span class="dict-prompt-text" id="dictPrompt">' + escapeHtml(promptText) + '</span>';
    html += '    </div>';
    html += '    <input type="text" class="dictation-input" id="dictInput" placeholder="' + placeholder + '"' + inputAttrs + '>';
    html += '    <div class="dictation-feedback" id="dictFeedback"></div>';
    html += '  </div>';
    html += '  <div class="dictation-controls">';
    html += '    <button class="dictation-btn primary" id="dictSubmit">提交答案（仅一次）</button>';
    html += '    <button class="dictation-btn primary" id="dictNext" style="display:none;">下一题 →</button>';
    html += '  </div>';
    html += '  <div class="dictation-warning">⚠️ 提交后不可修改，请确认答案后再提交</div>';
    html += '</div>';

    containerEl.innerHTML = html;
    answered = false;

    var input = document.getElementById('dictInput');
    var submitBtn = document.getElementById('dictSubmit');
    var nextBtn = document.getElementById('dictNext');

    input.focus();

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        if (!answered) {
          checkAnswer();
        } else {
          nextQuestion();
        }
      }
    });

    // cn2en：检测到中文字符时实时提醒切换英文输入法
    // 仅作提示，不阻止输入、不阻止提交、不自动清空用户输入；提交后（answered）不再干预反馈区
    input.addEventListener('input', function () {
      if (mode !== 'cn2en' || answered) return;
      var hasCJK = CJK_PATTERN.test(input.value);
      // 输入框描边提醒：橙色边框，提示当前是中文输入
      if (hasCJK) {
        input.classList.add('ime-warn');
      } else {
        input.classList.remove('ime-warn');
      }
      var feedbackEl = document.getElementById('dictFeedback');
      if (!feedbackEl) return;
      if (hasCJK) {
        feedbackEl.className = 'dictation-feedback warn';
        feedbackEl.innerHTML = '⌨️ 请切换到英文输入法（当前是中文输入）';
      } else {
        feedbackEl.className = 'dictation-feedback';
        feedbackEl.innerHTML = '';
      }
    });

    submitBtn.addEventListener('click', function () {
      if (!answered) {
        checkAnswer();
      }
    });

    nextBtn.addEventListener('click', function () {
      nextQuestion();
    });
  }

  /* ============================================================
     检查答案（只能提交一次）
     ============================================================ */
  function checkAnswer() {
    var word = wordOrder[currentIndex];
    var input = document.getElementById('dictInput');
    var feedback = document.getElementById('dictFeedback');
    var submitBtn = document.getElementById('dictSubmit');
    var nextBtn = document.getElementById('dictNext');

    // 归一化比对：忽略空格/标点/全角差异；首字母大小写按教材数据判定
    var rawInput = input.value;
    var isEmpty = (rawInput.trim() === '');
    var isCorrect = (!isEmpty && isAnswerCorrect(rawInput, mode === 'cn2en' ? word.word : word.meaning, mode));

    answered = true;
    input.disabled = true;
    // 判分后移除输入法提醒描边，避免与 correct/wrong 边框冲突
    input.classList.remove('ime-warn');
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';

    if (isCorrect) {
      correctCount++;
      input.classList.add('correct');
      feedback.className = 'dictation-feedback correct';
      feedback.innerHTML = '✓ 正确！';
    } else {
      wrongCount++;
      wrongWords.push(word);
      // 自动加入生词本，方便重点复习
      if (VocabApp.Storage && VocabApp.Storage.addToWordbook) {
        VocabApp.Storage.addToWordbook(word);
      }
      input.classList.add('wrong');
      feedback.className = 'dictation-feedback wrong';
      if (mode === 'cn2en') {
        feedback.innerHTML = '✗ 错误！正确答案：<strong>' + escapeHtml(word.word) + '</strong>';
      } else {
        feedback.innerHTML = '✗ 错误！正确答案：<strong>' + escapeHtml(word.meaning) + '</strong>';
      }
    }

    var progressFill = document.querySelector('.dictation-progress-fill');
    if (progressFill) {
      var percent = Math.round(((currentIndex + 1) / wordOrder.length) * 100);
      progressFill.style.width = percent + '%';
    }
    var correctEl = document.querySelector('.dictation-progress-info .correct-count');
    var wrongEl = document.querySelector('.dictation-progress-info .wrong-count');
    if (correctEl) correctEl.textContent = '✓ ' + correctCount;
    if (wrongEl) wrongEl.textContent = '✗ ' + wrongCount;

    if (currentIndex === wordOrder.length - 1) {
      nextBtn.textContent = '查看成绩 →';
    }

    nextBtn.focus();
  }

  /* ============================================================
     下一题
     ============================================================ */
  function nextQuestion() {
    currentIndex++;
    showQuestion();
  }

  /* ============================================================
     显示结果（过关/未过关 + 准确率/错误率 + 历史统计）
     ============================================================ */
  function showResult() {
    var total = wordOrder.length;
    var score = Math.round((correctCount / total) * 100);
    var accuracyRate = score;
    var errorRate = Math.round((wrongCount / total) * 100);
    var passed = score >= PASS_THRESHOLD;

    // 闯关：默写满分（100分）即通关本单元，解锁下一单元
    if (passed) {
      var alreadyCompleted = VocabApp.Storage.isUnitCompleted(currentUnit.unitId);
      VocabApp.Storage.markUnitCompleted(currentUnit.unitId);
      if (VocabApp.refreshGating) VocabApp.refreshGating();
      if (!alreadyCompleted && VocabApp.onUnitCompleted) {
        VocabApp.onUnitCompleted(currentUnit.unitId);
      }
    }

    // 保存默写成绩（含准确率和错误率）
    VocabApp.Storage.saveDictationScore(currentUnit.unitId, {
      mode: mode,
      score: score,
      correct: correctCount,
      wrong: wrongCount,
      total: total,
      accuracyRate: accuracyRate,
      errorRate: errorRate,
      passed: passed,
      date: new Date().toISOString()
    });

    var html = '';
    html += '<div class="dictation-container">';
    html += '  <div class="dictation-result ' + (passed ? 'passed' : 'failed') + '">';
    html += '    <div class="dictation-result-icon">' + (passed ? '🎉' : '💪') + '</div>';
    html += '    <div class="dictation-result-score ' + (passed ? 'pass' : 'fail') + '">' + score + '分</div>';
    html += '    <div class="dictation-result-status ' + (passed ? 'pass' : 'fail') + '">';
    html += passed ? '🎉 恭喜过关！全部正确！' : '未过关（必须全部正确）';
    html += '    </div>';

    // 准确率和错误率
    html += '    <div class="dictation-rate-row">';
    html += '      <div class="dictation-rate-item correct-rate">';
    html += '        <span class="rate-label">准确率</span>';
    html += '        <span class="rate-value">' + accuracyRate + '%</span>';
    html += '        <span class="rate-detail">正确 ' + correctCount + ' / ' + total + '</span>';
    html += '      </div>';
    html += '      <div class="dictation-rate-item error-rate">';
    html += '        <span class="rate-label">错误率</span>';
    html += '        <span class="rate-value">' + errorRate + '%</span>';
    html += '        <span class="rate-detail">错误 ' + wrongCount + ' / ' + total + '</span>';
    html += '      </div>';
    html += '    </div>';

    if (passed) {
      html += '    <div class="dictation-result-comment">满分！太厉害了，所有单词全部掌握！</div>';
    } else {
      html += '    <div class="dictation-result-comment">还差一点，再练一次争取全部正确！</div>';
    }

    // 错词回顾
    if (wrongWords.length > 0) {
      html += '    <div class="dictation-wrong-words">';
      html += '      <div class="wrong-words-title">📋 错词回顾（' + wrongWords.length + '个）</div>';
      for (var i = 0; i < wrongWords.length; i++) {
        var w = wrongWords[i];
        html += '      <div class="wrong-word-item">';
        html += '        <span class="wrong-word-en">' + escapeHtml(w.word) + '</span>';
        html += '        <span class="wrong-word-phonetic">' + escapeHtml(w.phonetic || '') + '</span>';
        html += '        <span class="wrong-word-cn">' + escapeHtml(w.meaning) + '</span>';
        html += '        <button class="btn-speak small-speak" data-word="' + escapeHtml(w.word) + '">🔊</button>';
        html += '      </div>';
      }
      html += '    </div>';
    }

    // 默写统计
    html += renderDictationStats();

    html += '    <div class="dictation-controls">';
    if (!passed) {
      html += '      <button class="dictation-btn primary" id="dictAgain">🔄 再来一次</button>';
    } else {
      html += '      <button class="dictation-btn primary" id="dictAgain">📝 再测一次</button>';
    }
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    containerEl.innerHTML = html;

    // 绑定发音按钮
    var speakBtns = containerEl.querySelectorAll('.btn-speak');
    for (var s = 0; s < speakBtns.length; s++) {
      speakBtns[s].addEventListener('click', function () {
        VocabApp.speak(this.getAttribute('data-word'));
      });
    }

    document.getElementById('dictAgain').addEventListener('click', function () {
      showStartScreen();
    });
  }

  /* ============================================================
     默写统计 - 历史记录 + 汇总
     ============================================================ */
  function renderDictationStats() {
    var allScores = VocabApp.Storage.getDictationScores();
    var unitScores = allScores[currentUnit.unitId] || [];

    if (unitScores.length === 0) return '';

    // 汇总统计
    var attempts = unitScores.length;
    var bestScore = 0;
    var totalScore = 0;
    var passCount = 0;
    var totalAccuracy = 0;
    var totalError = 0;

    for (var i = 0; i < unitScores.length; i++) {
      var s = unitScores[i];
      if (s.score > bestScore) bestScore = s.score;
      totalScore += s.score;
      if (s.passed) passCount++;
      totalAccuracy += (s.accuracyRate != null ? s.accuracyRate : s.score);
      totalError += (s.errorRate != null ? s.errorRate : Math.round((s.wrong / s.total) * 100));
    }

    var avgScore = Math.round(totalScore / attempts);
    var avgAccuracy = Math.round(totalAccuracy / attempts);
    var avgError = Math.round(totalError / attempts);
    var passRate = Math.round((passCount / attempts) * 100);

    var html = '';
    html += '<div class="dictation-stats-section">';
    html += '  <div class="stats-section-title">📊 默写统计</div>';

    // 汇总
    html += '  <div class="stats-summary">';
    html += '    <div class="stats-summary-item">';
    html += '      <span class="stats-label">默写次数</span>';
    html += '      <span class="stats-value">' + attempts + ' 次</span>';
    html += '    </div>';
    html += '    <div class="stats-summary-item">';
    html += '      <span class="stats-label">最高分</span>';
    html += '      <span class="stats-value highlight">' + bestScore + ' 分</span>';
    html += '    </div>';
    html += '    <div class="stats-summary-item">';
    html += '      <span class="stats-label">平均分</span>';
    html += '      <span class="stats-value">' + avgScore + ' 分</span>';
    html += '    </div>';
    html += '    <div class="stats-summary-item">';
    html += '      <span class="stats-label">平均准确率</span>';
    html += '      <span class="stats-value pass-color">' + avgAccuracy + '%</span>';
    html += '    </div>';
    html += '    <div class="stats-summary-item">';
    html += '      <span class="stats-label">平均错误率</span>';
    html += '      <span class="stats-value fail-color">' + avgError + '%</span>';
    html += '    </div>';
    html += '    <div class="stats-summary-item">';
    html += '      <span class="stats-label">过关率</span>';
    html += '      <span class="stats-value">' + passCount + '/' + attempts + ' (' + passRate + '%)</span>';
    html += '    </div>';
    html += '  </div>';

    // 历史记录（最近5次）
    var showCount = Math.min(5, unitScores.length);
    html += '  <div class="stats-history-title">最近 ' + showCount + ' 次记录</div>';
    html += '  <div class="stats-history-list">';
    for (var j = unitScores.length - 1; j >= unitScores.length - showCount; j--) {
      var record = unitScores[j];
      var date = new Date(record.date);
      var dateStr = (date.getMonth() + 1) + '/' + date.getDate() + ' ' +
        ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
      var modeStr = record.mode === 'cn2en' ? '中→英' : '英→中';
      var accRate = record.accuracyRate != null ? record.accuracyRate : record.score;
      var errRate = record.errorRate != null ? record.errorRate : Math.round((record.wrong / record.total) * 100);
      html += '    <div class="stats-history-item ' + (record.passed ? 'passed' : 'failed') + '">';
      html += '      <span class="history-date">' + dateStr + '</span>';
      html += '      <span class="history-mode">' + modeStr + '</span>';
      html += '      <span class="history-score">' + record.score + '分</span>';
      html += '      <span class="history-accuracy">准确率' + accRate + '%</span>';
      html += '      <span class="history-error">错误率' + errRate + '%</span>';
      html += '      <span class="history-status">' + (record.passed ? '✓过关' : '✗未过') + '</span>';
      html += '    </div>';
    }
    html += '  </div>';
    html += '</div>';

    return html;
  }

  /* ============================================================
     工具函数
     ============================================================ */

  function shuffleArray(arr) {
    var result = arr.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 全角转半角：中文输入法误开全角时（ｇｒｅｅｔ / ７年级）也应判对。
   */
  function toHalfWidth(str) {
    return String(str)
      .replace(/[\uFF01-\uFF5E]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })
      .replace(/\u3000/g, ' ');
  }

  /**
   * 答案清洗：全角转半角 → 去掉括号及其中内容（补充说明 / 英文对应 / 复数形式）
   * → 去掉所有空格 → 去掉所有非字母、非数字字符（标点等）。
   */
  function cleanAnswer(text) {
    if (text == null) return '';
    return toHalfWidth(text)
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  /**
   * 宽松清洗（仅在严格清洗结果为空时作为兜底使用）：
   * 只去掉括号字符本身、保留括号内文字。
   * 场景：孩子把答案整体括起来写，如「（年级）」——括号只是标点，
   * 内容才是答案，不应因为整条被清空而误判为错。
   */
  function cleanAnswerLoose(text) {
    if (text == null) return '';
    return toHalfWidth(text)
      .replace(/[（(）)]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  /**
   * 判断用户输入是否正确。
   * 规则：
   * - 任一边清洗后为空（空输入 / 纯空格 / 纯标点 / 纯符号）→ 一律判错，
   *   防止"两边都清洗为空"被误判成正确。
   * - 英→中（en2cn，写中文释义）：
   *   1) 先与整条释义比对——孩子照抄「年级；等级」这类完整释义时必须判对；
   *   2) 再按多义项分隔符（；;，,、）切分为多个候选，命中任一候选即算对；
   *   3) 孩子答案是整条释义/某一候选的【前缀】（≥2字）或其【子串】（≥3字）也算对
   *      （写了主要部分即可，不要求复现整条释义）。
   *   子串要求≥3字：既保留「和（某人）打招呼」写「打招呼」这类合理简写，
   *   又挡住「聪明的」被「明的」命中这类跨词误判。
   * - 中→英（cn2en，写英文单词）：教材数据首字母是**大写**的词（如 Christmas / T-shirt / BBQ）
   *   必须首字母大写；数据首字母是**小写**的词（如 greet）忽略首字母大小写，
   *   因为手机/平板输入法常自动首字母大写，不能因此判错。其余字母一律忽略大小写。
   */
  function isAnswerCorrect(userRaw, correctRaw, currentMode) {
    var u = cleanAnswer(userRaw);
    var c = cleanAnswer(correctRaw);

    // 兜底：整条被括号吞掉（如孩子写「（年级）」）时，退化为只去括号字符
    if (u.length === 0) u = cleanAnswerLoose(userRaw);
    if (c.length === 0) c = cleanAnswerLoose(correctRaw);

    // 任一边为空（空输入 / 纯空格 / 纯标点 / 纯符号）→ 一律判错
    if (u.length === 0 || c.length === 0) return false;

    if (currentMode === 'en2cn') {
      // 1) 整条比对：孩子照抄完整释义（如「年级；等级」）时必须判对
      //    c 已是整条标准答案的清洗结果（必要时已走宽松兜底）
      if (u === c) return true;
      if (u.length >= 2 && c.indexOf(u) === 0) return true;
      if (u.length >= 3 && c.indexOf(u) >= 0) return true;

      // 2) 按多义项分隔符切分为候选：命中任一候选即算对；
      //    或是其【前缀】（≥2字）、或是其子串（≥3字）也算对。
      var parts = String(correctRaw).split(/[；;，,、]/);
      for (var i = 0; i < parts.length; i++) {
        var cand = cleanAnswer(parts[i]);
        if (cand.length === 0) continue;
        if (u === cand) return true;
        if (u.length >= 2 && cand.indexOf(u) === 0) return true;
        if (u.length >= 3 && cand.indexOf(u) >= 0) return true;
      }
      return false;
    }

    // cn2en
    var cFirst = c.charAt(0);
    if (/^[A-Z]/.test(cFirst)) {
      // 数据首字母大写：首字母必须大写，其余忽略大小写
      return u.charAt(0) === cFirst && u.slice(1).toLowerCase() === c.slice(1).toLowerCase();
    }
    // 数据首字母小写：忽略首字母大小写（输入法自动大写不判错）
    return u.toLowerCase() === c.toLowerCase();
  }

  return {
    render: render
  };
})();

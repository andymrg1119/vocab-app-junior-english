/**
 * dictation.js
 * 默写功能（重构版）
 * 规则：每题只能提交一次，提交后不可修改，必须全部默写完成，
 * 达到80分才算过关。
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
  var PASS_THRESHOLD = 80;
  var containerEl = null;

  /**
   * 渲染默写区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
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

    var html = '';
    html += '<div class="dictation-container">';
    html += '  <div class="dictation-start-screen">';
    html += '    <div class="dictation-start-icon">📝</div>';
    html += '    <h3 class="dictation-start-title">单词默写</h3>';
    html += '    <div class="dictation-start-info">';
    html += '      <div class="dictation-info-row"><span class="info-label">本课单词</span><span class="info-value">' + total + ' 个</span></div>';
    html += '      <div class="dictation-info-row"><span class="info-label">过关分数</span><span class="info-value pass-text">' + PASS_THRESHOLD + ' 分</span></div>';
    html += '      <div class="dictation-info-row"><span class="info-label">当前模式</span><span class="info-value" id="modeDisplay">中→英</span></div>';
    html += '    </div>';
    html += '    <div class="dictation-rules">';
    html += '      <div class="rule-item">⚠️ 每题只能提交<strong>一次</strong>，提交后<strong>不能修改</strong></div>';
    html += '      <div class="rule-item">⚠️ 必须<strong>全部默写完成</strong>才能查看成绩</div>';
    html += '      <div class="rule-item">⚠️ 达到 <strong>' + PASS_THRESHOLD + ' 分</strong>才算过关</div>';
    html += '    </div>';
    html += '    <div class="dictation-mode-select">';
    html += '      <button class="mode-btn active" data-mode="cn2en">中→英（看中文写英文）</button>';
    html += '      <button class="mode-btn" data-mode="en2cn">英→中（看英文写中文）</button>';
    html += '    </div>';
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
    var promptText, labelText, placeholder;

    if (mode === 'cn2en') {
      labelText = '请根据中文释义拼写英文单词';
      promptText = word.meaning + ' (' + (word.pos || '') + ')';
      placeholder = '输入英文单词...';
    } else {
      labelText = '请根据英文单词写出中文释义';
      promptText = word.word + '  ' + (word.phonetic || '');
      placeholder = '输入中文释义...';
    }

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
    html += '    <input type="text" class="dictation-input" id="dictInput" placeholder="' + placeholder + '" autocomplete="off" autocapitalize="off" spellcheck="false">';
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

    var userInput = input.value.trim().toLowerCase();
    var correctAnswer;

    if (mode === 'cn2en') {
      correctAnswer = word.word.toLowerCase();
    } else {
      correctAnswer = word.meaning.trim().toLowerCase();
    }

    // 空答案算错
    if (userInput === '') {
      userInput = '（未作答）';
    }

    var isCorrect = (userInput === correctAnswer);

    // 锁定：只能提交一次，不可修改
    answered = true;
    input.disabled = true;
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
      input.classList.add('wrong');
      feedback.className = 'dictation-feedback wrong';
      if (mode === 'cn2en') {
        feedback.innerHTML = '✗ 错误！正确答案：<strong>' + escapeHtml(word.word) + '</strong>';
      } else {
        feedback.innerHTML = '✗ 错误！正确答案：<strong>' + escapeHtml(word.meaning) + '</strong>';
      }
    }

    // 更新进度条
    var progressFill = document.querySelector('.dictation-progress-fill');
    if (progressFill) {
      var percent = Math.round(((currentIndex + 1) / wordOrder.length) * 100);
      progressFill.style.width = percent + '%';
    }
    var correctEl = document.querySelector('.dictation-progress-info .correct-count');
    var wrongEl = document.querySelector('.dictation-progress-info .wrong-count');
    if (correctEl) correctEl.textContent = '✓ ' + correctCount;
    if (wrongEl) wrongEl.textContent = '✗ ' + wrongCount;

    // 如果是最后一题，改变按钮文字
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
     显示结果（过关/未过关）
     ============================================================ */
  function showResult() {
    var total = wordOrder.length;
    var score = Math.round((correctCount / total) * 100);
    var passed = score >= PASS_THRESHOLD;

    // 保存默写成绩
    VocabApp.Storage.saveDictationScore(currentUnit.unitId, {
      mode: mode,
      score: score,
      correct: correctCount,
      wrong: wrongCount,
      total: total,
      passed: passed,
      date: new Date().toISOString()
    });

    var html = '';
    html += '<div class="dictation-container">';
    html += '  <div class="dictation-result ' + (passed ? 'passed' : 'failed') + '">';
    html += '    <div class="dictation-result-icon">' + (passed ? '🎉' : '💪') + '</div>';
    html += '    <div class="dictation-result-score ' + (passed ? 'pass' : 'fail') + '">' + score + '分</div>';
    html += '    <div class="dictation-result-status ' + (passed ? 'pass' : 'fail') + '">';
    html += passed ? '恭喜过关！' : '未过关（需要' + PASS_THRESHOLD + '分）';
    html += '    </div>';
    html += '    <div class="dictation-result-text">';
    html += '      正确 ' + correctCount + ' 题 ｜ 错误 ' + wrongCount + ' 题 ｜ 共 ' + total + ' 题';
    html += '    </div>';

    if (passed) {
      if (score === 100) {
        html += '    <div class="dictation-result-comment">满分！太厉害了，所有单词全部掌握！</div>';
      } else {
        html += '    <div class="dictation-result-comment">太棒了，你已过关！继续保持！</div>';
      }
    } else {
      html += '    <div class="dictation-result-comment">差一点点就过关了，再练一次一定可以！</div>';
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

  return {
    render: render
  };
})();

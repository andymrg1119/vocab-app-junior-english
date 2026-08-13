/**
 * dictation.js
 * 默写功能
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

  /**
   * 渲染默写区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
   */
  function render(unit, container) {
    currentUnit = unit;

    if (!unit || !unit.words || unit.words.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">暂无单词数据</div></div>';
      return;
    }

    // 初始化词序（打乱）
    wordOrder = shuffleArray(unit.words.slice());
    currentIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    answered = false;

    container.innerHTML = buildHTML();
    bindEvents();
    showQuestion();
  }

  /**
   * 构建HTML结构
   */
  function buildHTML() {
    var html = '';
    html += '<div class="dictation-container">';
    html += '  <div class="dictation-header">';
    html += '    <div class="dictation-mode">';
    html += '      <button class="mode-btn active" data-mode="cn2en">中→英</button>';
    html += '      <button class="mode-btn" data-mode="en2cn">英→中</button>';
    html += '    </div>';
    html += '    <div class="dictation-progress">';
    html += '      进度：<span id="dictProgress">1/' + wordOrder.length + '</span>';
    html += '      ｜ <span class="correct-count" id="dictCorrect">✓0</span>';
    html += '      <span class="wrong-count" id="dictWrong">✗0</span>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div id="dictContent"></div>';
    html += '</div>';
    return html;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    var modeBtns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < modeBtns.length; i++) {
      modeBtns[i].addEventListener('click', function () {
        var newMode = this.getAttribute('data-mode');
        if (newMode !== mode) {
          switchMode(newMode);
        }
      });
    }
  }

  /**
   * 切换模式
   */
  function switchMode(newMode) {
    mode = newMode;
    var modeBtns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < modeBtns.length; i++) {
      var btn = modeBtns[i];
      btn.classList.toggle('active', btn.getAttribute('data-mode') === newMode);
    }
    // 重新开始
    wordOrder = shuffleArray(currentUnit.words.slice());
    currentIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    answered = false;
    showQuestion();
  }

  /**
   * 显示当前题目
   */
  function showQuestion() {
    var content = document.getElementById('dictContent');
    if (currentIndex >= wordOrder.length) {
      showResult();
      return;
    }

    var word = wordOrder[currentIndex];
    var promptText, labelText, placeholder;

    if (mode === 'cn2en') {
      labelText = '请根据中文释义拼写英文单词';
      promptText = word.meaning + ' (' + (word.pos || '') + ')';
      placeholder = '在此输入英文单词...';
    } else {
      labelText = '请根据英文单词写出中文释义';
      promptText = word.word + ' ' + (word.phonetic || '');
      placeholder = '在此输入中文释义...';
    }

    var html = '';
    html += '<div class="dictation-card">';
    html += '  <div class="dictation-prompt">';
    html += '    <span class="dict-label">' + labelText + '</span>';
    html += '    <span id="dictPrompt">' + escapeHtml(promptText) + '</span>';
    html += '  </div>';
    html += '  <input type="text" class="dictation-input" id="dictInput" placeholder="' + placeholder + '" autocomplete="off" autocapitalize="off" spellcheck="false">';
    html += '  <div class="dictation-feedback" id="dictFeedback"></div>';
    html += '</div>';
    html += '<div class="dictation-controls">';
    html += '  <button class="dictation-btn primary" id="dictSubmit">提交答案</button>';
    html += '  <button class="dictation-btn secondary" id="dictNext" style="display:none;">下一题</button>';
    html += '  <button class="dictation-btn secondary" id="dictRestart">重新开始</button>';
    html += '</div>';

    content.innerHTML = html;
    answered = false;

    // 绑定事件
    var input = document.getElementById('dictInput');
    var submitBtn = document.getElementById('dictSubmit');
    var nextBtn = document.getElementById('dictNext');
    var restartBtn = document.getElementById('dictRestart');

    input.focus();

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
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

    restartBtn.addEventListener('click', function () {
      wordOrder = shuffleArray(currentUnit.words.slice());
      currentIndex = 0;
      correctCount = 0;
      wrongCount = 0;
      answered = false;
      updateProgress();
      showQuestion();
    });

    updateProgress();
  }

  /**
   * 检查答案
   */
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
      correctAnswer = word.meaning.trim();
    }

    var isCorrect = (mode === 'cn2en')
      ? (userInput === correctAnswer)
      : (userInput === correctAnswer.toLowerCase());

    answered = true;
    input.disabled = true;
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';

    if (isCorrect) {
      correctCount++;
      input.classList.add('correct');
      feedback.className = 'dictation-feedback correct';
      feedback.textContent = '✓ 正确！';
    } else {
      wrongCount++;
      input.classList.add('wrong');
      feedback.className = 'dictation-feedback wrong';
      if (mode === 'cn2en') {
        feedback.textContent = '✗ 错误！正确答案：' + word.word;
      } else {
        feedback.textContent = '✗ 错误！正确答案：' + word.meaning;
      }
    }

    updateProgress();
    nextBtn.focus();
  }

  /**
   * 下一题
   */
  function nextQuestion() {
    currentIndex++;
    showQuestion();
  }

  /**
   * 更新进度显示
   */
  function updateProgress() {
    var progress = document.getElementById('dictProgress');
    var correctEl = document.getElementById('dictCorrect');
    var wrongEl = document.getElementById('dictWrong');
    if (progress) {
      progress.textContent = (currentIndex + 1) + '/' + wordOrder.length;
    }
    if (correctEl) {
      correctEl.textContent = '✓' + correctCount;
    }
    if (wrongEl) {
      wrongEl.textContent = '✗' + wrongCount;
    }
  }

  /**
   * 显示结果
   */
  function showResult() {
    var content = document.getElementById('dictContent');
    var total = wordOrder.length;
    var score = Math.round((correctCount / total) * 100);
    var rate = Math.round((correctCount / total) * 100);

    // 保存默写成绩
    VocabApp.Storage.saveDictationScore(currentUnit.unitId, {
      mode: mode,
      score: score,
      correct: correctCount,
      wrong: wrongCount,
      total: total,
      date: new Date().toISOString()
    });

    var comment = '';
    if (rate >= 90) {
      comment = '太棒了！你已经完全掌握了这些单词！';
    } else if (rate >= 70) {
      comment = '不错！继续努力，你会更好！';
    } else if (rate >= 50) {
      comment = '还需要多加练习，加油！';
    } else {
      comment = '别灰心，多复习几遍一定可以！';
    }

    var html = '';
    html += '<div class="dictation-result">';
    html += '  <div class="dictation-result-score">' + score + '分</div>';
    html += '  <div class="dictation-result-text">';
    html += '    正确 ' + correctCount + ' 题，错误 ' + wrongCount + ' 题，共 ' + total + ' 题';
    html += '  </div>';
    html += '  <div class="dictation-result-text">' + comment + '</div>';
    html += '  <div class="dictation-controls">';
    html += '    <button class="dictation-btn primary" id="dictAgain">再来一次</button>';
    html += '  </div>';
    html += '</div>';

    content.innerHTML = html;

    var againBtn = document.getElementById('dictAgain');
    againBtn.addEventListener('click', function () {
      wordOrder = shuffleArray(currentUnit.words.slice());
      currentIndex = 0;
      correctCount = 0;
      wrongCount = 0;
      answered = false;
      showQuestion();
    });
  }

  /**
   * 打乱数组
   */
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

  /**
   * HTML转义
   */
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

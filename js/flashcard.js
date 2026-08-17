/**
 * flashcard.js
 * 翻面单词卡组件
 * 功能：卡片翻转、发音、上下张切换、已掌握/未掌握标记、跟读评分
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.Flashcard = (function () {
  'use strict';

  var currentIndex = 0;
  var currentUnit = null;
  var isFlipped = false;

  /**
   * 渲染单词卡区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
   */
  function render(unit, container) {
    currentUnit = unit;
    currentIndex = 0;
    isFlipped = false;

    if (!unit || !unit.words || unit.words.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无单词数据</div></div>';
      return;
    }

    container.innerHTML = buildHTML();
    bindEvents();
    updateCard();
  }

  /**
   * 构建HTML结构
   */
  function buildHTML() {
    var html = '';
    html += '<div class="flashcard-container">';
    html += '  <div class="flashcard-wrapper" id="flashcardWrapper">';
    html += '    <div class="flashcard" id="flashcard">';
    html += '      <div class="flashcard-face flashcard-front" id="cardFront">';
    html += '        <span class="card-label" id="cardLabel"></span>';
    html += '        <div class="card-word" id="cardWord"></div>';
    html += '        <div class="card-pos" id="cardPos"></div>';
    html += '        <div class="card-hint">点击卡片查看释义</div>';
    html += '      </div>';
    html += '      <div class="flashcard-face flashcard-back" id="cardBack">';
    html += '        <div class="card-phonetic" id="cardPhonetic"></div>';
    html += '        <div class="card-meaning" id="cardMeaning"></div>';
    html += '        <div class="card-example" id="cardExample"></div>';
    html += '        <div class="card-example-cn" id="cardExampleCn"></div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="flashcard-controls">';
    html += '    <button class="card-nav-btn" id="prevCard" title="上一张">‹</button>';
    html += '    <span class="card-counter" id="cardCounter"></span>';
    html += '    <button class="card-nav-btn" id="nextCard" title="下一张">›</button>';
    html += '  </div>';
    html += '  <div class="flashcard-action-btns">';
    html += '    <button class="speak-btn" id="cardSpeak">🔊 朗读</button>';
    html += '    <button class="readalong-btn" id="cardReadAlong">🎤 跟读</button>';
    html += '  </div>';
    html += '  <div class="readalong-result-container" id="readalongResult"></div>';
    html += '  <div class="mastery-btns">';
    html += '    <button class="mastery-btn mastered" id="markMastered">✓ 已掌握</button>';
    html += '    <button class="mastery-btn unmastered" id="markUnmastered">✗ 未掌握</button>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    var card = document.getElementById('flashcard');
    var prevBtn = document.getElementById('prevCard');
    var nextBtn = document.getElementById('nextCard');
    var speakBtn = document.getElementById('cardSpeak');
    var readAlongBtn = document.getElementById('cardReadAlong');
    var masteredBtn = document.getElementById('markMastered');
    var unmasteredBtn = document.getElementById('markUnmastered');

    if (card) {
      card.addEventListener('click', function () {
        toggleFlip();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        goToPrev();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        goToNext();
      });
    }
    if (speakBtn) {
      speakBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        speakCurrent();
      });
    }
    if (readAlongBtn) {
      readAlongBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        startReadAlong();
      });
    }
    if (masteredBtn) {
      masteredBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        markMastery(true);
      });
    }
    if (unmasteredBtn) {
      unmasteredBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        markMastery(false);
      });
    }
  }

  /**
   * 翻转卡片
   */
  function toggleFlip() {
    isFlipped = !isFlipped;
    var card = document.getElementById('flashcard');
    if (card) {
      if (isFlipped) {
        card.classList.add('flipped');
      } else {
        card.classList.remove('flipped');
      }
    }
  }

  /**
   * 更新卡片显示内容
   */
  function updateCard() {
    if (!currentUnit || !currentUnit.words) return;
    var word = currentUnit.words[currentIndex];
    if (!word) return;

    // 翻回正面
    isFlipped = false;
    var card = document.getElementById('flashcard');
    if (card) {
      card.classList.remove('flipped');
    }

    // 正面
    document.getElementById('cardLabel').textContent =
      '第 ' + (currentIndex + 1) + ' / ' + currentUnit.words.length + ' 个单词';
    document.getElementById('cardWord').textContent = word.word;
    document.getElementById('cardPos').textContent = word.pos || '';

    // 背面
    document.getElementById('cardPhonetic').textContent = word.phonetic || '';
    document.getElementById('cardMeaning').textContent = word.meaning || '';
    document.getElementById('cardExample').textContent = word.example || '';
    document.getElementById('cardExampleCn').textContent = word.exampleCn || '';

    // 计数器
    document.getElementById('cardCounter').textContent =
      (currentIndex + 1) + ' / ' + currentUnit.words.length;

    // 导航按钮状态
    document.getElementById('prevCard').disabled = (currentIndex === 0);
    document.getElementById('nextCard').disabled =
      (currentIndex === currentUnit.words.length - 1);

    // 清空跟读结果
    var readalongResult = document.getElementById('readalongResult');
    if (readalongResult) {
      readalongResult.innerHTML = '';
    }

    // 更新掌握状态
    updateMasteryButtons(word.word);
  }

  /**
   * 更新掌握按钮的选中状态
   */
  function updateMasteryButtons(word) {
    var mastered = VocabApp.Storage.isMastered(word);
    var masteredBtn = document.getElementById('markMastered');
    var unmasteredBtn = document.getElementById('markUnmastered');
    if (masteredBtn) {
      masteredBtn.classList.toggle('active', mastered === true);
    }
    if (unmasteredBtn) {
      unmasteredBtn.classList.toggle('active', mastered === false);
    }
  }

  /**
   * 上一张
   */
  function goToPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCard();
    }
  }

  /**
   * 下一张
   */
  function goToNext() {
    if (currentUnit && currentIndex < currentUnit.words.length - 1) {
      currentIndex++;
      updateCard();
    }
  }

  /**
   * 朗读当前单词
   */
  function speakCurrent() {
    if (!currentUnit || !currentUnit.words) return;
    var word = currentUnit.words[currentIndex];
    if (word && VocabApp.speak) {
      VocabApp.speak(word.word);
    }
  }

  /**
   * 跟读：先播放发音，然后录音识别打分
   */
  function startReadAlong() {
    if (!currentUnit || !currentUnit.words) return;
    var word = currentUnit.words[currentIndex];
    if (!word) return;

    var resultContainer = document.getElementById('readalongResult');
    if (!resultContainer) return;

    if (VocabApp.ReadAlong && VocabApp.ReadAlong.start) {
      VocabApp.ReadAlong.start(word.word, resultContainer);
    }
  }

  /**
   * 标记掌握状态
   */
  function markMastery(mastered) {
    if (!currentUnit || !currentUnit.words) return;
    var word = currentUnit.words[currentIndex];
    if (!word) return;
    VocabApp.Storage.setMastered(word.word, mastered);
    updateMasteryButtons(word.word);

    // 更新学习进度
    VocabApp.Storage.updateProgress(currentUnit.unitId, currentIndex);
  }

  return {
    render: render
  };
})();

/**
 * text-reader.js
 * 课文精读（Reading 重点讲解）
 * 功能：课文导读、逐句展示、中英对照、关键词高亮、点击朗读、关键词解释、
 *       阅读理解题（点开答案）、背诵模式（遮中文/遮英文/填空）
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.TextReader = (function () {
  'use strict';

  var currentUnit = null;
  var currentMode = 'normal'; // normal | hide-cn | hide-en | blank

  /**
   * 渲染课文讲解区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
   */
  function render(unit, container) {
    currentUnit = unit;
    currentMode = 'normal';

    if (!unit || !unit.text) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📖</div><div class="empty-text">暂无课文数据</div></div>';
      return;
    }

    container.innerHTML = buildHTML(unit.text);
    bindEvents();
  }

  /**
   * 构建HTML结构
   */
  function buildHTML(text) {
    var html = '';
    html += '<div class="text-reader-container">';
    html += '  <h3 class="text-title">' + escapeHtml(text.title) + '</h3>';

    // 背诵模式工具栏
    html += '  <div class="text-mode-bar">';
    html += '    <button class="mode-btn active" data-mode="normal">📖 对照</button>';
    html += '    <button class="mode-btn" data-mode="hide-cn">🙈 遮中文</button>';
    html += '    <button class="mode-btn" data-mode="hide-en">🙈 遮英文</button>';
    html += '    <button class="mode-btn" data-mode="blank">✏️ 填空</button>';
    html += '  </div>';

    // 课文导读
    if (text.intro) {
      html += '  <div class="text-intro">📌 ' + escapeHtml(text.intro) + '</div>';
    }

    // 段落
    if (text.paragraphs && text.paragraphs.length > 0) {
      for (var i = 0; i < text.paragraphs.length; i++) {
        var para = text.paragraphs[i];
        html += '<div class="text-paragraph">';
        if (para.sentences && para.sentences.length > 0) {
          for (var j = 0; j < para.sentences.length; j++) {
            html += buildSentenceHTML(para.sentences[j], i, j);
          }
        }
        html += '</div>';
      }
    }

    // 阅读理解题
    if (text.questions && text.questions.length > 0) {
      html += '<div class="text-questions">';
      html += '  <h4 class="text-questions-title">📝 阅读理解</h4>';
      for (var q = 0; q < text.questions.length; q++) {
        html += buildQuestionHTML(text.questions[q], q);
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * 构建单句HTML
   */
  function buildSentenceHTML(sentence, paraIdx, sentIdx) {
    var sentenceId = 'sent_' + paraIdx + '_' + sentIdx;
    var html = '';
    html += '<div class="text-sentence" id="' + sentenceId + '" data-para="' + paraIdx + '" data-sent="' + sentIdx + '">';
    html += '  <div class="text-sentence-en">' + renderEnglishHTML(sentence) + '</div>';
    html += '  <div class="text-sentence-cn">' + escapeHtml(sentence.cn || '') + '</div>';
    html += '  <div class="text-sentence-actions">';
    html += '    <button class="speak-btn" data-sentence="' + sentenceId + '">🔊 朗读</button>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /**
   * 构建阅读理解题HTML
   */
  function buildQuestionHTML(q, idx) {
    var qid = 'question_' + idx;
    var html = '';
    html += '<div class="text-question" id="' + qid + '">';
    html += '  <div class="text-question-q"><span class="q-num">' + (idx + 1) + '</span> ' + escapeHtml(q.q) + '</div>';
    html += '  <div class="text-question-answer">💡 ' + escapeHtml(q.a) + '</div>';
    html += '  <button class="answer-toggle-btn" data-question="' + qid + '">显示答案</button>';
    html += '</div>';
    return html;
  }

  /**
   * 根据当前模式渲染英文部分
   */
  function renderEnglishHTML(sentence) {
    var en = sentence.en || '';
    var keywords = sentence.keywords || [];
    if (currentMode === 'blank') {
      return renderBlankHTML(en, keywords);
    }
    return highlightKeywordsHTML(en, keywords);
  }

  /**
   * 高亮关键词（正常模式）
   * 使用单个正则一次性匹配所有关键词，避免多次replace破坏已生成的span标签
   */
  function highlightKeywordsHTML(en, keywords) {
    var unique = dedupeSorted(keywords);
    if (unique.length === 0) return escapeHtml(en);

    var pattern = unique.map(escapeRegExp).join('|');
    var regex = new RegExp('(' + pattern + ')', 'gi');

    var html = escapeHtml(en);
    return html.replace(regex, function (match) {
      var safe = escapeHtml(match);
      return '<span class="keyword" data-keyword="' + safe + '" title="点击查看解释">' + safe + '</span>';
    });
  }

  /**
   * 填空模式：把关键词挖空
   */
  function renderBlankHTML(en, keywords) {
    var unique = dedupeSorted(keywords);
    if (unique.length === 0) return escapeHtml(en);

    var pattern = unique.map(escapeRegExp).join('|');
    var regex = new RegExp('(' + pattern + ')', 'gi');

    var html = escapeHtml(en);
    return html.replace(regex, function (match) {
      return '<span class="blank" data-word="' + escapeHtml(match) + '" title="点击显示单词">____</span>';
    });
  }

  /**
   * 去重 + 按长度降序（避免短词先匹配影响长词）
   */
  function dedupeSorted(keywords) {
    var unique = [];
    for (var i = 0; i < keywords.length; i++) {
      if (unique.indexOf(keywords[i]) === -1) unique.push(keywords[i]);
    }
    unique.sort(function (a, b) {
      return b.length - a.length;
    });
    return unique;
  }

  /**
   * 切换背诵模式
   */
  function setMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    var container = document.querySelector('.text-reader-container');
    if (!container) return;

    // 遮中文 / 遮英文 通过 class 控制
    container.classList.toggle('mode-hide-cn', mode === 'hide-cn');
    container.classList.toggle('mode-hide-en', mode === 'hide-en');

    // 更新按钮高亮
    var btns = container.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-mode') === mode);
    }

    // 对照 / 填空需要重渲染英文部分
    if (mode === 'normal' || mode === 'blank') {
      var sentenceEls = container.querySelectorAll('.text-sentence');
      for (var j = 0; j < sentenceEls.length; j++) {
        var el = sentenceEls[j];
        var sentence = getSourceSentence(el);
        if (!sentence) continue;
        var enEl = el.querySelector('.text-sentence-en');
        if (enEl) {
          enEl.innerHTML = renderEnglishHTML(sentence);
        }
      }
      bindKeywordEvents();
    }
  }

  /**
   * 从 DOM 元素反查源句子数据
   */
  function getSourceSentence(el) {
    if (!currentUnit || !currentUnit.text) return null;
    var paraIdx = parseInt(el.getAttribute('data-para'), 10);
    var sentIdx = parseInt(el.getAttribute('data-sent'), 10);
    if (isNaN(paraIdx) || isNaN(sentIdx)) return null;
    if (!currentUnit.text.paragraphs[paraIdx]) return null;
    return currentUnit.text.paragraphs[paraIdx].sentences[sentIdx] || null;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 背诵模式切换按钮
    var modeBtns = document.querySelectorAll('.text-reader-container .mode-btn');
    for (var m = 0; m < modeBtns.length; m++) {
      modeBtns[m].addEventListener('click', function () {
        setMode(this.getAttribute('data-mode'));
      });
    }

    // 朗读按钮
    var speakBtns = document.querySelectorAll('.text-sentence-actions .speak-btn');
    for (var i = 0; i < speakBtns.length; i++) {
      speakBtns[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var sentenceId = this.getAttribute('data-sentence');
        speakSentence(sentenceId);
      });
    }

    // 遮中文 / 遮英文：点击句子临时显示隐藏内容
    var sentenceCards = document.querySelectorAll('.text-sentence');
    for (var s = 0; s < sentenceCards.length; s++) {
      sentenceCards[s].addEventListener('click', function () {
        if (currentMode === 'hide-cn' || currentMode === 'hide-en') {
          this.classList.toggle('reveal');
        }
      });
    }

    // 阅读理解题：点开答案
    var answerBtns = document.querySelectorAll('.answer-toggle-btn');
    for (var a = 0; a < answerBtns.length; a++) {
      answerBtns[a].addEventListener('click', function () {
        var qid = this.getAttribute('data-question');
        var qEl = document.getElementById(qid);
        if (!qEl) return;
        var ansEl = qEl.querySelector('.text-question-answer');
        var isShown = ansEl.classList.contains('show');
        if (isShown) {
          ansEl.classList.remove('show');
          this.textContent = '显示答案';
        } else {
          ansEl.classList.add('show');
          this.textContent = '隐藏答案';
        }
      });
    }

    bindKeywordEvents();
  }

  /**
   * 绑定关键词 / 填空点击事件（渲染后或切换模式后调用）
   */
  function bindKeywordEvents() {
    // 关键词点击查看解释（正常模式）
    var keywords = document.querySelectorAll('.text-sentence-en .keyword');
    for (var j = 0; j < keywords.length; j++) {
      keywords[j].addEventListener('click', function (e) {
        e.stopPropagation();
        var keyword = this.getAttribute('data-keyword');
        showKeywordExplanation(keyword);
      });
    }

    // 填空点击显示单词
    var blanks = document.querySelectorAll('.text-sentence-en .blank');
    for (var k = 0; k < blanks.length; k++) {
      blanks[k].addEventListener('click', function (e) {
        e.stopPropagation();
        if (this.classList.contains('revealed')) {
          this.classList.remove('revealed');
          this.textContent = '____';
        } else {
          this.classList.add('revealed');
          this.textContent = this.getAttribute('data-word');
        }
      });
    }
  }

  /**
   * 朗读句子
   */
  function speakSentence(sentenceId) {
    var sentenceEl = document.getElementById(sentenceId);
    if (!sentenceEl) return;

    // 从源数据取纯英文文本（避免填空模式下朗读到空）
    var text = '';
    var source = getSourceSentence(sentenceEl);
    if (source) {
      text = source.en || '';
    }
    if (!text) {
      var enEl = sentenceEl.querySelector('.text-sentence-en');
      if (enEl) text = enEl.textContent || enEl.innerText;
    }

    if (VocabApp.speak) {
      VocabApp.speak(text);
    }

    // 闯关：标记该句已朗读，刷新进度条（每句都朗读过即过关）
    if (currentUnit && VocabApp.Storage && VocabApp.Storage.markItemRead) {
      VocabApp.Storage.markItemRead(currentUnit.unitId, 'textreader', text);
      sentenceEl.classList.add('read');
      if (VocabApp.updateTabProgress) {
        VocabApp.updateTabProgress(currentUnit, 'textreader');
      }
    }
  }

  /**
   * 显示关键词解释
   */
  function showKeywordExplanation(keyword) {
    if (!currentUnit || !currentUnit.words) return;

    // 在本单元单词中查找匹配的单词
    var matchedWord = null;
    var lowerKeyword = keyword.toLowerCase();

    for (var i = 0; i < currentUnit.words.length; i++) {
      var w = currentUnit.words[i];
      if (w.word.toLowerCase() === lowerKeyword) {
        matchedWord = w;
        break;
      }
    }

    // 如果没找到精确匹配，尝试部分匹配
    if (!matchedWord) {
      for (var j = 0; j < currentUnit.words.length; j++) {
        var wj = currentUnit.words[j];
        if (wj.word.toLowerCase().indexOf(lowerKeyword) >= 0 ||
            lowerKeyword.indexOf(wj.word.toLowerCase()) >= 0) {
          matchedWord = wj;
          break;
        }
      }
    }

    // 查找短语
    var matchedPhrase = null;
    if (!matchedWord && currentUnit.phrases) {
      for (var k = 0; k < currentUnit.phrases.length; k++) {
        var p = currentUnit.phrases[k];
        if (p.phrase.toLowerCase() === lowerKeyword ||
            p.phrase.toLowerCase().indexOf(lowerKeyword) >= 0) {
          matchedPhrase = p;
          break;
        }
      }
    }

    var title = document.getElementById('keywordTitle');
    var body = document.getElementById('keywordBody');
    var modal = document.getElementById('keywordModal');

    title.textContent = keyword;

    var html = '';
    if (matchedWord) {
      html += '<div class="kw-word">' + escapeHtml(matchedWord.word) + '</div>';
      html += '<div class="kw-cn">';
      html += escapeHtml(matchedWord.phonetic || '') + ' ';
      html += escapeHtml(matchedWord.pos || '') + ' ';
      html += escapeHtml(matchedWord.meaning || '');
      html += '</div>';
      html += '<div class="kw-note">例句：' + escapeHtml(matchedWord.example || '') + '</div>';
      html += '<div style="margin-top:8px;font-size:14px;color:#666;">' + escapeHtml(matchedWord.exampleCn || '') + '</div>';
    } else if (matchedPhrase) {
      html += '<div class="kw-word">' + escapeHtml(matchedPhrase.phrase) + '</div>';
      html += '<div class="kw-cn">' + escapeHtml(matchedPhrase.meaning) + '</div>';
      html += '<div class="kw-note">例句：' + escapeHtml(matchedPhrase.example || '') + '</div>';
    } else {
      html += '<div class="kw-word">' + escapeHtml(keyword) + '</div>';
      html += '<div class="kw-note">该关键词暂无详细解释，请查阅词典。</div>';
    }

    // 添加朗读按钮
    html += '<div style="margin-top:16px;text-align:center;">';
    html += '<button class="speak-btn" id="kwSpeakBtn">🔊 朗读</button>';
    html += '</div>';

    body.innerHTML = html;
    modal.classList.add('show');

    // 绑定朗读按钮
    var speakBtn = document.getElementById('kwSpeakBtn');
    if (speakBtn) {
      speakBtn.addEventListener('click', function () {
        if (VocabApp.speak) {
          VocabApp.speak(keyword);
        }
      });
    }
  }

  /**
   * 转义正则特殊字符
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

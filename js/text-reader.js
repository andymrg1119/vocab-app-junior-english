/**
 * text-reader.js
 * 课文逐字逐句讲解
 * 功能：逐句展示、中英对照、关键词高亮、点击朗读、关键词解释
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.TextReader = (function () {
  'use strict';

  var currentUnit = null;

  /**
   * 渲染课文讲解区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
   */
  function render(unit, container) {
    currentUnit = unit;

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

    html += '</div>';
    return html;
  }

  /**
   * 构建单句HTML
   */
  function buildSentenceHTML(sentence, paraIdx, sentIdx) {
    var sentenceId = 'sent_' + paraIdx + '_' + sentIdx;
    var html = '';
    html += '<div class="text-sentence" id="' + sentenceId + '">';
    html += '  <div class="text-sentence-en">' + highlightKeywords(sentence) + '</div>';
    html += '  <div class="text-sentence-cn">' + escapeHtml(sentence.cn || '') + '</div>';
    html += '  <div class="text-sentence-actions">';
    html += '    <button class="speak-btn" data-sentence="' + sentenceId + '">🔊 朗读</button>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /**
   * 高亮关键词
   * 使用单个正则一次性匹配所有关键词，避免多次replace破坏已生成的span标签
   */
  function highlightKeywords(sentence) {
    var en = sentence.en || '';
    var keywords = sentence.keywords || [];
    if (keywords.length === 0) return escapeHtml(en);

    // 去重 + 按长度降序（避免短词先匹配影响长词）
    var unique = [];
    for (var i = 0; i < keywords.length; i++) {
      if (unique.indexOf(keywords[i]) === -1) unique.push(keywords[i]);
    }
    unique.sort(function (a, b) {
      return b.length - a.length;
    });

    // 转义正则特殊字符后拼接为交替模式
    var pattern = unique.map(function (k) {
      return escapeRegExp(k);
    }).join('|');
    var regex = new RegExp('(' + pattern + ')', 'gi');

    // 转义HTML后单次替换：回调中直接生成span，不会再次扫描span内部
    var html = escapeHtml(en);
    return html.replace(regex, function (match) {
      var safe = escapeHtml(match);
      return '<span class="keyword" data-keyword="' + safe + '" title="点击查看解释">' + safe + '</span>';
    });
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 朗读按钮
    var speakBtns = document.querySelectorAll('.text-sentence-actions .speak-btn');
    for (var i = 0; i < speakBtns.length; i++) {
      speakBtns[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var sentenceId = this.getAttribute('data-sentence');
        speakSentence(sentenceId);
      });
    }

    // 关键词点击
    var keywords = document.querySelectorAll('.text-sentence-en .keyword');
    for (var j = 0; j < keywords.length; j++) {
      keywords[j].addEventListener('click', function (e) {
        e.stopPropagation();
        var keyword = this.getAttribute('data-keyword');
        showKeywordExplanation(keyword);
      });
    }
  }

  /**
   * 朗读句子
   */
  function speakSentence(sentenceId) {
    var sentenceEl = document.getElementById(sentenceId);
    if (!sentenceEl) return;
    var enEl = sentenceEl.querySelector('.text-sentence-en');
    if (!enEl) return;
    // 获取纯文本（去除HTML标签）
    var text = enEl.textContent || enEl.innerText;
    if (VocabApp.speak) {
      VocabApp.speak(text);
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

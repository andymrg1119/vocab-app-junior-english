/**
 * exam.js
 * 中考真题练习
 * 功能：选择题练习、即时判断、答案解析（含错题详细分析讲解）、成绩记录
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.Exam = (function () {
  'use strict';

  var currentUnit = null;
  var userAnswers = {};
  var scoreSaved = false; // 防止同一轮答题重复保存成绩

  /**
   * 渲染中考真题区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
   */
  function render(unit, container) {
    currentUnit = unit;
    userAnswers = {};
    scoreSaved = false;

    if (!unit || !unit.exams || unit.exams.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">暂无真题数据</div></div>';
      return;
    }

    container.innerHTML = buildHTML(unit.exams);
    bindEvents();
    updateScore();
  }

  /**
   * 构建HTML结构
   */
  function buildHTML(exams) {
    var html = '';
    html += '<div class="exam-container">';
    html += '  <div class="exam-score" id="examScore" style="display:none;"></div>';

    for (var i = 0; i < exams.length; i++) {
      var exam = exams[i];
      html += buildQuestionHTML(exam, i);
    }

    html += '</div>';
    return html;
  }

  /**
   * 构建单题HTML
   */
  function buildQuestionHTML(exam, index) {
    var html = '';
    html += '<div class="exam-question" id="exam_q_' + index + '">';
    html += '  <div class="exam-question-text">';
    html += '    <strong>第' + (index + 1) + '题.</strong> ' + escapeHtml(exam.question);
    html += '  </div>';
    html += '  <div class="exam-options">';

    for (var i = 0; i < exam.options.length; i++) {
      var option = exam.options[i];
      var optionLetter = option.charAt(0);
      html += '<button class="exam-option" data-q="' + index + '" data-option="' + optionLetter + '">';
      html += escapeHtml(option);
      html += '</button>';
    }

    html += '  </div>';

    // 简要解析（答对时显示）
    html += '  <div class="exam-explanation" id="exam_exp_' + index + '">';
    html += '    <span class="correct-answer">✅ 正确答案：' + exam.answer + '</span><br>';
    html +=    escapeHtml(exam.explanation);
    html += '  </div>';

    // 详细分析面板（答错时显示）
    html += '  <div class="exam-analysis" id="exam_analysis_' + index + '"></div>';

    html += '</div>';
    return html;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    var options = document.querySelectorAll('.exam-option');
    for (var i = 0; i < options.length; i++) {
      options[i].addEventListener('click', function () {
        var qIndex = parseInt(this.getAttribute('data-q'), 10);
        var optionLetter = this.getAttribute('data-option');

        // 如果已经答过，不允许再选
        if (userAnswers[qIndex] !== undefined) return;

        selectOption(qIndex, optionLetter);
      });
    }
  }

  /**
   * 选择选项
   */
  function selectOption(qIndex, optionLetter) {
    var exam = currentUnit.exams[qIndex];
    userAnswers[qIndex] = optionLetter;

    var questionEl = document.getElementById('exam_q_' + qIndex);
    if (!questionEl) return;

    var optionBtns = questionEl.querySelectorAll('.exam-option');
    var isCorrect = (optionLetter === exam.answer);

    for (var i = 0; i < optionBtns.length; i++) {
      var btn = optionBtns[i];
      var btnLetter = btn.getAttribute('data-option');
      btn.classList.add('selected');

      if (btnLetter === exam.answer) {
        btn.classList.add('correct');
      }
      if (btnLetter === optionLetter && !isCorrect) {
        btn.classList.add('wrong');
      }

      // 禁用所有按钮
      btn.style.cursor = 'default';
    }

    // 根据对错显示不同内容
    var expEl = document.getElementById('exam_exp_' + qIndex);
    var analysisEl = document.getElementById('exam_analysis_' + qIndex);

    if (isCorrect) {
      // 答对：显示简要解析
      if (expEl) {
        expEl.classList.add('show', 'correct');
      }
    } else {
      // 答错：隐藏简要解析，显示详细分析
      if (expEl) {
        expEl.style.display = 'none';
      }
      if (analysisEl) {
        analysisEl.innerHTML = buildAnalysisHTML(exam, optionLetter, qIndex);
        analysisEl.classList.add('show');
      }
      // 错题自动加入生词本
      var wrongWord = findWordInQuestion(exam);
      if (wrongWord && VocabApp.Storage && VocabApp.Storage.addToWordbook) {
        VocabApp.Storage.addToWordbook(wrongWord);
      }
    }

    updateScore();
  }

  /**
   * 从题目文本和选项中查找本单元单词（用于答错时自动加入生词本）
   */
  function findWordInQuestion(exam) {
    if (!currentUnit || !currentUnit.words || !currentUnit.words.length) return null;
    var text = (exam.question + ' ' + (exam.options || []).join(' ')).toLowerCase();
    for (var i = 0; i < currentUnit.words.length; i++) {
      var w = currentUnit.words[i];
      if (!w.word) continue;
      var word = w.word.toLowerCase();
      // 跳过太短的常见词，避免误收
      if (word.length < 3) continue;
      if (text.indexOf(word) >= 0) return w;
    }
    return null;
  }

  /**
   * 构建错题详细分析HTML
   * @param {Object} exam - 题目数据
   * @param {string} userAnswer - 用户选择的选项字母
   * @param {number} qIndex - 题目索引
   * @returns {string} HTML字符串
   */
  function buildAnalysisHTML(exam, userAnswer, qIndex) {
    var correctOptionText = getOptionText(exam, exam.answer);
    var wrongOptionText = getOptionText(exam, userAnswer);
    var knowledgePoint = exam.knowledgePoint || extractKnowledgePoint(exam);
    var analysis = exam.analysis || generateAnalysis(exam, userAnswer, knowledgePoint);

    var html = '';
    html += '<div class="analysis-header">';
    html += '  <span class="analysis-header-icon">❌</span>';
    html += '  <span class="analysis-header-text">这道题做错了，不要灰心！来看看详细解析</span>';
    html += '</div>';

    // 自动加入生词本提示
    var autoWord = findWordInQuestion(exam);
    if (autoWord) {
      html += '<div class="analysis-auto-add">📌 已自动加入生词本："' + escapeHtml(autoWord.word) + '"</div>';
    }

    // 答案对比
    html += '<div class="analysis-compare">';
    html += '  <div class="compare-row compare-wrong">';
    html += '    <span class="compare-label">你的答案</span>';
    html += '    <span class="compare-value">' + escapeHtml(userAnswer) + '. ' + escapeHtml(wrongOptionText) + '</span>';
    html += '  </div>';
    html += '  <div class="compare-row compare-correct">';
    html += '    <span class="compare-label">正确答案</span>';
    html += '    <span class="compare-value">' + escapeHtml(exam.answer) + '. ' + escapeHtml(correctOptionText) + '</span>';
    html += '  </div>';
    html += '</div>';

    // 考点
    html += '<div class="analysis-block">';
    html += '  <div class="analysis-block-title">📌 考点</div>';
    html += '  <div class="analysis-block-body">' + escapeHtml(knowledgePoint) + '</div>';
    html += '</div>';

    // 错误原因
    html += '<div class="analysis-block analysis-block-wrong">';
    html += '  <div class="analysis-block-title">🔍 为什么选错了？</div>';
    html += '  <div class="analysis-block-body">' + escapeHtml(analysis.why) + '</div>';
    html += '</div>';

    // 正确解析
    html += '<div class="analysis-block analysis-block-correct">';
    html += '  <div class="analysis-block-title">✅ 正确答案解析</div>';
    html += '  <div class="analysis-block-body">' + escapeHtml(analysis.correct) + '</div>';
    html += '</div>';

    // 知识点提示
    html += '<div class="analysis-block analysis-block-tip">';
    html += '  <div class="analysis-block-title">💡 记住这个知识点</div>';
    html += '  <div class="analysis-block-body">' + escapeHtml(analysis.tip) + '</div>';
    html += '</div>';

    // 朗读题目按钮
    html += '<button class="analysis-speak-btn" onclick="VocabApp.speak(\'' + escapeJsString(exam.question) + '\')">🔊 朗读题目</button>';

    return html;
  }

  /**
   * 从选项数组中获取指定字母对应的选项文本（去掉"A. "前缀）
   */
  function getOptionText(exam, letter) {
    for (var i = 0; i < exam.options.length; i++) {
      if (exam.options[i].charAt(0) === letter) {
        return exam.options[i].substring(3).trim();
      }
    }
    return '';
  }

  /**
   * 从题目数据中提取考点
   * 如果有 knowledgePoint 字段则直接使用，否则从 explanation 中推断
   */
  function extractKnowledgePoint(exam) {
    var exp = exam.explanation || '';

    // 尝试从 explanation 中提取考点关键词
    var patterns = [
      { regex: /(.+?)是固定搭配/, point: function (m) { return m[1] + '（固定搭配）'; } },
      { regex: /be动词/, point: function () { return 'be动词的用法'; } },
      { regex: /第三人称单数/, point: function () { return '一般现在时 · 第三人称单数'; } },
      { regex: /enjoy\s+doing/, point: function () { return 'enjoy doing sth（固定搭配）'; } },
      { regex: /be good at/, point: function () { return 'be good at（固定搭配）'; } },
      { regex: /a member of/, point: function () { return 'a member of（固定搭配）'; } },
      { regex: /频度副词/, point: function () { return '频度副词的用法'; } },
      { regex: /特殊疑问/, point: function () { return '特殊疑问句'; } },
      { regex: /可数|不可数/, point: function () { return '可数/不可数名词'; } },
      { regex: /some.*any|any.*some/, point: function () { return 'some/any的用法'; } },
      { regex: /现在进行时/, point: function () { return '现在进行时'; } },
      { regex: /一般过去时/, point: function () { return '一般过去时'; } },
      { regex: /一般将来时|will|shall/, point: function () { return '一般将来时'; } },
      { regex: /名词所有格/, point: function () { return '名词所有格'; } },
      { regex: /方位介词|方向介词/, point: function () { return '方位介词'; } },
      { regex: /can|could/, point: function () { return 'can/could的用法'; } },
      { regex: /形容词/, point: function () { return '形容词的用法'; } },
      { regex: /介词/, point: function () { return '介词的用法'; } },
      { regex: /祈使句/, point: function () { return '祈使句'; } },
      { regex: /固定搭配/, point: function () { return '固定搭配'; } }
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = exp.match(patterns[i].regex);
      if (match) {
        return patterns[i].point(match);
      }
    }

    // 回退到单元语法标题
    if (currentUnit && currentUnit.grammar && currentUnit.grammar.title) {
      return currentUnit.grammar.title;
    }

    return exp.split('，')[0] || exp;
  }

  /**
   * 自动生成错题分析（当 exam.analysis 字段不存在时）
   */
  function generateAnalysis(exam, userAnswer, knowledgePoint) {
    var explanation = exam.explanation || '';
    var wrongText = getOptionText(exam, userAnswer);
    var correctText = getOptionText(exam, exam.answer);
    var question = exam.question || '';

    // 错误原因
    var why = '你选择了"' + userAnswer + '. ' + wrongText + '"。';
    if (explanation.indexOf('固定搭配') >= 0) {
      why += '这是一个固定搭配题。' + explanation + ' 你选的选项不属于这个固定搭配，所以是错的。';
    } else if (explanation.indexOf('第三人称单数') >= 0) {
      why += '这道题考的是第三人称单数。' + explanation + ' 你选的选项没有按照第三人称单数的规则变化，所以不正确。';
    } else if (explanation.indexOf('be动词') >= 0 || explanation.indexOf('搭配') >= 0) {
      why += '这道题考的是be动词的搭配。' + explanation + ' 你选的be动词形式与主语不搭配，所以是错的。';
    } else if (explanation.indexOf('enjoy') >= 0) {
      why += '这道题考的是enjoy的用法。' + explanation + ' 你选的选项不符合enjoy后面接动词-ing形式的规则。';
    } else if (explanation.indexOf('介词') >= 0) {
      why += '这道题考的是介词的用法。' + explanation + ' 你选的介词在这里不合适。';
    } else if (explanation.indexOf('祈使句') >= 0) {
      why += '这道题考的是祈使句。' + explanation + ' 祈使句需要用动词原形开头，你选的选项不符合这个规则。';
    } else {
      why += explanation + ' 你选的选项不符合题目要求的语法规则，所以是错误的。';
    }

    // 正确解析
    var correct = '正确答案"' + exam.answer + '. ' + correctText + '"。';
    if (explanation.indexOf('固定搭配') >= 0) {
      correct += explanation + ' 做这类题时，要记住常见的固定搭配，看到关键词就能快速选出正确答案。';
    } else if (explanation.indexOf('第三人称单数') >= 0) {
      correct += explanation + ' 判断方法：先找到句子的主语，如果是第三人称单数（he/she/it/人名/单数名词），动词就要加s或es。';
    } else if (explanation.indexOf('be动词') >= 0 || explanation.indexOf('搭配') >= 0) {
      correct += explanation + ' 记住口诀：I搭配am，he/she/it搭配is，we/you/they搭配are。';
    } else if (explanation.indexOf('enjoy') >= 0) {
      correct += explanation + ' 类似enjoy后面接doing的动词还有：finish, practice, mind, keep等。';
    } else if (explanation.indexOf('介词') >= 0) {
      correct += explanation + ' 介词的选择要看上下文的意思和固定搭配，多积累常见的介词短语。';
    } else if (explanation.indexOf('祈使句') >= 0) {
      correct += explanation + ' 祈使句以动词原形开头，表示命令、请求或建议。';
    } else {
      correct += explanation + ' 做题时要先分析句子结构，确定时态、主语和谓语关系，再选择正确选项。';
    }

    // 知识点提示
    var tip = '考点：' + knowledgePoint + '。';
    tip += '建议把这道题和解析抄到错题本上，标注考点和错误原因。';
    tip += '过几天再拿出来复习一遍，确保真正掌握这个知识点。';
    tip += '如果类似的题再出错，就要重点复习课本上对应的语法部分了。';

    return { why: why, correct: correct, tip: tip };
  }

  /**
   * 更新成绩显示
   */
  function updateScore() {
    var scoreEl = document.getElementById('examScore');
    if (!scoreEl || !currentUnit || !currentUnit.exams) return;

    var total = currentUnit.exams.length;
    var answered = 0;
    var correct = 0;

    for (var key in userAnswers) {
      if (userAnswers.hasOwnProperty(key)) {
        var qIndex = parseInt(key, 10);
        answered++;
        if (userAnswers[key] === currentUnit.exams[qIndex].answer) {
          correct++;
        }
      }
    }

    if (answered > 0) {
      scoreEl.style.display = 'block';
      scoreEl.textContent = '已答 ' + answered + '/' + total + ' 题，正确 ' + correct + ' 题';

      if (answered === total && !scoreSaved) {
        scoreSaved = true;
        var rate = Math.round((correct / total) * 100);
        scoreEl.textContent = '完成全部练习！正确率：' + rate + '%（' + correct + '/' + total + '）';

        // 保存成绩（每轮只保存一次）
        VocabApp.Storage.saveExamScore(currentUnit.unitId, {
          score: rate,
          correct: correct,
          total: total,
          date: new Date().toISOString()
        });

        // 闯关：一整套全部答对即通关，解锁默写环节
        if (correct === total && !VocabApp.Storage.isExamPassed(currentUnit.unitId)) {
          VocabApp.Storage.markExamPassed(currentUnit.unitId);
          if (VocabApp.refreshGating) VocabApp.refreshGating();
          if (VocabApp.showToast) VocabApp.showToast('🎉 中考真题全对！已解锁默写环节');
        }
      }
    }
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

  /**
   * JS字符串转义（用于onclick内联）
   */
  function escapeJsString(text) {
    if (!text) return '';
    return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  return {
    render: render
  };
})();

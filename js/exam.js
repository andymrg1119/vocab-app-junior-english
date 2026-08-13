/**
 * exam.js
 * 中考真题练习
 * 功能：选择题练习、即时判断、答案解析、成绩记录
 */
window.VocabApp = window.VocabApp || {};

window.VocabApp.Exam = (function () {
  'use strict';

  var currentUnit = null;
  var userAnswers = {};

  /**
   * 渲染中考真题区域
   * @param {Object} unit - 单元数据
   * @param {HTMLElement} container - 容器元素
   */
  function render(unit, container) {
    currentUnit = unit;
    userAnswers = {};

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
    html += '  <div class="exam-explanation" id="exam_exp_' + index + '">';
    html += '    <span class="correct-answer">正确答案：' + exam.answer + '</span><br>';
    html +=    escapeHtml(exam.explanation);
    html += '  </div>';
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

    // 显示解析
    var expEl = document.getElementById('exam_exp_' + qIndex);
    if (expEl) {
      expEl.classList.add('show');
    }

    updateScore();
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

      if (answered === total) {
        var rate = Math.round((correct / total) * 100);
        scoreEl.textContent = '完成全部练习！正确率：' + rate + '%（' + correct + '/' + total + '）';

        // 保存成绩
        VocabApp.Storage.saveExamScore(currentUnit.unitId, {
          score: rate,
          correct: correct,
          total: total,
          date: new Date().toISOString()
        });
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

  return {
    render: render
  };
})();

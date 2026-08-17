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

  /**
   * 带回调的朗读：朗读结束后执行回调
   * 用于跟读功能：先播放，播完再开始录音
   */
  function speakWithCallback(text, callback) {
    if (!window.speechSynthesis) {
      if (callback) callback();
      return;
    }
    window.speechSynthesis.cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    // 优先选择英式英语语音
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
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].lang.indexOf('en') === 0) {
          utterance.voice = voices[j];
          break;
        }
      }
    }

    var fired = false;
    function safeCallback() {
      if (!fired) {
        fired = true;
        if (callback) callback();
      }
    }

    utterance.onend = safeCallback;
    utterance.onerror = safeCallback;

    window.speechSynthesis.speak(utterance);

    // 超时保护：如果 onend 没触发，按预估时间后继续
    var wordCount = text.split(/\s+/).length;
    var estimatedMs = Math.max(2000, wordCount * 700 + 1000);
    setTimeout(safeCallback, estimatedMs);
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
     跟读评分模块 (ReadAlong)
     支持: 自动语音识别(Chrome桌面) + 手动录音对比(移动端)
     80分以上为过关
     ============================================================ */

  var ReadAlong = {
    /**
     * 启动跟读流程：先播放发音，再录音
     */
    start: function (targetText, container) {
      var self = this;

      container.innerHTML = '<div class="readalong-status speaking"><span class="readalong-pulse"></span>🔊 正在播放发音，请仔细听...</div>';

      speakWithCallback(targetText, function () {
        setTimeout(function () {
          self._beginRecordingPhase(targetText, container);
        }, 300);
      });
    },

    /**
     * 选择录音模式：自动识别 or 手动录音
     */
    _beginRecordingPhase: function (targetText, container) {
      var self = this;
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

      if (SpeechRecognition) {
        // 模式A：浏览器支持语音识别（桌面Chrome）
        this._autoRecognize(targetText, container);
      } else if (hasGetUserMedia) {
        // 模式B：支持录音但不支持识别（手机浏览器）
        this._showManualReady(targetText, container);
      } else {
        // 模式C：都不支持
        container.innerHTML =
          '<div class="readalong-error">⚠️ 当前浏览器不支持语音功能</div>' +
          '<div class="readalong-tip">💡 请使用 Chrome 或 Safari 浏览器打开<br>微信内请点击右上角"···"选择"在浏览器中打开"</div>';
      }
    },

    /**
     * 模式A：自动语音识别
     */
    _autoRecognize: function (targetText, container) {
      var self = this;
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      container.innerHTML =
        '<div class="readalong-status recording">' +
        '<span class="readalong-mic-icon">🎤</span>' +
        '<span class="readalong-rec-text">正在听你读...</span>' +
        '<div class="readalong-wave-container">' +
        '<span class="readalong-wave"></span>' +
        '<span class="readalong-wave"></span>' +
        '<span class="readalong-wave"></span>' +
        '</div>' +
        '</div>';

      var recognition = new SpeechRecognition();
      recognition.lang = 'en-GB';
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;
      recognition.continuous = false;

      var hasResult = false;

      recognition.onresult = function (event) {
        hasResult = true;
        var results = event.results[0];
        var bestScore = 0;
        var bestText = '';
        for (var i = 0; i < results.length; i++) {
          var transcript = results[i].transcript.trim().toLowerCase();
          var score = self._calculateScore(transcript, targetText.toLowerCase());
          if (score > bestScore) {
            bestScore = score;
            bestText = transcript;
          }
        }
        self._showResult(targetText, bestText, Math.round(bestScore), container, false);
      };

      recognition.onerror = function (event) {
        hasResult = true;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // 麦克风权限被拒，切换到手动录音模式
          self._showManualReady(targetText, container);
          return;
        }
        var errorMsg = '识别失败';
        if (event.error === 'no-speech') errorMsg = '没有听到声音，请大声读出来';
        else if (event.error === 'aborted') errorMsg = '录音被中断，请重试';
        else errorMsg = '识别出错：' + event.error;
        self._showError(targetText, errorMsg, container);
      };

      recognition.onend = function () {
        if (!hasResult) {
          self._showError(targetText, '没有听到声音，请大声读出来', container);
        }
      };

      try {
        recognition.start();
      } catch (e) {
        // 识别启动失败，切换到手动录音模式
        self._showManualReady(targetText, container);
      }
    },

    /**
     * 模式B：手动录音 + 自我评估
     * 使用 getUserMedia + MediaRecorder 录音，播放后让孩子自己对比
     */
    _showManualReady: function (targetText, container) {
      var self = this;

      container.innerHTML =
        '<div class="readalong-manual">' +
        '  <div class="readalong-manual-tip">🎤 请跟读以下内容：</div>' +
        '  <div class="readalong-manual-text">' + escapeHtml(targetText) + '</div>' +
        '  <button class="readalong-record-btn" id="readalongRecord">🎤 点击开始录音</button>' +
        '  <div class="readalong-manual-hint">点击按钮后大声朗读，读完再点击停止</div>' +
        '</div>';

      var recordBtn = container.querySelector('#readalongRecord');
      if (!recordBtn) return;

      var recording = false;
      var mediaRecorder = null;
      var audioChunks = [];
      var stream = null;
      var autoStopTimer = null;

      recordBtn.addEventListener('click', function () {
        if (!recording) {
          // 开始录音
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (s) {
              stream = s;
              // 检测支持的音频格式
              var mimeType = '';
              var types = ['audio/webm', 'audio/mp4', 'audio/ogg'];
              for (var i = 0; i < types.length; i++) {
                if (MediaRecorder.isTypeSupported(types[i])) {
                  mimeType = types[i];
                  break;
                }
              }
              mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType: mimeType })
                : new MediaRecorder(stream);
              audioChunks = [];

              mediaRecorder.ondataavailable = function (e) {
                if (e.data && e.data.size > 0) audioChunks.push(e.data);
              };

              mediaRecorder.onstop = function () {
                var blobType = mediaRecorder.mimeType || 'audio/webm';
                var audioBlob = new Blob(audioChunks, { type: blobType });
                var audioUrl = URL.createObjectURL(audioBlob);
                self._showPlayback(targetText, audioUrl, container);
                if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
                if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
              };

              mediaRecorder.start();
              recording = true;
              recordBtn.textContent = '⏹️ 点击停止录音';
              recordBtn.classList.add('recording');

              // 15秒后自动停止
              autoStopTimer = setTimeout(function () {
                if (recording && mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                  recording = false;
                }
              }, 15000);
            })
            .catch(function (err) {
              var msg = '无法访问麦克风';
              if (err.name === 'NotAllowedError') {
                msg = '麦克风权限被拒绝，请在浏览器设置中允许使用麦克风';
              } else if (err.name === 'NotFoundError') {
                msg = '未找到麦克风设备';
              } else if (err.message) {
                msg = '无法访问麦克风：' + err.message;
              }
              self._showError(targetText, msg, container);
            });
        } else {
          // 停止录音
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          recording = false;
          recordBtn.textContent = '处理中...';
          recordBtn.disabled = true;
        }
      });
    },

    /**
     * 播放录音 + 自我评估
     */
    _showPlayback: function (targetText, audioUrl, container) {
      var self = this;

      container.innerHTML =
        '<div class="readalong-playback">' +
        '  <div class="readalong-playback-title">🎧 请听你的录音，对比发音</div>' +
        '  <div class="readalong-audio-section">' +
        '    <div class="readalong-audio-row">' +
        '      <span class="readalong-audio-label">🔊 原文发音：</span>' +
        '      <button class="readalong-play-btn" id="playOriginal">▶ 播放</button>' +
        '    </div>' +
        '    <div class="readalong-audio-row">' +
        '      <span class="readalong-audio-label">🎤 你的录音：</span>' +
        '      <audio controls class="readalong-audio-player" src="' + audioUrl + '"></audio>' +
        '    </div>' +
        '  </div>' +
        '  <div class="readalong-assess-title">你觉得读得怎么样？</div>' +
        '  <div class="readalong-assess-btns">' +
        '    <button class="readalong-assess-btn pass" id="readalongPass">✓ 读对了（过关）</button>' +
        '    <button class="readalong-assess-btn retry" id="readalongRetry">🔄 再读一次</button>' +
        '  </div>' +
        '</div>';

      var playBtn = container.querySelector('#playOriginal');
      if (playBtn) {
        playBtn.addEventListener('click', function () { speak(targetText); });
      }
      var passBtn = container.querySelector('#readalongPass');
      if (passBtn) {
        passBtn.addEventListener('click', function () {
          self._showResult(targetText, '', 80, container, true);
        });
      }
      var retryBtn = container.querySelector('#readalongRetry');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          ReadAlong.start(targetText, container);
        });
      }
    },

    /**
     * 显示评分结果
     */
    _showResult: function (target, transcript, score, container, isManual) {
      var passed = score >= 80;
      var html = '';
      html += '<div class="readalong-result ' + (passed ? 'pass' : 'fail') + '">';
      html += '  <div class="readalong-score-circle ' + (passed ? 'pass' : 'fail') + '">';
      if (isManual) {
        html += '    <span class="score-num">✓</span>';
        html += '    <span class="score-unit">过关</span>';
      } else {
        html += '    <span class="score-num">' + score + '</span>';
        html += '    <span class="score-unit">分</span>';
      }
      html += '  </div>';
      html += '  <div class="readalong-status-text ' + (passed ? 'pass' : 'fail') + '">';
      html += passed ? '🎉 过关！' : '💪 未过关（需80分）';
      html += '  </div>';
      if (!isManual) {
        html += '  <div class="readalong-detail">';
        html += '    <div class="readalong-said"><span class="detail-label">你说：</span>' + escapeHtml(transcript || '（未识别）') + '</div>';
        html += '    <div class="readalong-target"><span class="detail-label">原文：</span>' + escapeHtml(target) + '</div>';
        html += '  </div>';
      } else {
        html += '  <div class="readalong-detail manual-detail">';
        html += '    <div class="readalong-target"><span class="detail-label">原文：</span>' + escapeHtml(target) + '</div>';
        html += '  </div>';
      }
      if (!passed) {
        html += '  <button class="readalong-retry-btn">🔄 再读一次</button>';
      } else {
        html += '  <div class="readalong-passed-msg">✨ ' + (isManual ? '自我评估过关！' : '发音很棒！') + '</div>';
      }
      html += '</div>';

      container.innerHTML = html;

      var retryBtn = container.querySelector('.readalong-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          ReadAlong.start(target, container);
        });
      }
    },

    /**
     * 显示错误
     */
    _showError: function (target, message, container) {
      var html = '';
      html += '<div class="readalong-error">' + message + '</div>';
      html += '<button class="readalong-retry-btn">🔄 再读一次</button>';
      container.innerHTML = html;

      var retryBtn = container.querySelector('.readalong-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          ReadAlong.start(target, container);
        });
      }
    },

    /**
     * 计算相似度得分（0-100）
     * 使用 Levenshtein 编辑距离算法
     */
    _calculateScore: function (str1, str2) {
      // 去标点、去多余空格
      str1 = str1.replace(/[.,!?;:'"`""'']/g, '').replace(/\s+/g, ' ').trim();
      str2 = str2.replace(/[.,!?;:'"`""'']/g, '').replace(/\s+/g, ' ').trim();

      if (str1 === str2) return 100;
      if (str1.length === 0 || str2.length === 0) return 0;

      var distance = this._levenshtein(str1, str2);
      var maxLength = Math.max(str1.length, str2.length);
      var score = Math.max(0, (1 - distance / maxLength) * 100);
      return Math.round(score);
    },

    /**
     * Levenshtein 编辑距离
     */
    _levenshtein: function (str1, str2) {
      var matrix = [];
      for (var i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      for (var j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      for (var i = 1; i <= str2.length; i++) {
        for (var j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[str2.length][str1.length];
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
      html += '  <div class="phrase-actions">';
      html += '    <button class="speak-btn" data-phrase="' + i + '">🔊 朗读</button>';
      html += '    <button class="readalong-btn" data-phrase="' + i + '">🎤 跟读</button>';
      html += '  </div>';
      html += '  <div class="readalong-result-container" id="phraseReadAlong_' + i + '"></div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // 绑定朗读
    var speakBtns = container.querySelectorAll('.phrase-actions .speak-btn');
    for (var s = 0; s < speakBtns.length; s++) {
      speakBtns[s].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-phrase'), 10);
        speak(unit.phrases[idx].phrase);
      });
    }

    // 绑定跟读
    var readAlongBtns = container.querySelectorAll('.phrase-actions .readalong-btn');
    for (var r = 0; r < readAlongBtns.length; r++) {
      readAlongBtns[r].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-phrase'), 10);
        var resultContainer = document.getElementById('phraseReadAlong_' + idx);
        if (resultContainer && VocabApp.ReadAlong) {
          VocabApp.ReadAlong.start(unit.phrases[idx].phrase, resultContainer);
        }
      });
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
      html += '  <div class="sentence-actions">';
      html += '    <button class="speak-btn" data-sentence="' + i + '">🔊 朗读</button>';
      html += '    <button class="readalong-btn" data-sentence="' + i + '">🎤 跟读</button>';
      html += '  </div>';
      html += '  <div class="readalong-result-container" id="sentenceReadAlong_' + i + '"></div>';
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // 绑定朗读
    var speakBtns = container.querySelectorAll('.sentence-actions .speak-btn');
    for (var j = 0; j < speakBtns.length; j++) {
      speakBtns[j].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-sentence'), 10);
        speak(unit.sentences[idx].en);
      });
    }

    // 绑定跟读
    var readAlongBtns = container.querySelectorAll('.sentence-actions .readalong-btn');
    for (var r = 0; r < readAlongBtns.length; r++) {
      readAlongBtns[r].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-sentence'), 10);
        var resultContainer = document.getElementById('sentenceReadAlong_' + idx);
        if (resultContainer && VocabApp.ReadAlong) {
          VocabApp.ReadAlong.start(unit.sentences[idx].en, resultContainer);
        }
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
  VocabApp.speakWithCallback = speakWithCallback;
  VocabApp.ReadAlong = ReadAlong;
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

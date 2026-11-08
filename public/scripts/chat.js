(function () {
  var BOT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="8" width="16" height="12" rx="3"></rect><path d="M12 8V4"></path><circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none"></circle><circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"></circle><path d="M9 17h6"></path></svg>';
  var TICKS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m1.5 12 4.5 4.5L16 6"></path><path d="m8.5 12 4.5 4.5L23 6"></path></svg>';
  var HISTORY_LIMIT = 60;
  var HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  function csrfToken() {
    var tokenMeta = document.querySelector('meta[name="csrf-token"]');
    return tokenMeta ? tokenMeta.getAttribute('content') : '';
  }

  function scrollToLatest(messages) {
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function formatInline(escapedText) {
    var codes = [];
    var text = escapedText.replace(/`([^`\n]+)`/g, function (match, code) {
      var index = codes.push('<code>' + code + '</code>') - 1;
      return '\u0001C' + index + '\u0001';
    });

    text = text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_([^_\n]+)_/g, '$1<em>$2</em>');

    return text.replace(/\u0001C(\d+)\u0001/g, function (match, index) {
      return codes[Number(index)];
    });
  }

  function formatBotText(raw) {
    var text = String(raw || '').replace(/\r\n?/g, '\n');
    var blocks = [];

    text = text.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, function (match, code) {
      var index = blocks.push('<pre><code>' + escapeHtml(code.replace(/^\n+|\n+$/g, '')) + '</code></pre>') - 1;
      return '\u0000B' + index + '\u0000';
    });

    var lines = escapeHtml(text).split('\n');
    var html = [];
    var listType = null;

    function closeList() {
      if (listType) {
        html.push('</' + listType + '>');
        listType = null;
      }
    }

    function openList(type) {
      if (listType !== type) {
        closeList();
        html.push('<' + type + '>');
        listType = type;
      }
    }

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();

      if (!line) {
        closeList();
        continue;
      }

      var block = line.match(/^\u0000B(\d+)\u0000$/);
      if (block) {
        closeList();
        html.push(blocks[Number(block[1])]);
        continue;
      }

      var heading = line.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        closeList();
        html.push('<h4>' + formatInline(heading[1]) + '</h4>');
        continue;
      }

      var bullet = line.match(/^[-*\u2022]\s+(.+)$/);
      if (bullet) {
        openList('ul');
        html.push('<li>' + formatInline(bullet[1]) + '</li>');
        continue;
      }

      var numbered = line.match(/^\d+[.)]\s+(.+)$/);
      if (numbered) {
        openList('ol');
        html.push('<li>' + formatInline(numbered[1]) + '</li>');
        continue;
      }

      if (/^([-*_])(?:\s*\1){2,}$/.test(line)) {
        closeList();
        html.push('<hr>');
        continue;
      }

      closeList();
      html.push('<p>' + formatInline(line) + '</p>');
    }

    closeList();
    return html.join('');
  }

  function historyKey(root) {
    var userKey = root.getAttribute('data-chat-user-id') || root.getAttribute('data-chat-user') || 'guest';
    return 'kwust-smarthealth.chat.' + userKey;
  }

  function loadHistory(key) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return [];
      var stored = JSON.parse(raw);
      if (!stored || !Array.isArray(stored.messages)) return [];
      if (stored.updatedAt && Date.now() - stored.updatedAt > HISTORY_TTL_MS) {
        window.localStorage.removeItem(key);
        return [];
      }
      return stored.messages
        .filter(function (entry) {
          return entry && (entry.role === 'user' || entry.role === 'bot') && typeof entry.text === 'string';
        })
        .slice(-HISTORY_LIMIT);
    } catch (error) {
      return [];
    }
  }

  function saveHistory(key, messages) {
    try {
      window.localStorage.setItem(key, JSON.stringify({
        updatedAt: Date.now(),
        messages: messages.slice(-HISTORY_LIMIT)
      }));
    } catch (error) {
      // Storage may be unavailable or full; chat still works without history.
    }
  }

  function initChat(root) {
    var form = root.querySelector('[data-chat-form]');
    var input = root.querySelector('[data-chat-input]');
    var messages = root.querySelector('[data-chat-messages]');
    var send = root.querySelector('[data-chat-send]');
    var clear = root.querySelector('[data-chat-clear]');
    if (!form || !input || !messages) return;

    var userName = (root.getAttribute('data-chat-user') || 'You').trim();
    var greeting = messages.querySelector('[data-chat-greeting]');
    var storageKey = historyKey(root);
    var history = loadHistory(storageKey);

    function appendUser(text) {
      var row = document.createElement('div');
      row.className = 'chat-message user';

      var body = document.createElement('div');
      body.className = 'chat-message-body';

      var name = document.createElement('span');
      name.className = 'chat-name';
      name.textContent = userName;

      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.textContent = text;

      var ticks = document.createElement('span');
      ticks.className = 'chat-ticks';
      ticks.title = 'Read';
      ticks.setAttribute('aria-label', 'Read');
      ticks.innerHTML = TICKS_ICON;

      body.appendChild(name);
      body.appendChild(bubble);
      body.appendChild(ticks);
      row.appendChild(body);
      messages.appendChild(row);
      scrollToLatest(messages);
    }

    function appendBot(text, isError) {
      var row = document.createElement('div');
      row.className = 'chat-message bot' + (isError ? ' error' : '');

      var avatar = document.createElement('span');
      avatar.className = 'chat-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.innerHTML = BOT_ICON;

      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.innerHTML = formatBotText(text);

      row.appendChild(avatar);
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollToLatest(messages);
    }

    function record(entry) {
      history.push(entry);
      if (history.length > HISTORY_LIMIT) history = history.slice(-HISTORY_LIMIT);
      saveHistory(storageKey, history);
    }

    function clearRenderedMessages() {
      var children = Array.prototype.slice.call(messages.children);
      for (var i = 0; i < children.length; i += 1) {
        if (children[i] !== greeting) messages.removeChild(children[i]);
      }
    }

    for (var h = 0; h < history.length; h += 1) {
      if (history[h].role === 'user') {
        appendUser(history[h].text);
      } else {
        appendBot(history[h].text, Boolean(history[h].error));
      }
    }

    if (clear) {
      clear.addEventListener('click', function () {
        history = [];
        try {
          window.localStorage.removeItem(storageKey);
        } catch (error) {
          // Ignore storage errors.
        }
        clearRenderedMessages();
        scrollToLatest(messages);
        input.focus();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      appendUser(text);
      record({ role: 'user', text: text, error: false });
      input.value = '';
      input.disabled = true;
      if (send) {
        send.disabled = true;
        send.classList.add('is-loading');
      }

      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken()
        },
        body: JSON.stringify({ message: text })
      })
        .then(function (response) {
          if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Authentication required');
          }
          return response.json().then(function (body) {
            if (!response.ok) throw new Error(body.error || 'Unable to send message');
            return body;
          });
        })
        .then(function (body) {
          appendBot(body.reply, false);
          record({ role: 'bot', text: body.reply, error: false });
        })
        .catch(function (error) {
          var message = error.message || 'Unable to contact the health assistant right now.';
          appendBot(message, true);
          record({ role: 'bot', text: message, error: true });
        })
        .finally(function () {
          input.disabled = false;
          if (send) {
            send.disabled = false;
            send.classList.remove('is-loading');
          }
          input.focus();
        });
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var chats = document.querySelectorAll('[data-chat]');
    for (var i = 0; i < chats.length; i += 1) initChat(chats[i]);
  });
})();
